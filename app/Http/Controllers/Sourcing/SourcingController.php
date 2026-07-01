<?php

namespace App\Http\Controllers\Sourcing;

use App\Http\Controllers\Controller;
use App\Jobs\ApifySourceJob;
use App\Models\ApifyRun;
use App\Models\Brief;
use App\Models\BriefQueryHistory;
use App\Models\Candidat;
use App\Models\UserApiToken;
use App\Services\ActivityLogger;
use App\Services\Recruitment\ApifyCandidateImporter;
use App\Services\Recruitment\ApifyJobDispatcher;
use App\Services\Recruitment\BriefToQueryConverter;
use App\Services\Recruitment\CandidateScoringService;
use App\Services\Recruitment\QueryGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SourcingController extends Controller
{
    public function __construct(
        private BriefToQueryConverter $converter,
        private ApifyJobDispatcher $dispatcher,
        private ApifyCandidateImporter $importer,
        private QueryGeneratorService $queryGenerator,
    ) {}

    /**
     * Display the sourcing page with brief list and the latest run state per brief (if any).
     */
    public function index(Request $request): Response
    {
        $this->authorize('sourcing.view');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $briefId = $request->input('brief_id');

            $briefs = Brief::query()
                ->select('id', 'title', 'search_prompt', 'current_query', 'next_start_page')
                ->latest()
                ->get();

            $logger->log(
                'sourcing.index',
                'Consultation de la page sourcing.',
                ['brief_id' => $briefId],
                [Brief::class]
            );

            return Inertia::render('Sourcing/Index', [
                'briefs' => $briefs,
                'filters' => [
                    'brief_id' => $briefId ? (int) $briefId : null,
                ],
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'sourcing.index.error',
                'Erreur lors de la récupération du sourcing : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Candidat::class, Brief::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de charger les données de sourcing.',
            ]);
        }
    }

    /**
     * Launch a new Apify sourcing run for a brief.
     *
     * POST body:
     *   brief_id              int     required
     *   open_to_work          bool    default: false
     *   job_title_query       string  Boolean query for currentJobTitles (max 300 chars)
     *   force                 bool    force new run even if one exists  default: false
     *
     * Returns JSON: { run_id: int } or { run_id: int, reattached: true }
     */
    public function launch(Request $request): JsonResponse
    {
        $this->authorize('sourcing.create');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate([
                'brief_id' => 'required|integer|exists:briefs,id',
                'job_title_query' => 'nullable|string|max:300',
                'mode' => 'nullable|string|in:broad,targeted',
                'force' => 'nullable|boolean',
                'start_page' => 'nullable|integer|min:1|max:100',
                'take_pages' => 'nullable|integer|min:1|max:100',
            ]);

            $brief = Brief::findOrFail($validated['brief_id']);
            $force = (bool) ($validated['force'] ?? false);

            // If there is already an active (non-terminal) run, reattach to it
            if (! $force) {
                $active = $brief->apifyRuns()
                    ->whereIn('status', ['pending', 'running'])
                    ->latest()
                    ->first();

                if ($active) {
                    $logger->log('sourcing.launch.reattached', 'Réattachement à un run existant.', ['run_id' => $active->id], [Brief::class]);

                    return response()->json(['run_id' => $active->id, 'reattached' => true]);
                }
            }

            $token = $this->resolveToken(auth()->id());

            if (! $token) {
                return response()->json(['error' => 'Aucune clé API Apify configurée. Ajoutez-la dans les intégrations.'], 422);
            }

            $options = [
                'job_title_query' => $validated['job_title_query'] ?? null,
                'mode' => $validated['mode'] ?? 'targeted',
                'start_page' => (int) ($validated['start_page'] ?? $brief->next_start_page ?? 1),
                'take_pages' => (int) ($validated['take_pages'] ?? 4),
            ];

            $actorInput = $this->converter->convert($brief, $options);
            $run = $this->dispatcher->dispatch($brief, $actorInput, $token);

            $run->update([
                'user_id' => auth()->id(),
                'status' => 'running',
                'search_params' => $actorInput,
            ]);

            // Persist the query used (whether AI-generated or manually edited)
            $queryUsed = $validated['job_title_query'] ?? null;
            if ($queryUsed) {
                $lastHistory = BriefQueryHistory::where('brief_id', $brief->id)
                    ->latest('created_at')
                    ->value('query');

                if ($lastHistory !== $queryUsed) {
                    BriefQueryHistory::create(['brief_id' => $brief->id, 'query' => $queryUsed]);
                }

                $brief->update(['current_query' => $queryUsed]);
            }

            ApifySourceJob::dispatch($run->id);

            $logger->log('sourcing.launch', 'Lancement d\'un run Apify.', ['run_id' => $run->id, 'brief_id' => $brief->id], [Brief::class, ApifyRun::class]);

            return response()->json(['run_id' => $run->id]);
        } catch (\Throwable $e) {
            $logger->log('sourcing.launch.error', 'Erreur lors du lancement du sourcing : '.$e->getMessage(), ['exception' => $e->getMessage()], [Brief::class]);

            return response()->json(['error' => 'Impossible de lancer le sourcing.'], 500);
        }
    }

    /**
     * Generate a LinkedIn Boolean job-title query from the brief's search_prompt.
     *
     * POST body: { brief_id: int, search_prompt?: string }
     * Returns JSON: { query: string }
     */
    public function generateQuery(Request $request): JsonResponse
    {
        $this->authorize('sourcing.create');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate([
                'brief_id' => 'required|integer|exists:briefs,id',
                'search_prompt' => 'nullable|string|max:1000',
                'mode' => 'nullable|string|in:broad,targeted',
            ]);

            $brief = Brief::findOrFail($validated['brief_id']);
            $prompt = $validated['search_prompt'] ?? $brief->search_prompt ?? '';

            if (! $prompt && ! $brief->title) {
                return response()->json(['query' => '']);
            }

            $mode = $validated['mode'] ?? 'targeted';
            $query = $this->queryGenerator->generate($brief->title ?? '', $prompt, $mode);

            // Persist to history and update the cached current_query on the brief
            BriefQueryHistory::create(['brief_id' => $brief->id, 'query' => $query]);
            $brief->update(['current_query' => $query]);

            $logger->log('sourcing.generateQuery', 'Génération d\'une requête Boolean.', ['brief_id' => $brief->id], [Brief::class]);

            return response()->json(['query' => $query]);
        } catch (\Throwable $e) {
            $logger->log('sourcing.generateQuery.error', 'Erreur lors de la génération de la requête : '.$e->getMessage(), ['exception' => $e->getMessage()], [Brief::class]);

            return response()->json(['error' => 'Impossible de générer la requête.'], 500);
        }
    }

    /**
     * Return the query history for a given brief.
     *
     * GET /sourcing/query-history?brief_id=X
     * Returns JSON: { history: [{ id, query, created_at }] }
     */
    /**
     * POST /sourcing/rescore
     * Rescore a single candidate against a brief and update the pivot score.
     * Body: { candidat_id: int, brief_id: int }
     */
    public function rescore(Request $request, CandidateScoringService $scorer): JsonResponse
    {
        $this->authorize('sourcing.edit');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate([
                'candidat_id' => 'required|integer|exists:candidats,id',
                'brief_id' => 'required|integer|exists:briefs,id',
            ]);

            $candidat = Candidat::findOrFail($validated['candidat_id']);
            $brief = Brief::findOrFail($validated['brief_id']);

            $result = $scorer->score($brief, $candidat);
            $score = $result['score'];

            DB::table('brief_candidat')
                ->where('candidat_id', $candidat->id)
                ->where('brief_id', $brief->id)
                ->update([
                    'score' => $score,
                    'score_breakdown' => json_encode($result['breakdown']),
                    'updated_at' => now(),
                ]);

            $logger->log('sourcing.rescore', 'Recalcul du score d\'un candidat.', ['candidat_id' => $candidat->id, 'brief_id' => $brief->id, 'score' => round($score)], [Candidat::class, Brief::class]);

            return response()->json(['score' => round($score)]);
        } catch (\Throwable $e) {
            $logger->log('sourcing.rescore.error', 'Erreur lors du rescoring : '.$e->getMessage(), ['exception' => $e->getMessage()], [Candidat::class, Brief::class]);

            return response()->json(['error' => 'Impossible de recalculer le score.'], 500);
        }
    }

    /**
     * Generate an AI analysis for a candidate against a brief and persist it.
     *
     * POST body: { candidat_id: int, brief_id: int }
     * Returns JSON: { ai_analysis: string }
     */
    public function generateAnalysis(Request $request, CandidateScoringService $scorer): JsonResponse
    {
        $this->authorize('sourcing.edit');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate([
                'candidat_id' => 'required|integer|exists:candidats,id',
                'brief_id' => 'required|integer|exists:briefs,id',
            ]);

            $candidat = Candidat::findOrFail($validated['candidat_id']);
            $brief = Brief::findOrFail($validated['brief_id']);

            $analysis = $scorer->generateAnalysisPublic($brief, $candidat);

            if ($analysis === null) {
                return response()->json(['error' => 'All AI models failed. Try again later.'], 503);
            }

            DB::table('brief_candidat')
                ->where('candidat_id', $candidat->id)
                ->where('brief_id', $brief->id)
                ->update(['ai_analysis' => $analysis, 'updated_at' => now()]);

            $logger->log('sourcing.generateAnalysis', 'Génération de l\'analyse IA d\'un candidat.', ['candidat_id' => $candidat->id, 'brief_id' => $brief->id], [Candidat::class, Brief::class]);

            return response()->json(['ai_analysis' => $analysis]);
        } catch (\Throwable $e) {
            $logger->log('sourcing.generateAnalysis.error', 'Erreur lors de la génération de l\'analyse : '.$e->getMessage(), ['exception' => $e->getMessage()], [Candidat::class, Brief::class]);

            return response()->json(['error' => 'Impossible de générer l\'analyse.'], 500);
        }
    }

    /**
     * Return the query history for a given brief.
     *
     * GET /sourcing/query-history?brief_id=X
     * Returns JSON: { history: [{ id, query, created_at }] }
     */
    public function queryHistory(Request $request): JsonResponse
    {
        $this->authorize('sourcing.view');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $briefId = (int) $request->validate(['brief_id' => 'required|integer|exists:briefs,id'])['brief_id'];

            $history = BriefQueryHistory::where('brief_id', $briefId)
                ->latest('created_at')
                ->limit(20)
                ->get(['id', 'query', 'created_at']);

            $logger->log('sourcing.queryHistory', 'Consultation de l\'historique des requêtes.', ['brief_id' => $briefId], [Brief::class]);

            return response()->json(['history' => $history]);
        } catch (\Throwable $e) {
            $logger->log('sourcing.queryHistory.error', 'Erreur lors de la récupération de l\'historique : '.$e->getMessage(), ['exception' => $e->getMessage()], [Brief::class]);

            return response()->json(['error' => 'Impossible de récupérer l\'historique.'], 500);
        }
    }

    /**
     * Return the current state of the latest run for a given brief.
     * Used by the frontend on brief selection to know whether to show cached results,
     * a resume button, or the options panel for a fresh launch.
     *
     * GET /sourcing/run-status?brief_id=X
     */
    public function runStatus(Request $request): JsonResponse
    {
        $this->authorize('sourcing.view');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $briefId = (int) $request->query('brief_id');

            $run = ApifyRun::where('brief_id', $briefId)
                ->latest()
                ->first();

            $logger->log('sourcing.runStatus', 'Consultation du statut d\'un run.', ['brief_id' => $briefId], [Brief::class, ApifyRun::class]);

            if (! $run) {
                return response()->json(null);
            }

            $searchParams = $run->search_params ?? [];

            return response()->json([
                'run_id' => $run->id,
                'status' => $run->status,
                'candidates_imported' => $run->candidates_imported,
                'total_items' => $run->total_items,
                'dataset_offset' => $run->dataset_offset,
                'created_at' => $run->created_at?->toIso8601String(),
                'paused_at' => $run->paused_at?->toIso8601String(),
                'start_page' => $searchParams['startPage'] ?? 1,
                'take_pages' => $searchParams['takePages'] ?? 4,
                'next_start_page' => $run->brief?->next_start_page ?? 1,
            ]);
        } catch (\Throwable $e) {
            $logger->log('sourcing.runStatus.error', 'Erreur lors de la récupération du statut : '.$e->getMessage(), ['exception' => $e->getMessage()], [Brief::class, ApifyRun::class]);

            return response()->json(['error' => 'Impossible de récupérer le statut.'], 500);
        }
    }

    /**
     * SSE stream for a given run_id.
     *
     * Behaviour:
     *   1. Immediately streams all candidates already attached to the brief since the run started.
     *   2. Polls the DB every 3 s for new candidates and run status changes.
     *   3. Closes automatically when the run reaches a terminal state (succeeded/failed/paused).
     *   4. Closing and reopening with the same run_id is safe — step 1 replays existing candidates.
     *
     * GET /sourcing/stream?run_id=X
     */
    public function stream(Request $request): StreamedResponse
    {
        $this->authorize('sourcing.view');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $runId = (int) $request->query('run_id');

            $logger->log('sourcing.stream', 'Ouverture d\'un flux SSE pour un run.', ['run_id' => $runId], [ApifyRun::class]);

            // Release the session lock before streaming so other requests aren't blocked
            $request->session()->save();

            return response()->stream(function () use ($runId) {
                $emit = function (string $event, array $data) {
                    echo "event: {$event}\n";
                    echo 'data: '.json_encode($data)."\n\n";
                    ob_flush();
                    flush();
                };

                set_time_limit(600);

                $run = ApifyRun::find($runId);

                if (! $run) {
                    $emit('error', ['message' => 'Run introuvable.']);
                    $emit('done', []);

                    return;
                }

                // Replay all candidates already imported for this run
                $this->streamExistingCandidates($run, $emit);

                // If the run already reached a terminal state, close immediately
                if (in_array($run->status, ['succeeded', 'failed'])) {
                    $emit('status', ['message' => $run->status]);
                    $emit('done', ['status' => $run->status]);

                    return;
                }

                if ($run->status === 'paused') {
                    $emit('status', [
                        'message' => 'paused',
                        'candidates_imported' => $run->candidates_imported,
                        'total_items' => $run->total_items,
                    ]);
                    $emit('done', []);

                    return;
                }

                // Resolve Apify token for direct status fallback
                $apifyToken = $this->resolveToken($run->user_id);

                // Poll DB for new candidates and status changes
                $lastSeenAt = now()->subSeconds(2);
                $pollIntervalSeconds = 3;
                $maxPolls = (int) (600 / $pollIntervalSeconds);

                for ($i = 0; $i < $maxPolls; $i++) {
                    sleep($pollIntervalSeconds);

                    if (connection_aborted()) {
                        break;
                    }

                    $run->refresh();

                    // Stream any new candidates attached since last poll
                    $newCandidates = DB::table('candidats')
                        ->join('brief_candidat as bc', 'bc.candidat_id', '=', 'candidats.id')
                        ->where('bc.brief_id', $run->brief_id)
                        ->where('bc.sourced_at', '>', $lastSeenAt)
                        ->orderBy('bc.sourced_at')
                        ->select('candidats.*', 'bc.score', 'bc.score_breakdown', 'bc.ai_analysis', 'bc.sourced_at')
                        ->get();

                    foreach ($newCandidates as $c) {
                        $emit('candidate', $this->formatCandidate($c));
                    }

                    $lastSeenAt = now()->subSeconds(1);

                    // Emit progress heartbeat every ~30 s (every 10 polls)
                    if ($i % 10 === 9) {
                        $emit('status', [
                            'message' => 'running',
                            'candidates_imported' => $run->candidates_imported,
                            'total_items' => $run->total_items,
                        ]);
                    }

                    if ($run->status === 'succeeded' || $run->status === 'failed') {
                        $emit('done', ['status' => $run->status]);
                        break;
                    }

                    if ($run->status === 'paused') {
                        $emit('status', [
                            'message' => 'paused',
                            'candidates_imported' => $run->candidates_imported,
                            'total_items' => $run->total_items,
                        ]);
                        $emit('done', []);
                        break;
                    }

                    // Every ~15 s, check Apify directly so the stream is self-sufficient
                    // even when no queue worker is running.
                    if ($i % 5 === 4 && $apifyToken && $run->run_id) {
                        $apifyStatus = $this->fetchApifyRunStatus($run->run_id, $apifyToken);

                        if (in_array($apifyStatus, ['FAILED', 'ABORTED', 'TIMED-OUT'])) {
                            $run->update(['status' => 'failed']);
                            $emit('done', ['status' => 'failed']);
                            break;
                        }

                        if ($apifyStatus === 'SUCCEEDED' && $run->dataset_id) {
                            // Import candidates directly in the SSE stream so results appear
                            // even when no queue worker is running.
                            $run->update(['status' => 'succeeded']);
                            $run->refresh();

                            $this->importer->streamImport($run, $apifyToken, function (array $candidate) use ($emit) {
                                $emit('candidate', $candidate);
                            });

                            $run->refresh();
                            $emit('status', [
                                'message' => 'running',
                                'candidates_imported' => $run->candidates_imported,
                                'total_items' => $run->total_items,
                            ]);
                            $emit('done', ['status' => 'succeeded']);
                            break;
                        }
                    }
                }
            }, 200, [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache',
                'X-Accel-Buffering' => 'no',
            ]);
        } catch (\Throwable $e) {
            $logger->log('sourcing.stream.error', 'Erreur lors de l\'ouverture du flux SSE : '.$e->getMessage(), ['exception' => $e->getMessage()], [ApifyRun::class]);

            return response()->stream(function () {
                echo "event: error\n";
                echo 'data: '.json_encode(['message' => 'Une erreur est survenue lors de l\'ouverture du flux.'])."\n\n";
                ob_flush();
                flush();
            }, 500, ['Content-Type' => 'text/event-stream', 'Cache-Control' => 'no-cache']);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Stream all candidates already attached to the brief since the run started.
     */
    private function streamExistingCandidates(ApifyRun $run, callable $emit): void
    {
        $existing = DB::table('candidats')
            ->join('brief_candidat as bc', 'bc.candidat_id', '=', 'candidats.id')
            ->where('bc.brief_id', $run->brief_id)
            ->where('bc.sourced_at', '>=', $run->created_at)
            ->orderBy('bc.sourced_at')
            ->select('candidats.*', 'bc.score', 'bc.score_breakdown', 'bc.ai_analysis', 'bc.sourced_at')
            ->get();

        foreach ($existing as $c) {
            $emit('candidate', $this->formatCandidate($c));
        }

        if ($existing->isNotEmpty()) {
            $emit('status', [
                'message' => 'running',
                'candidates_imported' => $run->candidates_imported,
                'total_items' => $run->total_items,
            ]);
        }
    }

    /**
     * Format a DB row (stdClass from query builder) into a candidate array for the frontend.
     */
    private function formatCandidate(object $c): array
    {
        $breakdown = $c->score_breakdown ?? null;
        if (\is_string($breakdown)) {
            $breakdown = json_decode($breakdown, true);
        }

        return [
            'id' => $c->id,
            'full_name' => $c->full_name,
            'linkedin_url' => $c->linkedin_url,
            'current_title' => $c->current_title,
            'current_company' => $c->current_company,
            'location' => $c->location,
            'experience_years' => $c->experience_years,
            'status' => $c->status,
            'source' => $c->source,
            'score' => $c->score,
            'score_breakdown' => $breakdown,
            'sourced_at' => $c->sourced_at,
        ];
    }

    private function fetchApifyRunStatus(string $apifyRunId, string $token): ?string
    {
        try {
            $response = Http::withToken($token)
                ->timeout(10)
                ->get("https://api.apify.com/v2/actor-runs/{$apifyRunId}");

            return $response->ok() ? ($response->json('data.status') ?? null) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function resolveToken(?int $userId): ?string
    {
        if ($userId) {
            $token = UserApiToken::where('user_id', $userId)
                ->where('provider', 'apify')
                ->value('token');

            if ($token) {
                return $token;
            }
        }

        return config('services.apify.token') ?: null;
    }
}
