<?php

namespace App\Services\Transcription;

use App\Models\UserApiToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TranscriptionAnalysisService
{
    // OpenRouter model string for Claude Sonnet 4
    // private const MODEL = 'anthropic/claude-sonnet-4';
    private const MODEL = 'mistralai/mistral-small-3.2-24b-instruct';

    // private const MAX_TOKENS = 4096;
    private const MAX_TOKENS = 2048;

    private string $apiKey;

    private string $apiUrl;

    public function __construct()
    {
        $tokenRecord = UserApiToken::where('user_id', auth()->id())
            ->where('provider', 'openrouter')
            ->first();

        $token = $tokenRecord?->token ?? config('services.openrouter.key');
        $this->apiKey = $token;
        $this->apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    }

    /**
     * Analyse a diarized interview transcript against a job brief and peer candidates.
     *
     * @param  string  $diarizedTranscript  The speaker-labeled transcript
     * @param  string  $brief  The job/role brief used as reference
     * @param  array<string>  $otherCandidates  Optional: summaries/fiches of other candidates for comparison
     * @return array{
     *     global_score: int,
     *     verdict: string,
     *     criteria: array<string, array{score: int, comment: string}>,
     *     strengths: string[],
     *     red_flags: string[],
     *     key_excerpts: array<array{speaker: string, text: string, timestamp: string|null, criterion: string}>,
     *     raw: string
     * }
     *
     * @throws \RuntimeException on API or parsing failure
     */
    public function analyse(
        string $diarizedTranscript,
        string $brief,
        array $otherCandidates = []
    ): array {
        $start = microtime(true);

        Log::info('TranscriptionAnalysisService: starting analysis', [
            'model' => self::MODEL,
            'transcript_length' => mb_strlen($diarizedTranscript),
            'brief_length' => mb_strlen($brief),
            'peer_count' => count($otherCandidates),
        ]);

        $systemPrompt = $this->buildSystemPrompt();
        $userPrompt = $this->buildUserPrompt($diarizedTranscript, $brief, $otherCandidates);

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiKey}",
            'Content-Type' => 'application/json',
            'HTTP-Referer' => config('app.url'),
            'X-Title' => config('app.name'),
        ])->timeout(120)->post($this->apiUrl, [
            'model' => self::MODEL,
            'max_tokens' => self::MAX_TOKENS,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user',   'content' => $userPrompt],
            ],
        ]);

        $durationMs = (int) ((microtime(true) - $start) * 1000);

        if (! $response->successful()) {
            Log::error('TranscriptionAnalysisService: OpenRouter API error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'duration_ms' => $durationMs,
            ]);
            throw new \RuntimeException(
                "OpenRouter API returned HTTP {$response->status()}: {$response->body()}"
            );
        }

        $raw = $response->json('choices.0.message.content') ?? '';
        $finishReason = $response->json('choices.0.finish_reason');
        $usage = $response->json('usage');

        if (empty($raw)) {
            Log::error('TranscriptionAnalysisService: empty response from OpenRouter', [
                'finish_reason' => $finishReason,
                'duration_ms' => $durationMs,
                'full_body' => $response->body(),
            ]);
            throw new \RuntimeException('OpenRouter API returned an empty response.');
        }

        if ($finishReason === 'length') {
            Log::warning('TranscriptionAnalysisService: response truncated by max_tokens', [
                'max_tokens' => self::MAX_TOKENS,
                'duration_ms' => $durationMs,
            ]);
        }

        Log::info('TranscriptionAnalysisService: OpenRouter responded', [
            'duration_ms' => $durationMs,
            'finish_reason' => $finishReason,
            'usage' => $usage,
            'response_length' => mb_strlen($raw),
        ]);

        return $this->parseResponse($raw);
    }

    // -------------------------------------------------------------------------
    // Prompt builders
    // -------------------------------------------------------------------------

    private function buildSystemPrompt(): string
    {
        return <<<'SYSTEM'
Tu es un expert en recrutement et en évaluation de candidats. Tu analyses des entretiens d'embauche
de manière objective, rigoureuse et bienveillante.

Tes évaluations sont structurées, basées sur des preuves tirées de la transcription, et toujours
exprimées en français professionnel.

Si la transcription est trop courte, illisible ou hors sujet pour évaluer un critère,
attribue un score de 0 et indique "Données insuffisantes." dans le commentaire.
Ne jamais inventer des éléments absents de la transcription.

Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans balises de code, sans texte avant ou après.
Le JSON doit respecter exactement le schéma fourni dans le prompt utilisateur.
SYSTEM;
    }

    /**
     * @param  array<string>  $otherCandidates
     */
    private function buildUserPrompt(
        string $diarizedTranscript,
        string $brief,
        array $otherCandidates
    ): string {
        $candidatesSection = '';
        if (! empty($otherCandidates)) {
            $candidatesSection = "\n\n## Fiches des autres candidats (pour comparaison)\n";
            foreach ($otherCandidates as $i => $fiche) {
                $n = $i + 1;
                $candidatesSection .= "\n### Candidat {$n}\n{$fiche}\n";
            }
        }

        return <<<PROMPT
## Brief de poste / référence
{$brief}
{$candidatesSection}

## Transcription de l'entretien
{$diarizedTranscript}

---

## Consignes d'analyse

Évalue le candidat selon les 6 critères ci-dessous. Pour chaque critère, attribue un score de 0 à 100
et rédige un commentaire factuel s'appuyant sur des extraits précis de la transcription.

Critères :
1. communication_clarte        — Communication et clarté d'expression
2. vision_strategique          — Vision stratégique et profondeur des réponses
3. leadership_managerial       — Leadership et capacité managériale
4. gestion_equipe              — Gestion d'équipe et exemples concrets
5. adequation_culturelle       — Adéquation culturelle
6. coherence_salariale         — Cohérence des prétentions salariales avec le budget

Calcule un score global sur 100 (moyenne pondérée : communication 15 %, vision 20 %,
leadership 20 %, gestion_equipe 20 %, adéquation 15 %, salaire 10 %).

Détermine le verdict parmi : "Recommandé" | "Candidature solide" | "À approfondir" | "Écarté"

Identifie 3 à 5 points forts et 2 à 4 points de vigilance.

Sélectionne 3 à 6 extraits clés de la transcription qui illustrent ton analyse. Si la transcription
contient des horodatages, inclus-les ; sinon laisse "timestamp" à null.

## Schéma JSON attendu (réponds UNIQUEMENT avec ce JSON, aucun autre texte) :

{
  "global_score": <int 0-100>,
  "verdict": "<Recommandé|Candidature solide|À approfondir|Écarté>",
  "criteria": {
    "communication_clarte":   { "score": <int>, "comment": "<string>" },
    "vision_strategique":     { "score": <int>, "comment": "<string>" },
    "leadership_managerial":  { "score": <int>, "comment": "<string>" },
    "gestion_equipe":         { "score": <int>, "comment": "<string>" },
    "adequation_culturelle":  { "score": <int>, "comment": "<string>" },
    "coherence_salariale":    { "score": <int>, "comment": "<string>" }
  },
  "strengths":  ["<string>", ...],
  "red_flags":  ["<string>", ...],
  "key_excerpts": [
    {
      "speaker":   "<Interviewer|Candidate>",
      "text":      "<verbatim excerpt>",
      "timestamp": "<string or null>",
      "criterion": "<criterion key>"
    }
  ],
  "summary": "<1-2 phrases résumant le profil du candidat>",
  "recommendation": "<2-3 phrases de recommandation concrète pour le recruteur>"
}
PROMPT;
    }

    // -------------------------------------------------------------------------
    // Response parser
    // -------------------------------------------------------------------------

    /**
     * @return array{
     *     global_score: int,
     *     verdict: string,
     *     criteria: array<string, array{score: int, comment: string}>,
     *     strengths: string[],
     *     red_flags: string[],
     *     key_excerpts: array<array{speaker: string, text: string, timestamp: string|null, criterion: string}>,
     *     raw: string
     * }
     */
    private function parseResponse(string $raw): array
    {
        $clean = preg_replace('/^```(?:json)?\s*/i', '', trim($raw));
        $clean = preg_replace('/\s*```$/', '', $clean);

        $data = json_decode($clean, true);

        if (json_last_error() !== JSON_ERROR_NONE || ! is_array($data)) {
            Log::error('TranscriptionAnalysisService: JSON parse failure', [
                'json_error' => json_last_error_msg(),
                'raw_length' => mb_strlen($raw),
                'raw_preview' => mb_substr($raw, 0, 500), // first 500 chars, not the whole payload
                'raw_tail' => mb_substr($raw, -200), // last 200 chars — often shows truncation
            ]);
            throw new \RuntimeException('Could not parse API response as JSON: '.json_last_error_msg());
        }

        Log::info('TranscriptionAnalysisService: parsed response successfully', [
            'global_score' => $data['global_score'] ?? null,
            'verdict' => $data['verdict'] ?? null,
            'criteria_count' => count($data['criteria'] ?? []),
        ]);

        return [
            'global_score' => (int) ($data['global_score'] ?? 0),
            'verdict' => (string) ($data['verdict'] ?? 'À approfondir'),
            'criteria' => $data['criteria'] ?? [],
            'strengths' => $data['strengths'] ?? [],
            'red_flags' => $data['red_flags'] ?? [],
            'key_excerpts' => $data['key_excerpts'] ?? [],
            'summary' => isset($data['summary']) ? (string) $data['summary'] : null,
            'recommendation' => isset($data['recommendation']) ? (string) $data['recommendation'] : null,
            'raw' => $raw,
        ];
    }
}
