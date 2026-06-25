<?php

namespace App\Http\Controllers\Interview;

use App\Enums\BriefStatus;
use App\Http\Controllers\Controller;
use App\Jobs\Transcription\AnalyseTranscriptionJob;
use App\Models\Brief;
use App\Models\Candidat;
use App\Models\Interview;
use App\Models\Transcription;
use App\Services\ActivityLogger;
use App\Services\Transcription\AssemblyAIService;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class InterviewController extends Controller
{
    /**
     * Display the transcription index page.
     *
     * @return Response Inertia page — Transcription/Index — or Fallback on failure
     */
    public function create(): Response
    {
        $this->authorize('interviews.create');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $logger->log(
                'interview.index',
                'Affichage de la page d\'entretien.',
                [],
                [Interview::class]
            );

            return Inertia::render('Interview/Create', [
                'candidates' => Candidat::select('id', 'full_name')->orderBy('full_name')->get(),
                'briefs' => Brief::select('id', 'title')->where('status', BriefStatus::Active)->orderBy('title')->get(),
                'interviews' => Interview::with(['candidate', 'transcription'])
                    ->where('interviewer_id', auth()->id())
                    ->latest('scheduled_at')
                    ->take(10)
                    ->get()
                    ->map(fn ($i) => [
                        'id' => $i->id,
                        'candidate_name' => $i->candidate?->full_name ?? '—',
                        'platform' => $i->platform,
                        'scheduled_at' => $i->scheduled_at?->format('d M Y'),
                        'transcription_status' => $i->transcription?->status ?? 'none',
                        'transcription_id' => $i->transcription?->id,
                        'analysis_status' => $i->transcription?->analysis_status ?? 'none',
                    ]),
            ]);
        } catch (\Throwable $e) {

            $logger->log(
                'interview.index.error',
                'Erreur lors de l\'affichage de la page d\'entretien : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Interview::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible d\'afficher la page d\'entretien.',
            ]);
        }
    }

    /**
     * Paginated list of all interviews for the authenticated user.
     */
    public function index(): Response
    {
        $this->authorize('interviews.view');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {

            $filters = json_decode(request('filters', '[]'), true);

            $query = Interview::with(['candidate', 'brief', 'transcription'])
                ->where('interviewer_id', auth()->id());

            foreach ($filters as $filter) {

                if ($filter['field'] === 'candidate') {
                    $query->whereHas('candidate', function ($q) use ($filter) {
                        $q->where(
                            'full_name',
                            'like',
                            '%'.$filter['value'].'%',
                        );
                    });
                }

                if ($filter['field'] === 'brief') {
                    $query->whereHas('brief', function ($q) use ($filter) {
                        $q->where(
                            'title',
                            'like',
                            '%'.$filter['value'].'%',
                        );
                    });
                }

                if ($filter['field'] === 'platform') {
                    $query->where(
                        'platform',
                        $filter['value'],
                    );
                }

                if ($filter['field'] === 'status') {
                    $query->whereHas('transcription', function ($q) use ($filter) {
                        $q->where(
                            'status',
                            $filter['value'],
                        );
                    });
                }
                if ($filter['field'] === 'recruiter_notes') {
                    $query->where(
                        'recruiter_notes',
                        'like',
                        '%'.$filter['value'].'%'
                    );

                }
            }

            $interviews = $query
                ->latest('scheduled_at')
                ->paginate(10)
                ->through(fn ($i) => [
                    'id' => $i->id,
                    'candidate_name' => $i->candidate?->full_name ?? '—',
                    'brief_id' => $i->brief?->id,
                    'brief_title' => $i->brief?->title ?? '—',
                    'platform' => $i->platform,
                    'recruiter_notes' => $i->recruiter_notes,
                    'scheduled_at' => $i->scheduled_at?->format('d M Y'),
                    'transcription_status' => $i->transcription?->status ?? 'none',
                    'transcription_id' => $i->transcription?->id,
                    'analysis_status' => $i->transcription?->analysis_status ?? 'none',
                    'audio_url' => $i->transcription?->audio_path
                        ? route('dashboard.interviews.audio', $i->id)
                        : null,
                ]);

            $logger->log(
                'interview.list',
                'Liste des entretiens consultée.',
                [],
                [Interview::class]
            );

            return Inertia::render('Interview/Index', [
                'interviews' => $interviews,
                'filters' => $filters,
            ]);

        } catch (\Throwable $e) {

            $logger->log(
                'interview.list.error',
                'Erreur lors de la récupération des entretiens : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Interview::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de charger les entretiens.',
            ]);
        }
    }

    /**
     * Validate and store an uploaded audio file, then dispatch a transcription job.
     *
     * @param  Request  $request  Must contain an `audio` file (mp3/wav/mp4/m4a, max 80 MB)
     * @return RedirectResponse|Response Redirects back with the transcription ID on success, or renders Fallback on unexpected failure
     *
     * @throws ValidationException If validation fails (auto-handled by Laravel)
     */
    public function upload(Request $request, AssemblyAIService $assemblyAI): RedirectResponse|Response
    {
        $this->authorize('interviews.upload');
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        $uploadedPath = null;

        try {
            $request->validate([
                'audio' => [
                    'required',
                    'file',
                    'mimetypes:audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/m4a,audio/x-m4a',
                    'max:81920',
                ],
                'candidate_id' => ['required', 'integer', 'exists:candidats,id'],
                'brief_id' => ['required', 'integer', 'exists:briefs,id'],
                'platform' => ['required', 'string', 'in:zoom,meet,teams,presentiel'],
                'expectations' => ['nullable', 'string', 'max:2000'],
                'recruiter_notes' => ['nullable', 'string', 'max:2000'],
            ]);

            /** @var AwsS3V3Adapter $s3 */
            $s3 = Storage::disk('s3');

            [$interview, $transcription] = DB::transaction(function () use ($request, $s3, &$uploadedPath) {
                $interview = Interview::create([
                    'candidate_id' => $request->candidate_id,
                    'brief_id' => $request->brief_id,
                    'interviewer_id' => auth()->user()->id,
                    'platform' => $request->platform,
                    'status' => 'recording_uploaded',
                    'expectations' => $request->expectations,
                    'recruiter_notes' => $request->recruiter_notes,
                    'scheduled_at' => now(),
                ]);

                $path = $request->file('audio')->store('transcriptions/pending', 's3');

                // Track the uploaded path outside the closure scope so the
                // outer catch block can clean it up if anything after this fails.
                $uploadedPath = $path;

                $audioUrl = $s3->url($path);

                $transcription = Transcription::create([
                    'interview_id' => $interview->id,
                    'status' => 'pending',
                    'audio_path' => $path,
                    'audio_url' => $audioUrl,
                ]);

                return [$interview, $transcription];
            });

            // Pre-signed URL valid for 1 hour — long enough for AssemblyAI to fetch the file
            $presignedUrl = $s3->temporaryUrl($transcription->audio_path, now()->addHour());

            $assemblyTranscriptId = $assemblyAI->submit($presignedUrl);

            $transcription->update(['assemblyai_transcript_id' => $assemblyTranscriptId]);

            $logger->log(
                'interview.upload',
                "Transcription soumise à AssemblyAI (ID : {$transcription->id}, AssemblyAI : {$assemblyTranscriptId}).",
                ['transcription_id' => $transcription->id, 'assemblyai_transcript_id' => $assemblyTranscriptId],
                [Transcription::class]
            );

            return back()->with('interview_id', $interview->id);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            if ($uploadedPath) {
                try {
                    Storage::disk('s3')->delete($uploadedPath);
                } catch (\Throwable $cleanupException) {
                    $logger->log(
                        'interview.upload.cleanup_failed',
                        "Échec du nettoyage S3 après une erreur d'upload (path : {$uploadedPath}) : ".$cleanupException->getMessage(),
                        ['path' => $uploadedPath, 'exception' => $cleanupException->getMessage()],
                        [Interview::class]
                    );
                }
            }

            $logger->log(
                'interview.upload.error',
                'Erreur lors de la soumission de l\'entretien : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Interview::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de soumettre l\'entretien.',
            ]);
        }
    }

    /**
     * Display a single interview with its transcription and analysis details.
     *
     * @param  Interview  $interview  Interview to display
     * @return Response Inertia page — Interview/Show — or Fallback on failure
     */
    public function show(Interview $interview): Response
    {
        $this->authorize('interviews.view');
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $interview->load(['candidate', 'brief', 'transcription', 'interviewer']);

            $logger->log(
                'interview.show',
                "Consultation de l'entretien (ID : {$interview->id}).",
                ['interview_id' => $interview->id],
                [Interview::class]
            );

            $transcription = $interview->transcription;

            $analysis = $transcription?->analysis_result ?? [];

            $diarized = $transcription?->diarized_transcript;
            if (is_string($diarized) && ! empty($diarized)) {

                $decoded = json_decode($diarized, true);

                if (json_last_error() === JSON_ERROR_NONE) {
                    $diarized = $decoded;
                } else {

                    $diarized = collect(preg_split('/\n{2,}/', trim($diarized)))
                        ->filter()
                        ->map(function (string $block) {

                            $parts = explode(': ', $block, 2);

                            return count($parts) === 2
                                ? ['speaker' => trim($parts[0]), 'text' => trim($parts[1])]
                                : ['speaker' => 'Unknown',       'text' => trim($block)];
                        })
                        ->values()
                        ->all();
                }
            } else {
                $diarized = [];
            }

            // Peer interviews for the same brief (comparative ranking)
            $peers = [];
            if ($interview->brief_id) {
                $peers = Interview::with(['candidate', 'transcription'])
                    ->where('brief_id', $interview->brief_id)
                    ->whereHas('transcription', fn ($q) => $q->where('analysis_status', 'done'))
                    ->join('transcriptions', 'transcriptions.interview_id', '=', 'interviews.id')
                    ->orderByDesc('transcriptions.analysis_score')
                    ->select('interviews.*')
                    ->get()
                    ->map(fn ($i) => [
                        'id' => $i->id,
                        'candidate_name' => $i->candidate?->full_name ?? '—',
                        'global_score' => $i->transcription?->analysis_score,
                        'verdict' => $i->transcription?->analysis_result['verdict'] ?? null,
                        'criteria' => $i->transcription?->analysis_result['criteria'] ?? [],
                    ])
                    ->all();
            }

            return Inertia::render('Interview/Show', [
                'interview' => [
                    'id' => $interview->id,
                    'candidate_name' => $interview->candidate?->full_name ?? '—',
                    'brief_title' => $interview->brief?->title ?? '—',
                    'platform' => $interview->platform,
                    'scheduled_at' => $interview->scheduled_at?->format('d M Y'),
                    'interviewer' => $interview->interviewer?->name ?? '—',
                    'duration_minutes' => $interview->duration_seconds ? (int) round($interview->duration_seconds / 60) : null,
                ],
                'transcription' => $transcription ? [
                    'id' => $transcription->id,
                    'status' => $transcription->status,
                    'analysis_status' => $transcription->analysis_status,
                    'analysis_score' => $transcription->analysis_score,
                    'analysis_verdict' => $transcription->analysis_verdict,
                    'global_score' => $analysis['global_score'] ?? null,
                    'verdict' => $analysis['verdict'] ?? null,
                    'criteria' => $analysis['criteria'] ?? [],
                    'strengths' => $analysis['strengths'] ?? [],
                    'red_flags' => $analysis['red_flags'] ?? [],
                    'key_excerpts' => $analysis['key_excerpts'] ?? [],
                    'diarized_transcript' => $diarized ?? [],
                    'summary' => $this->buildSummary($analysis),
                    'recommendation' => $analysis['recommendation'] ?? null,
                ] : null,
                'peers' => $peers,
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'interview.show.error',
                "Erreur lors de la consultation de l'entretien (ID : {$interview->id}) : ".$e->getMessage(),
                ['interview_id' => $interview->id, 'exception' => $e->getMessage()],
                [Interview::class]
            );

            return Inertia::render('Fallback', [
                'error' => "Impossible d'afficher cet entretien.",
            ]);
        }
    }

    /**
     * Return the transcription and analysis status for an interview.
     *
     * @param  Interview  $interview  Interview being tracked
     * @return JsonResponse Current processing status, or an error payload on failure
     */
    public function status(Interview $interview, AssemblyAIService $assemblyAI): JsonResponse
    {
        $this->authorize('interviews.view');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $interview->load('brief');

            $transcription = DB::transaction(function () use ($interview, $assemblyAI) {
                $transcription = Transcription::where('interview_id', $interview->id)
                    ->lockForUpdate()
                    ->first();

                if (! $transcription) {
                    return null;
                }

                if ($transcription->status === 'pending' && $transcription->assemblyai_transcript_id) {
                    $assemblyStatus = $assemblyAI->checkStatus($transcription->assemblyai_transcript_id);

                    if ($assemblyStatus === 'completed') {
                        Log::info('Interview status check: AssemblyAI completed, processing utterances', [
                            'transcription_id' => $transcription->id,
                            'interview_id' => $interview->id,
                            'assemblyai_transcript_id' => $transcription->assemblyai_transcript_id,
                            'pending_since' => $transcription->created_at?->diffForHumans(),
                        ]);
                        $utterances = $assemblyAI->fetchUtterances($transcription->assemblyai_transcript_id);

                        $firstSpeaker = $utterances[0]['speaker'] ?? 'A';
                        $speakerMap = [$firstSpeaker => 'Interviewer'];
                        foreach ($utterances as $u) {
                            if (! isset($speakerMap[$u['speaker']])) {
                                $speakerMap[$u['speaker']] = 'Candidate';
                            }
                        }

                        $turns = array_values(array_filter(
                            array_map(fn ($u) => trim($u['text']) === '' ? null : [
                                'speaker' => $speakerMap[$u['speaker']] ?? $u['speaker'],
                                'text' => $u['text'],
                            ], $utterances)
                        ));

                        $transcription->update([
                            'status' => 'done',
                            'transcript_text' => implode(' ', array_column($turns, 'text')),
                            'diarized_transcript' => json_encode($turns),
                            'analysis_status' => 'processing',
                        ]);

                        $brief = $this->formatBrief($interview->brief, $interview->expectations ?? '');

                        AnalyseTranscriptionJob::dispatch($transcription, $brief, []);
                        Log::info('Interview status check: analysis job dispatched', [
                            'transcription_id' => $transcription->id,
                            'interview_id' => $interview->id,
                            'turn_count' => count($turns),
                        ]);

                        $transcription->refresh();
                    } elseif ($assemblyStatus === 'error') {
                        Log::error('Interview status check: AssemblyAI reported error', [
                            'transcription_id' => $transcription->id,
                            'interview_id' => $interview->id,
                            'assemblyai_transcript_id' => $transcription->assemblyai_transcript_id,
                        ]);
                        $transcription->update(['status' => 'failed']);
                    }
                }

                return $transcription;
            });

            if (! $transcription) {
                return response()->json(['status' => 'pending', 'analysis_status' => 'pending']);
            }

            $logger->log('interview.status', 'Consultation du statut de transcription.', ['interview_id' => $interview->id], [Interview::class]);

            return response()->json([
                'status' => $transcription->status,
                'analysis_status' => $transcription->analysis_status ?? 'pending',
                'error' => $transcription->error ?? null,
            ]);
        } catch (\Throwable $e) {
            $logger->log('interview.status.error', 'Erreur lors de la récupération du statut : '.$e->getMessage(), ['exception' => $e->getMessage()], [Interview::class]);

            return response()->json([
                'status' => 'failed',
                'analysis_status' => 'failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Stream the audio file for an interview directly from S3,
     * bypassing browser CORS restrictions on presigned URLs.
     */
    public function audio(Interview $interview): StreamedResponse|\Illuminate\Http\Response
    {
        $this->authorize('interviews.view');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        $transcription = $interview->transcription;

        if (! $transcription || ! $transcription->audio_path) {
            abort(404);
        }

        try {
            if (! Storage::disk('s3')->exists($transcription->audio_path)) {
                abort(404);
            }

            $path = $transcription->audio_path;
            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            $mime = match ($ext) {
                'mp4' => 'audio/mp4',
                'm4a' => 'audio/mp4',
                'wav' => 'audio/wav',
                default => 'audio/mpeg',
            };

            $id = (int) $interview->getKey();
            $logger->log('interview.audio', "Streaming audio pour l'entretien (ID : {$id}).", ['interview_id' => $id], [Interview::class]);

            /** @var AwsS3V3Adapter $s3 */
            $s3 = Storage::disk('s3');

            return $s3->response($path, basename($path), [
                'Content-Type' => $mime,
                'Cache-Control' => 'no-store',
            ]);
        } catch (HttpExceptionInterface $e) {
            throw $e;
        } catch (\Throwable $e) {
            $interviewId = (int) $interview->getKey();
            $logger->log('interview.audio.error', "Erreur lors du streaming audio (ID : {$interviewId}) : ".$e->getMessage(), ['interview_id' => $interviewId, 'exception' => $e->getMessage()], [Interview::class]);

            abort(500);
        }
    }

    /**
     * Return the AI-generated summary when available, or synthesise one from strengths.
     */
    private function buildSummary(array $analysis): ?string
    {
        if (! empty($analysis['summary'])) {
            return (string) $analysis['summary'];
        }

        $strengths = $analysis['strengths'] ?? [];
        if (empty($strengths)) {
            return null;
        }

        // Compose a concise recap from the first two or three strengths.
        $items = array_map(fn ($s) => rtrim($s, '. '), array_slice($strengths, 0, 3));

        return implode('. ', $items).'.';
    }

    private function formatBrief(Brief $brief, string $expectations): string
    {
        $skills = is_array($brief->required_skills) ? implode(', ', $brief->required_skills) : $brief->required_skills;
        $soft = is_array($brief->soft_skills) ? implode(', ', $brief->soft_skills) : $brief->soft_skills;
        $langs = is_array($brief->languages) ? implode(', ', $brief->languages) : $brief->languages;
        $weights = is_array($brief->scoring_weights)
            ? collect($brief->scoring_weights)->map(fn ($v, $k) => "{$k}: {$v}%")->implode(', ')
            : $brief->scoring_weights;

        $expectationsSection = $expectations
            ? "\n\nAttentes spécifiques de l'interviewer :\n{$expectations}"
            : '';

        $sector = $brief->sector ?? 'Non précisé';
        $contract = $brief->contract_type?->label();
        $location = $brief->location ?? 'Non précisé';
        $salary = $brief->salary_range ?? 'Non précisé';
        $experience = $brief->min_experience_years ?? 'Non précisé';
        $education = $brief->education_level ?? 'Non précisé';
        $seniority = $brief->seniority_level ?? 'Non précisé';
        $gender = $brief->gender_pref;
        $age = $brief->age_range;
        $mission = $brief->mission_description;
        $title = $brief->title;

        return <<<BRIEF
            Poste : {$title}
            Secteur : {$sector}
            Contrat : {$contract}
            Lieu : {$location}
            Salaire : {$salary}
            Expérience minimale : {$experience} an(s)
            Niveau d'études : {$education}
            Langues : {$langs}
            Séniorité : {$seniority}
            Préférence genre : {$gender}
            Tranche d'âge : {$age}

            Mission :
            {$mission}

            Compétences techniques requises : {$skills}
            Compétences comportementales : {$soft}

            Pondération des critères d'évaluation : {$weights}{$expectationsSection}
            BRIEF;
    }
}
