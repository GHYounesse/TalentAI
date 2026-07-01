<?php

namespace App\Http\Controllers\Brief;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use PhpOffice\PhpWord\Element\Table;
use PhpOffice\PhpWord\IOFactory;
use Smalot\PdfParser\Parser as PdfParser;

class BriefImportController extends Controller
{
    /**
     * Extract structured data from an uploaded job description file (PDF, DOC, DOCX)
     * and return it as a JSON object by calling the Mistral AI API.
     *
     * @param  Request  $request  Must contain a `file` field (pdf|doc|docx, max 5 MB)
     * @return JsonResponse Structured brief data on success, or an error payload with
     *                      422 (unreadable file) / 502 (AI service unavailable)
     */
    public function extractFromFile(Request $request): JsonResponse
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $this->authorize('briefs.create');

            $request->validate([
                'file' => 'required|file|mimes:pdf,doc,docx|max:5120',
            ]);

            $file = $request->file('file');
            $text = $this->extractText($file);

            if (strlen(trim($text)) < 80) {
                $logger->log(
                    'brief.import.unreadable',
                    'Fichier importé vide ou illisible.',
                    ['original_name' => $file->getClientOriginalName()],
                );

                return response()->json([
                    'error' => 'Le fichier semble vide ou illisible.',
                ], 422);
            }

            $structured = $this->callMistral($text);

            if ($structured === null) {
                $logger->log(
                    'brief.import.ai_error',
                    'Le service Mistral AI est indisponible ou a retourné une réponse invalide.',
                    ['original_name' => $file->getClientOriginalName()],
                );

                return response()->json([
                    'error' => 'Le service d\'analyse est indisponible. Réessayez.',
                ], 502);
            }

            $logger->log(
                'brief.import.success',
                'Extraction réussie depuis une fiche de poste importée.',
                [
                    'original_name' => $file->getClientOriginalName(),
                    'fields_extracted' => array_keys(array_filter($structured)),
                ],
            );

            return response()->json($structured);

        } catch (\Throwable $e) {
            $logger->log(
                'brief.import.error',
                'Erreur inattendue lors de l\'import de la fiche de poste : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
            );

            return response()->json([
                'error' => 'Une erreur inattendue est survenue.',
            ], 500);
        }
    }

    private function extractText($file): string
    {
        if ($file->getMimeType() === 'application/pdf') {
            $parser = new PdfParser;

            return $parser->parseFile($file->getRealPath())->getText();
        }

        $phpWord = IOFactory::load($file->getRealPath());
        $chunks = [];
        foreach ($phpWord->getSections() as $section) {
            foreach ($section->getElements() as $el) {
                $chunks[] = $this->extractElementText($el);
            }
        }

        return implode("\n", array_filter($chunks));
    }

    private function extractElementText($el): string
    {
        if (method_exists($el, 'getText') && ! method_exists($el, 'getElements')) {
            return trim((string) $el->getText());
        }
        if ($el instanceof Table) {
            $rows = [];
            foreach ($el->getRows() as $row) {
                $cells = [];
                foreach ($row->getCells() as $cell) {
                    $cellText = implode(' ', array_filter(
                        array_map([$this, 'extractElementText'], $cell->getElements())
                    ));
                    if ($cellText !== '') {
                        $cells[] = $cellText;
                    }
                }
                if ($cells) {
                    $rows[] = implode(' | ', $cells);
                }
            }

            return implode("\n", $rows);
        }
        if (method_exists($el, 'getElements')) {
            return implode(' ', array_filter(
                array_map([$this, 'extractElementText'], $el->getElements())
            ));
        }

        return '';
    }

    private function callMistral(string $text): ?array
    {
        $prompt = <<<PROMPT
            Tu es un assistant RH expert. Analyse cette fiche de poste et extrais les informations.
            Retourne UNIQUEMENT un objet JSON valide, sans markdown, sans explication, sans backticks.
            Si une information est absente ou incertaine, retourne null pour ce champ — ne devine pas.

            Règles strictes — utilise UNIQUEMENT les valeurs autorisées listées ci-dessous pour chaque champ contraint.

            ─── CHAMPS CONTRAINTS ───

            sector — choisir UNE valeur parmi :
            "commerce"   → Commerce & Vente
            "tech"        → Tech & Digital
            "finance"     → Finance & Audit
            "rh"          → RH & Formation
            "marketing"   → Marketing
            "operations"  → Opérations & Logistique
            "juridique"   → Juridique
            "sante"       → Santé

            contract_type — choisir UNE valeur parmi :
            "CDI", "CDD", "Freelance", "Stage", "Alternance"

            education_level — choisir UNE valeur parmi :
            "bac"               → Bac
            "bac2"              → Bac+2
            "bac3"              → Bac+3 / Licence
            "bac5"              → Bac+5 / Master
            "bac5_grande_ecole" → Bac+5 Grande École
            "doctorat"          → Doctorat

            min_experience_years — choisir UNE valeur parmi (choisir la tranche la plus proche) :
            "1"  → Débutant (0 an)
            "2"  → 1-2 ans
            "3"  → 3-5 ans
            "4"  → 6-10 ans
            "5"  → 10 ans+

            seniority_level — choisir UNE valeur parmi (ou null si non précisé) :
            "100" → En formation
            "110" → Débutant
            "120" → Cadre supérieur
            "130" → Stratégique
            "200" → Gestionnaire débutant
            "210" → Gestionnaire expérimenté
            "220" → Directeur
            "300" → Vice-président
            "310" → CXO
            "320" → Propriétaire / Associé

            gender_pref — choisir UNE valeur parmi :
            "any" → Indifférent (utiliser si non précisé)
            "M"   → Homme
            "F"   → Femme

            age_range — choisir UNE valeur parmi (ou null si non précisé) :
            "20-30" → 20 – 30 ans
            "25-35" → 25 – 35 ans
            "28-40" → 28 – 40 ans
            "32-48" → 32 – 48 ans
            "35-55" → 35 – 55 ans

            languages — liste de valeurs parmi (séparées par ", ") :
            "Arabe", "Français", "Anglais", "Espagnol", "Amazigh"
            → N'inclure que les langues explicitement mentionnées dans le document.
            → null si aucune langue mentionnée.

            ─── CONFIANCE ───

            Ajoute un champ "_confidence" : objet JSON où chaque clé est un nom de champ
            et la valeur est "high" ou "low".
            - "high" : information explicitement mentionnée dans le document.
            - "low"  : information déduite, implicite ou incertaine.
            Inclure uniquement les champs qui ont une valeur non-null.

            ─── CHAMPS LIBRES ───

            title            (string)      : intitulé exact du poste
            location         (string)      : ville et/ou pays
            salary_range     (string|null) : fourchette salariale, ex "45-55K€" — null si non précisée
            target_companies (string|null) : noms d'entreprises séparés par virgule — null si non précisé
            mission_description (string)   : description complète du poste et des responsabilités
            required_skills  (string)      : compétences techniques séparées par virgule
            soft_skills      (string|null) : soft skills séparées par virgule — null si non précisées

            ─── FICHE DE POSTE ───

            $text
            PROMPT;

        $response = Http::timeout(30)
            ->withHeaders([
                'Authorization' => 'Bearer '.config('services.openrouter.key'),
                'HTTP-Referer' => config('app.url'),
                'X-Title' => config('app.name'),
            ])
            ->post('https://openrouter.ai/api/v1/chat/completions', [
                'model' => 'mistralai/mistral-small-3.2-24b-instruct',
                'response_format' => ['type' => 'json_object'],
                'temperature' => 0,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

        if ($response->failed()) {
            return null;
        }

        $content = $response->json('choices.0.message.content', '{}');

        return json_decode($content, true) ?? null;
    }
}
