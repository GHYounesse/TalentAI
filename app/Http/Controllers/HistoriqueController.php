<?php

namespace App\Http\Controllers;

use App\Models\Brief;
use App\Models\Candidat;
use App\Models\Interview;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistoriqueController extends Controller
{
    /**
     * Display a paginated list of all interviews across all candidats,
     * with optional filters on decision, candidat name, brief, and date range.
     *
     * @param  Request  $request  Supports: decision, candidat_name, brief_id, date_from, date_to, page
     * @return Response Inertia page — Historique/Index — or Fallback on failure
     */
    public function index(Request $request): Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $this->authorize('historique.view');

            $query = Interview::query()
                ->with([
                    'candidate:id,full_name,headline,current_title,current_company,linkedin_url,raw_data',
                    'brief:id,title,sector,contract_type',
                    'interviewer:id,name',
                    'decisionBy:id,name',
                    'transcription:interview_id,analysis_score,analysis_verdict',
                ])
                ->orderByDesc('scheduled_at');

            // Filtre décision
            if ($request->filled('decision')) {
                $query->where('decision', $request->input('decision'));
            }

            // Filtre nom candidat
            if ($request->filled('candidat_name')) {
                $search = $request->input('candidat_name');
                $query->whereHas('candidate', fn ($q) => $q->where('full_name', 'LIKE', "%{$search}%")
                );
            }

            // Filtre brief
            if ($request->filled('brief_id')) {
                $query->where('brief_id', $request->input('brief_id'));
            }

            // Filtre période
            if ($request->filled('date_from')) {
                $query->whereDate('scheduled_at', '>=', $request->input('date_from'));
            }
            if ($request->filled('date_to')) {
                $query->whereDate('scheduled_at', '<=', $request->input('date_to'));
            }

            $interviews = $query->paginate(100)->through(fn ($interview) => [
                'id' => $interview->id,
                'platform' => $interview->platform,
                'status' => $interview->status,
                'scheduled_at' => $interview->scheduled_at?->toDateTimeString(),
                'completed_at' => $interview->completed_at?->toDateTimeString(),
                'decision' => $interview->decision,
                'decision_comment' => $interview->decision_comment,
                'decision_at' => $interview->decision_at?->toDateTimeString(),
                'candidat' => $interview->candidate ? [
                    'id' => $interview->candidate->id,
                    'full_name' => $interview->candidate->full_name,
                    'headline' => $interview->candidate->headline,
                    'current_title' => $interview->candidate->current_title,
                    'current_company' => $interview->candidate->current_company,
                    'linkedin_url' => $interview->candidate->linkedin_url,
                    'profile_photo' => (function () use ($interview) {
                        $pic = data_get($interview->candidate->raw_data, 'profilePicture');
                        if (! $pic) {
                            return null;
                        }
                        if (is_string($pic)) {
                            return $pic;
                        }
                        $sizes = data_get($pic, 'sizes', []);
                        foreach ($sizes as $size) {
                            if (($size['width'] ?? 0) === 200) {
                                return $size['url'];
                            }
                        }

                        return data_get($pic, 'url');
                    })(),
                ] : null,

                'brief' => $interview->brief ? [
                    'id' => $interview->brief->id,
                    'title' => $interview->brief->title,
                    'sector' => $interview->brief->sector,
                    'contract_type' => $interview->brief->contract_type,
                ] : null,

                'interviewer' => $interview->interviewer
                    ? ['id' => $interview->interviewer->id, 'name' => $interview->interviewer->name]
                    : null,

                'decision_by' => $interview->decisionBy
                    ? ['id' => $interview->decisionBy->id, 'name' => $interview->decisionBy->name]
                    : null,

                'ai_score' => $interview->transcription?->analysis_score,
                'ai_verdict' => $interview->transcription?->analysis_verdict,
            ]);

            $briefs = Brief::select('id', 'title')->orderBy('title')->get();

            $logger->log(
                'historique.index',
                'Consultation de l\'historique global des entretiens.',
                [
                    'filters' => $request->only(['decision', 'candidat_name', 'brief_id', 'date_from', 'date_to']),
                    'total' => $interviews->total(),
                ],
                [Interview::class]
            );

            return Inertia::render('Historique/Index', [
                'interviews' => $interviews,
                'briefs' => $briefs,
                'filters' => $request->only(['decision', 'candidat_name', 'brief_id', 'date_from', 'date_to']),
            ]);

        } catch (\Throwable $e) {
            $logger->log(
                'historique.index.error',
                'Erreur lors de la consultation de l\'historique global : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Interview::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de charger l\'historique.',
            ]);
        }
    }
}
