<?php

namespace App\Http\Controllers\Candidat;

use App\Enums\CandidatStatus;
use App\Http\Controllers\Controller;
use App\Models\Brief;
use App\Models\Candidat;
use App\Models\Interview;
use App\Services\ActivityLogger;
use App\Services\LushaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CandidatController extends Controller
{
    /**
     * Return the validation rules shared by store() and update().
     *
     * @return array<string, mixed>
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        $textFields = [
            'full_name', 'headline', 'location', 'current_company',
            'current_title', 'education_level', 'sector', 'source', 'status',
        ];
        $numberFields = ['experience_years'];
        $booleanFields = ['open_to_work'];

        foreach ($filters as $filter) {
            if (
                ! is_array($filter) ||
                empty($filter['field']) ||
                ! isset($filter['value']) ||
                $filter['value'] === ''
            ) {
                continue;
            }

            $field = $filter['field'];
            $value = $filter['value'];

            if ($field === 'brief_id') {
                $ids = is_array($value) ? $value : explode(',', $value);
                $ids = array_filter(array_map('intval', $ids));
                if (! empty($ids)) {
                    $query->whereHas('briefs', fn ($q) => $q->whereIn('briefs.id', $ids));
                }

                continue;
            }
            if ($field === 'recruiter_notes') {
                $query->whereHas('interviews', fn ($q) => $q->where('recruiter_notes', 'LIKE', '%'.$value.'%'));

                continue;

            }

            if (in_array($field, $textFields)) {
                $values = is_array($value) ? $value : explode(',', $value);
                $values = array_filter(array_map('trim', $values));
                if (count($values) > 1) {
                    $query->whereIn($field, $values);
                } else {
                    $keywords = preg_split('/\s+/', trim($values[0] ?? $value));
                    $query->where(function ($q) use ($field, $keywords) {
                        foreach ($keywords as $keyword) {
                            $q->orWhere($field, 'LIKE', '%'.$keyword.'%');
                        }
                    });
                }

                continue;
            }

            if (in_array($field, $numberFields)) {
                $query->where($field, '>=', (int) $value);

                continue;
            }

            if (in_array($field, $booleanFields)) {
                $query->where($field, filter_var($value, FILTER_VALIDATE_BOOLEAN));

                continue;
            }
        }
    }

    private function rules(): array
    {
        return [
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'current_title' => 'nullable|string|max:255',
            'current_company' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'experience_years' => 'nullable|numeric|min:0',
            'education_level' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:255',
            'source_url' => 'nullable|url|max:500',
            'status' => ['required', Rule::enum(CandidatStatus::class)],
            'linkedin_url' => 'nullable|url|max:500',
            'headline' => 'nullable|string|max:255',
            'summary' => 'nullable|string',
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:100',
            'open_to_work' => 'boolean',
            'raw_data' => 'nullable|array',
        ];
    }

    /**
     * Display a paginated list of candidats, optionally filtered by search term and/or status.
     *
     * @param  Request  $request  Supports query params: `search` (string), `status` (CandidatStatus value)
     * @return Response Inertia page — Candidats/Index — or Candidats/Fallback on failure
     */
    public function index(Request $request): Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {

            $query = Candidat::query()
                ->with([
                    'briefs' => fn ($q) => $q->orderByDesc('brief_candidat.sourced_at')->limit(1),
                ]);
            $filters = $request->input('filters', []);

            if (is_string($filters)) {
                $filters = json_decode($filters, true);
            }

            $filters = is_array($filters) ? $filters : [];
            $this->applyFilters($query, $filters);
            $candidats = $query
                ->latest()
                ->paginate(10)
                ->through(fn ($candidat) => [

                    'id' => $candidat->id,
                    'full_name' => $candidat->full_name,
                    'email' => $candidat->email,
                    'phone' => $candidat->phone,
                    'headline' => $candidat->headline,
                    'location' => $candidat->location,
                    'current_title' => $candidat->current_title,
                    'current_company' => $candidat->current_company,
                    'experience_years' => $candidat->experience_years,
                    'education_level' => $candidat->education_level,
                    'sector' => $candidat->sector,
                    'source' => $candidat->source,
                    'linkedin_url' => $candidat->linkedin_url,
                    'status' => $candidat->status,
                    'open_to_work' => $candidat->open_to_work,

                    'created_at' => $candidat->created_at?->toDateTimeString(),

                    'brief_title' => $candidat->briefs->first()?->title,
                    'brief_id' => $candidat->briefs->first()?->id,

                    'sourcing_score' => $candidat->briefs->first()?->pivot?->score
                        ? round($candidat->briefs->first()->pivot->score)
                        : null,

                    'ai_analysis' => $candidat->briefs->first()?->pivot?->ai_analysis,

                    'profile_photo' => (function () use ($candidat) {
                        $pic = data_get($candidat->raw_data, 'profilePicture');
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
                ]);
            $logger->log(
                'candidat.index',
                'Consultation de la liste des candidats.',
                [
                    'filters' => $filters,
                ],
                [Candidat::class]
            );

            $briefs = Brief::select('id', 'title')->latest()->get();

            return Inertia::render('Candidats/Index', [
                'candidats' => $candidats,
                'filters' => $filters,
                'briefs' => $briefs,
            ]);

        } catch (\Throwable $e) {

            $logger->log(

                'candidat.index.error',
                'Erreur lors de la récupération des candidats.',
                [
                    'exception' => $e->getMessage(),
                ],
                [Candidat::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de charger les candidats.',
            ]);
        }
    }

    /**
     * Show the form for creating a new candidat.
     *
     * @return Response Inertia page — Candidats/Create — or Candidats/Fallback on failure
     */
    public function create(): Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $logger->log(
                'candidat.create',
                'Affichage du formulaire de création d\'un candidat.',
                [],
                [Candidat::class]
            );

            return Inertia::render('Candidats/Create', [
                'statuses' => array_map(
                    fn ($case) => ['value' => $case->value, 'label' => $case->label()],
                    CandidatStatus::cases()
                ),
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'candidat.create.error',
                'Erreur lors de l\'affichage du formulaire de création : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Candidat::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible d\'afficher le formulaire de création.',
            ]);
        }
    }

    /**
     * Validate and persist a newly created candidat.
     *
     * @param  Request  $request  Must contain all fields defined in rules()
     * @return RedirectResponse|Response Redirects to candidats.index on success, or renders Candidats/Fallback on unexpected failure
     *
     * @throws ValidationException If validation fails (auto-handled by Laravel)
     */
    public function store(Request $request): RedirectResponse|Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate($this->rules());

            $candidat = Candidat::create($validated);

            try {
                $logger->log(
                    'candidat.store',
                    "Création du candidat « {$candidat->full_name} » (ID : {$candidat->id}).",
                    ['candidat_id' => $candidat->id, 'full_name' => $candidat->full_name],
                    [Candidat::class]
                );
            } catch (\Throwable) {
            }

            return redirect()->route('dashboard.candidats.index')
                ->with('success', 'Candidat créé avec succès.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $logger->log(
                'candidat.store.error',
                'Erreur lors de la création du candidat : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Candidat::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de créer le candidat.',
            ]);
        }
    }

    /**
     * Display the specified candidat.
     *
     * @param  Candidat  $candidat  Route-model-bound Candidat instance
     * @return Response Inertia page — Candidats/Show — or Candidats/Fallback on failure
     */
    public function show(Candidat $candidat): Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $logger->log(
                'candidat.show',
                "Consultation du candidat « {$candidat->full_name} » (ID : {$candidat->id}).",
                ['candidat_id' => $candidat->id],
                [Candidat::class]
            );

            $candidat->load('briefs', 'interviews');
            $firstBrief = $candidat->briefs->first();
            $interview = $candidat->interviews->first();

            return Inertia::render('Candidats/Show', [
                'candidat' => array_merge($candidat->toArray(), [
                    'brief_title' => $firstBrief?->title,
                    'brief_id' => $firstBrief?->id,
                    'sourcing_score' => $firstBrief?->pivot?->score
                        ? round($firstBrief->pivot->score)
                        : null,
                    'ai_analysis' => $firstBrief?->pivot?->ai_analysis,
                    'recruiter_notes' => $interview?->recruiter_notes,
                ]),
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'candidat.show.error',
                "Erreur lors de la consultation du candidat (ID : {$candidat->id}) : ".$e->getMessage(),
                ['candidat_id' => $candidat->id, 'exception' => $e->getMessage()],
                [Candidat::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible d\'afficher ce candidat.',
            ]);
        }
    }

    /**
     * Show the form for editing the specified candidat.
     *
     * @param  Candidat  $candidat  Route-model-bound Candidat instance to edit
     * @return Response Inertia page — Candidats/Edit — or Candidats/Fallback on failure
     */
    public function edit(Candidat $candidat): Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $logger->log(
                'candidat.edit',
                "Affichage du formulaire d'édition du candidat « {$candidat->full_name} » (ID : {$candidat->id}).",
                ['candidat_id' => $candidat->id],
                [Candidat::class]
            );

            return Inertia::render('Candidats/Edit', [
                'candidat' => $candidat,
                'statuses' => array_map(
                    fn ($case) => ['value' => $case->value, 'label' => $case->label()],
                    CandidatStatus::cases()
                ),
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'candidat.edit.error',
                "Erreur lors de l'affichage du formulaire d'édition (ID : {$candidat->id}) : ".$e->getMessage(),
                ['candidat_id' => $candidat->id, 'exception' => $e->getMessage()],
                [Candidat::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible d\'afficher le formulaire d\'édition.',
            ]);
        }
    }

    /**
     * Validate and apply updates to the specified candidat, logging each modified field.
     *
     * @param  Request  $request  Must contain all fields defined in rules()
     * @param  Candidat  $candidat  Route-model-bound Candidat instance to update
     * @return RedirectResponse|Response Redirects to candidats.index on success, or renders Candidats/Fallback on unexpected failure
     *
     * @throws ValidationException If validation fails (auto-handled by Laravel)
     */
    public function update(Request $request, Candidat $candidat): RedirectResponse|Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate($this->rules());

            $modifications = collect($validated)
                ->filter(fn ($newValue, $key) => $candidat->getAttribute($key) != $newValue)
                ->map(fn ($newValue, $key) => [
                    'avant' => $candidat->getAttribute($key),
                    'après' => $newValue,
                ])
                ->toArray();

            $statutAvant = $candidat->status;

            $candidat->update($validated);

            try {
                $champsModifiés = implode(', ', array_keys($modifications));
                $descriptionBase = "Mise à jour du candidat « {$candidat->full_name} » (ID : {$candidat->id}).";
                $descriptionDetail = count($modifications)
                    ? " Champs modifiés : {$champsModifiés}."
                    : ' Aucune modification détectée.';
                $transitionStatut = $statutAvant !== $candidat->status
                    ? " Changement de statut : « {$statutAvant} » → « {$candidat->status} »."
                    : '';
                $logger->log(
                    'candidat.update',
                    $descriptionBase.$descriptionDetail.$transitionStatut,
                    ['candidat_id' => $candidat->id, 'modifications' => $modifications],
                    [Candidat::class]
                );
            } catch (\Throwable) {
            }

            return redirect()->route('dashboard.candidats.index')
                ->with('success', 'Candidat mis à jour avec succès.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return Inertia::render('Fallback', [
                'error' => 'Impossible de mettre à jour ce candidat.',
                'candidat' => $candidat,
            ]);
        }
    }

    /**
     * Remove the specified candidat from storage.
     *
     * @param  Candidat  $candidat  Route-model-bound Candidat instance to delete
     * @return RedirectResponse|Response Redirects to candidats.index on success, or renders Candidats/Fallback on failure
     */
    public function destroy(Candidat $candidat): RedirectResponse|Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $candidatId = $candidat->id;
            $candidatName = $candidat->full_name;

            $candidat->delete();

            $logger->log(
                'candidat.destroy',
                "Suppression du candidat « {$candidatName} » (ID : {$candidatId}).",
                ['candidat_id' => $candidatId, 'full_name' => $candidatName],
                [Candidat::class]
            );

            return redirect()->route('dashboard.candidats.index')
                ->with('success', 'Candidat supprimé avec succès.');
        } catch (\Throwable $e) {
            $logger->log(
                'candidat.destroy.error',
                "Erreur lors de la suppression du candidat (ID : {$candidat->id}) : ".$e->getMessage(),
                ['candidat_id' => $candidat->id, 'exception' => $e->getMessage()],
                [Candidat::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de supprimer ce candidat.',
            ]);
        }
    }

    /**
     * Display the interview history for the specified candidat.
     *
     * @param  Candidat  $candidat  Route-model-bound Candidat instance
     * @return Response Inertia page — Candidats/Historique — or Candidats/Fallback on failure
     */
    public function historique(Candidat $candidat): Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $candidat->load([
                'interviews' => function ($query) {
                    $query
                        ->with([
                            'brief:id,title,sector,contract_type',
                            'interviewer:id,name,email',
                            'transcription:interview_id,analysis_score,analysis_verdict,analysis_status',
                            'report:interview_id,score_global,verdict,strengths,watch_points,ai_recommendation',
                            'decisionBy:id,name',
                        ])
                        ->orderByDesc('scheduled_at');
                },
            ]);

            $interviews = $candidat->interviews->map(fn ($interview) => [
                'id' => $interview->id,
                'platform' => $interview->platform,
                'status' => $interview->status,
                'scheduled_at' => $interview->scheduled_at?->toDateTimeString(),
                'completed_at' => $interview->completed_at?->toDateTimeString(),
                'decision' => $interview->decision,
                'decision_comment' => $interview->decision_comment,
                'decision_at' => $interview->decision_at?->toDateTimeString(),

                'brief' => $interview->brief ? [
                    'id' => $interview->brief->id,
                    'title' => $interview->brief->title,
                    'sector' => $interview->brief->sector,
                    'contract_type' => $interview->brief->contract_type,
                ] : null,

                'interviewer' => $interview->interviewer ? [
                    'id' => $interview->interviewer->id,
                    'name' => $interview->interviewer->name,
                    'email' => $interview->interviewer->email,
                ] : null,

                'decision_by' => $interview->decisionBy ? [
                    'id' => $interview->decisionBy->id,
                    'name' => $interview->decisionBy->name,
                ] : null,

                'ai_score' => $interview->transcription?->analysis_score,
                'ai_verdict' => $interview->transcription?->analysis_verdict,

                'report' => $interview->report ? [
                    'score_global' => $interview->report->score_global,
                    'verdict' => $interview->report->verdict,
                    'strengths' => $interview->report->strengths,
                    'watch_points' => $interview->report->watch_points,
                    'ai_recommendation' => $interview->report->ai_recommendation,
                ] : null,
            ]);

            $logger->log(
                'candidat.historique',
                "Consultation de l'historique des entretiens du candidat « {$candidat->full_name} » (ID : {$candidat->id}).",
                ['candidat_id' => $candidat->id, 'interviews_count' => $interviews->count()],
                [Candidat::class]
            );

            return Inertia::render('Candidats/Historique', [
                'candidat' => [
                    'id' => $candidat->id,
                    'full_name' => $candidat->full_name,
                    'headline' => $candidat->headline,
                    'location' => $candidat->location,
                    'current_title' => $candidat->current_title,
                    'current_company' => $candidat->current_company,
                    'linkedin_url' => $candidat->linkedin_url,
                    'status' => $candidat->status,
                    'open_to_work' => $candidat->open_to_work,
                    'profile_photo' => (function () use ($candidat) {
                        $pic = data_get($candidat->raw_data, 'profilePicture');
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
                ],
                'interviews' => $interviews,
            ]);

        } catch (\Throwable $e) {
            $logger->log(
                'candidat.historique.error',
                "Erreur lors de la consultation de l'historique du candidat (ID : {$candidat->id}) : ".$e->getMessage(),
                ['candidat_id' => $candidat->id, 'exception' => $e->getMessage()],
                [Candidat::class]
            );

            return Inertia::render('Fallback', [
                'error' => "Impossible d'afficher l'historique de ce candidat.",
            ]);
        }
    }

    /**
     * Record or update the recruiter's decision (accepted/rejected/pending) for an interview.
     *
     * @param  Request  $request  Must contain `decision` (accepted|rejected|pending) and optional `decision_comment`
     * @param  Interview  $interview  Interview being decided on
     * @return RedirectResponse Redirects back with a flash message
     */
    public function decide(Request $request, Interview $interview): RedirectResponse
    {
        $this->authorize('interviews.decide');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate([
                'decision' => ['required', 'in:accepted,rejected,pending'],
                'decision_comment' => ['nullable', 'string', 'max:2000'],
            ]);

            $isReset = $validated['decision'] === 'pending';

            $interview->update([
                'decision' => $validated['decision'],
                'decision_comment' => $isReset ? null : ($validated['decision_comment'] ?? null),
                'decision_by' => $isReset ? null : auth()->id(),
                'decision_at' => $isReset ? null : now(),
            ]);

            $logger->log(
                'interview.decide',
                "Décision {$validated['decision']} enregistrée pour l'entretien (ID : {$interview->id}).",
                ['interview_id' => $interview->id, 'decision' => $validated['decision']],
                [Interview::class]
            );

            return back()->with('success', $isReset
                ? 'Décision réinitialisée.'
                : 'Décision enregistrée avec succès.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $logger->log(
                'interview.decide.error',
                "Erreur lors de l'enregistrement de la décision (ID : {$interview->id}) : ".$e->getMessage(),
                ['interview_id' => $interview->id, 'exception' => $e->getMessage()],
                [Interview::class]
            );

            return back()->with('error', "Impossible d'enregistrer la décision.");
        }
    }

    /**
     * Enrich a candidate's contact information using the Lusha service.
     *
     * @return RedirectResponse|Response Redirects back with success/error message, or renders Candidats/Fallback on unexpected failure
     */
    public function enrichContact(Request $request, Candidat $candidat, LushaService $lushaService): RedirectResponse|Response
    {

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {

            $logger->log(
                'candidat.enrich.start',
                "Début enrichissement Lusha pour « {$candidat->full_name} » (ID: {$candidat->id}).",
                [
                    'candidate_id' => $candidat->id,
                    'linkedin_url' => $candidat->linkedin_url,
                ],
                [Candidat::class]
            );

            if (! $candidat->linkedin_url) {
                return back()->with('error', 'LinkedIn URL is required for enrichment.');
            }

            /**
             * STEP 1: SEARCH
             */
            $contact = $lushaService->searchContact($candidat->linkedin_url);

            if (! $contact) {

                $logger->log(
                    'candidat.enrich.not_found',
                    "Aucun contact trouvé sur Lusha pour « {$candidat->full_name} ».",
                    ['candidate_id' => $candidat->id],
                    [Candidat::class]
                );

                return back()->with('error', 'No contact found');
            }

            /**
             * STEP 2: ENRICH
             */
            $enriched = $lushaService->enrichContact($contact['id']);

            if (! $enriched) {

                $logger->log(
                    'candidat.enrich.failed',
                    "Échec enrichissement Lusha pour « {$candidat->full_name} ».",
                    ['lusha_id' => $contact['id']],
                    [Candidat::class]
                );

                return back()->with('error', 'Enrichment failed');
            }

            /**
             * STEP 3: COMPARE MODIFICATIONS (comme update())
             */
            $before = [
                'email' => $candidat->email,
                'phone' => $candidat->phone,
            ];

            $after = [
                'email' => $enriched['emails'][0]['email'] ?? $candidat->email,
                'phone' => $enriched['phones'][0]['number'] ?? $candidat->phone,
            ];

            $emailFound = ! empty($enriched['emails'][0]['email']);
            $phoneFound = ! empty($enriched['phones'][0]['number']);

            if ($emailFound && $phoneFound) {
                $message = 'Contact avec succès';
            } elseif ($emailFound) {
                $message = 'Email trouvé et enregistré avec succès.';
            } elseif ($phoneFound) {
                $message = 'Numéro de téléphone trouvé et enregistré avec succès.';
            } else {
                $message = 'Aucun email ni numéro de téléphone n’a été trouvé pour ce candidat.';
            }

            $modifications = collect($after)
                ->filter(fn ($value, $key) => $before[$key] != $value)
                ->map(fn ($value, $key) => [
                    'avant' => $before[$key],
                    'après' => $value,
                ])
                ->toArray();

            /**
             * STEP 4: UPDATE
             */
            $candidat->update([
                'email' => $after['email'],
                'phone' => $after['phone'],
                'raw_data' => array_merge(
                    $candidat->raw_data ?? [],
                    ['lusha' => $enriched]
                ),
            ]);

            /**
             * STEP 5: LOG FINAL
             */
            $champsModifiés = implode(', ', array_keys($modifications));

            $logger->log(
                'candidat.enrich.success',
                "Enrichissement réussi pour « {$candidat->full_name} ».",
                [
                    'candidate_id' => $candidat->id,
                    'lusha_id' => $contact['id'],
                    'modifications' => $modifications,
                    'fields_changed' => $champsModifiés ?: 'none',
                ],
                [Candidat::class]
            );

            return back()->with([
                'success' => $message,
            ]);

        } catch (\Throwable $e) {

            $logger->log(
                'candidat.enrich.error',
                "Erreur enrichissement Lusha pour « {$candidat->full_name} ».",
                [
                    'error' => $e->getMessage(),
                    'line' => $e->getLine(),
                ],
                [Candidat::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible d’enrichir ce candidat.',
                'candidat' => $candidat,
            ]);
        }
    }
}
