<?php

namespace App\Http\Controllers\Brief;

use App\Enums\BriefStatus;
use App\Http\Controllers\Controller;
use App\Models\Brief;
use App\Services\ActivityLogger;
use App\Services\ParameterService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BriefController extends Controller
{
    public function __construct(private readonly ParameterService $params) {}

    /**
     * Return the validation rules shared by store() and update().
     *
     * @return array<string, mixed>
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        $allowedFields = [
            'product_reference',
            'mission_code',
            'title',
            'sector',
            'contract_type',
            'location',
            'salary_range',
            'min_experience_years',
            'education_level',
            'languages',
            'seniority_level',
            'target_companies',
            'gender_pref',
            'age_range',
            'status',
        ];

        foreach ($filters as $filter) {
            if (
                ! is_array($filter) ||
                empty($filter['field']) ||
                ! isset($filter['value']) ||
                $filter['value'] === ''
            ) {
                continue;
            }

            $field = in_array($filter['field'], $allowedFields) ? $filter['field'] : null;

            if (! $field) {
                continue;
            }

            $values = array_filter(array_map('trim', explode(',', (string) $filter['value'])));

            if (count($values) > 1) {
                $query->whereIn($field, $values);
            } else {
                $query->where($field, 'like', '%'.$values[0].'%');
            }
        }
    }

    private function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'product_reference' => 'nullable|string|max:255',
            'mission_code' => 'nullable|string|max:255',
            'sector' => ['required', Rule::in($this->params->getGroup('sectors')->pluck('value'))],
            'contract_type' => ['required', Rule::in($this->params->getGroup('contract_types')->pluck('value'))],
            'location' => 'required|string|max:255',
            'salary_range' => 'nullable|string|max:255',
            'min_experience_years' => ['required', Rule::in($this->params->getGroup('experience_options')->pluck('value'))],
            'education_level' => ['required', Rule::in($this->params->getGroup('education_levels')->pluck('value'))],
            'languages' => 'nullable|string',
            'seniority_level' => ['nullable', Rule::in($this->params->getGroup('seniority_levels')->pluck('value'))],
            'target_companies' => 'nullable|string',
            'gender_pref' => ['nullable', Rule::in($this->params->getGroup('gender_prefs')->pluck('value'))],
            'age_range' => ['nullable', Rule::in($this->params->getGroup('age_ranges')->pluck('value'))],
            'mission_description' => 'required|string',
            'required_skills' => 'required|string',
            'soft_skills' => 'nullable|string',
            'search_prompt' => 'nullable|string|max:1000',
            'scoring_weights' => 'nullable|array',
            'scoring_weights.experience' => 'required_with:scoring_weights|integer|min:0|max:100',
            'scoring_weights.education' => 'required_with:scoring_weights|integer|min:0|max:100',
            'scoring_weights.location' => 'required_with:scoring_weights|integer|min:0|max:100',
            'scoring_weights.sector' => 'nullable|integer|min:0|max:100',
            'scoring_weights.soft_skills' => 'nullable|integer|min:0|max:100',
            'status' => ['required', Rule::enum(BriefStatus::class)],
        ];
    }

    /**
     * Display a paginated list of briefs, optionally filtered by search term and/or status.
     *
     * @param  Request  $request  Supports query params: `search` (string), `status` (BriefStatus value)
     * @return Response Inertia page — Briefs/Index — or Briefs/Fallback on failure
     */
    public function index(Request $request): Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);
        try {

            $query = Brief::with('creator');
            $filters = $request->input('filters');
            if (is_string($filters)) {
                $filters = json_decode($filters, true);
            }
            $filters = is_array($filters) ? $filters : [];
            $this->applyFilters($query, $filters);
            $briefs = $query
                ->latest()
                ->paginate(100)
                ->through(fn ($brief) => [
                    'id' => $brief->id,
                    'title' => $brief->title,
                    'sector' => $brief->sector,
                    'contract_type' => $brief->contract_type,
                    'location' => $brief->location,
                    'min_experience_years' => $brief->min_experience_years,
                    'education_level' => $brief->education_level,
                    'gender_pref' => $brief->gender_pref,
                    'status' => $brief->status,
                    'product_reference' => $brief->product_reference,
                    'mission_code' => $brief->mission_code,
                    'created_by' => $brief->creator?->name,
                    'created_at' => $brief->created_at->toDateTimeString(),
                ]);
            $logger->log(
                'brief.index',
                'Consultation de la liste des briefs.',
                [
                    'filters' => $filters ?? [],
                ],
                [Brief::class]
            );

            return Inertia::render('Briefs/Index', [
                'briefs' => $briefs,
                'filters' => $filters ?? [],
                'params' => $this->params->getAll([
                    'sectors',
                    'education_levels',
                    'experience_options',
                    'contract_types',
                    'gender_prefs',
                    'age_ranges',
                    'languages',
                    'seniority_levels',

                ]),
                'brief_statuses' => array_map(
                    fn ($case) => ['value' => $case->value, 'label' => $case->label()],
                    BriefStatus::cases()
                ),
            ]);

        } catch (\Throwable $e) {

            $logger->log(
                'brief.index.error',
                'Erreur lors de la récupération des briefs : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Brief::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de charger la liste des briefs.',
            ]);
        }
    }

    /**
     * Show the form for creating a new brief.
     *
     * @return Response Inertia page — Briefs/Create — or Briefs/Fallback on failure
     */
    public function create(): Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {

            $logger->log(
                'brief.create',
                'Affichage du formulaire de création d\'un brief.',
                [],
                [Brief::class]
            );

            return Inertia::render('Briefs/Create', [

                'params' => $this->params->getAll([
                    'sectors',
                    'education_levels',
                    'experience_options',
                    'age_ranges',
                    'languages',
                    'seniority_levels',
                    'contract_types',
                    'gender_prefs',
                ]),

            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'brief.create.error',
                'Erreur lors de l\'affichage du formulaire de création : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Brief::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible d\'afficher le formulaire de création.',
            ]);
        }
    }

    /**
     * Validate and persist a newly created brief.
     *
     * @param  Request  $request  Must contain all fields defined in rules()
     * @return RedirectResponse|Response Redirects to briefs.index on success, or renders Briefs/Fallback on unexpected failure
     *
     * @throws ValidationException If validation fails (auto-handled by Laravel)
     */
    public function store(Request $request): RedirectResponse|Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate($this->rules());

            $brief = new Brief($validated);
            $brief->created_by = auth()->id();
            $brief->save();

            try {
                $logger->log(
                    'brief.store',
                    "Création du brief « {$brief->title} » (ID : {$brief->id}).",
                    ['brief_id' => $brief->id, 'title' => $brief->title],
                    [Brief::class]
                );
            } catch (\Throwable $e) {
                Log::warning('Activity log failed in brief.store', ['error' => $e->getMessage()]);
            }

            return redirect()->route('dashboard.briefs.index')
                ->with('success', 'Brief créé avec succès.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {

            $logger->log(
                'brief.store.error',
                'Erreur lors de la création du brief : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Brief::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de créer le brief.',
            ]);
        }
    }

    /**
     * Display the specified brief.
     *
     * @param  Brief  $brief  Route-model-bound Brief instance
     * @return Response Inertia page — Briefs/Show — or Briefs/Fallback on failure
     */
    public function show(Brief $brief): Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $logger->log(
                'brief.show',
                "Consultation du brief « {$brief->title} » (ID : {$brief->id}).",
                ['brief_id' => $brief->id],
                [Brief::class]
            );

            $brief->load('creator');

            return Inertia::render('Briefs/Show', [
                'brief' => array_merge($brief->toArray(), [
                    'created_by' => $brief->creator?->name,
                ]),
                'params' => $this->params->getAll([
                    'sectors',
                    'education_levels',
                    'experience_options',
                    'age_ranges',
                    'languages',
                    'seniority_levels',
                    'contract_types',
                    'gender_prefs',
                ]),
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'brief.show.error',
                "Erreur lors de la consultation du brief (ID : {$brief->id}) : ".$e->getMessage(),
                ['brief_id' => $brief->id, 'exception' => $e->getMessage()],
                [Brief::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible d\'afficher ce brief.',
            ]);
        }
    }

    /**
     * Show the form for editing the specified brief.
     *
     * @param  Brief  $brief  Route-model-bound Brief instance to edit
     * @return Response Inertia page — Briefs/Edit — or Briefs/Fallback on failure
     */
    public function edit(Brief $brief): Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $logger->log(
                'brief.edit',
                "Affichage du formulaire d'édition du brief « {$brief->title} » (ID : {$brief->id}).",
                ['brief_id' => $brief->id],
                [Brief::class]
            );

            return Inertia::render('Briefs/Edit', [
                'brief' => $brief,
                'params' => $this->params->getAll([
                    'sectors',
                    'education_levels',
                    'experience_options',
                    'age_ranges',
                    'languages',
                    'seniority_levels',
                    'contract_types',
                    'gender_prefs',
                ]),
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'brief.edit.error',
                "Erreur lors de l'affichage du formulaire d'édition (ID : {$brief->id}) : ".$e->getMessage(),
                ['brief_id' => $brief->id, 'exception' => $e->getMessage()],
                [Brief::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible d\'afficher le formulaire d\'édition.',
            ]);
        }
    }

    /**
     * Validate and apply updates to the specified brief, logging each modified field.
     *
     * @param  Request  $request  Must contain all fields defined in rules()
     * @param  Brief  $brief  Route-model-bound Brief instance to update
     * @return RedirectResponse|Response Redirects to briefs.index on success, or renders Briefs/Fallback on unexpected failure
     *
     * @throws ValidationException If validation fails (auto-handled by Laravel)
     */
    public function update(Request $request, Brief $brief): RedirectResponse|Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate($this->rules());

            $modifications = collect($validated)
                ->filter(fn ($newValue, $key) => $brief->getAttribute($key) != $newValue)
                ->map(fn ($newValue, $key) => [
                    'avant' => $brief->getAttribute($key),
                    'après' => $newValue,
                ])
                ->toArray();

            $statutAvant = $brief->status;

            $brief->update($validated);

            try {
                $champsModifiés = implode(', ', array_keys($modifications));
                $descriptionBase = "Mise à jour du brief « {$brief->title} » (ID : {$brief->id}).";
                $descriptionDetail = count($modifications)
                    ? " Champs modifiés : {$champsModifiés}."
                    : ' Aucune modification détectée.';
                $transitionStatut = $statutAvant !== $brief->status
                    ? " Changement de statut : « {$statutAvant} » → « {$brief->status} »."
                    : '';
                $logger->log(
                    'brief.update',
                    $descriptionBase.$descriptionDetail.$transitionStatut,
                    ['brief_id' => $brief->id, 'modifications' => $modifications],
                    [Brief::class]
                );
            } catch (\Throwable $e) {
                Log::warning('Activity log failed in brief.update', ['error' => $e->getMessage()]);
            }

            return redirect()->route('dashboard.briefs.index')
                ->with('success', 'Brief mis à jour avec succès.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return Inertia::render('Fallback', [
                'error' => 'Impossible de mettre à jour ce brief.',
                'brief' => $brief,
            ]);
        }
    }

    /**
     * Remove the specified brief from storage.
     *
     * @param  Brief  $brief  Route-model-bound Brief instance to delete
     * @return RedirectResponse|Response Redirects to briefs.index on success, or renders Briefs/Fallback on failure
     */
    public function destroy(Brief $brief): RedirectResponse|Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $briefId = $brief->id;
            $briefTitle = $brief->title;

            $brief->delete();

            $logger->log(
                'brief.destroy',
                "Suppression du brief « {$briefTitle} » (ID : {$briefId}).",
                ['brief_id' => $briefId, 'title' => $briefTitle],
                [Brief::class]
            );

            return back()->with('success', 'Brief supprimé avec succès.');
        } catch (\Throwable $e) {
            $logger->log(
                'brief.destroy.error',
                "Erreur lors de la suppression du brief (ID : {$brief->id}) : ".$e->getMessage(),
                ['brief_id' => $brief->id, 'exception' => $e->getMessage()],
                [Brief::class]
            );

            return back()->withErrors(['delete' => 'Impossible de supprimer ce brief.']);
        }
    }

    /**
     * Activate the brief (sourcing is now triggered from the Sourcing page).
     */
    public function activate(Brief $brief): RedirectResponse|Response
    {
        $this->authorize('briefs.approve');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $brief->update(['status' => BriefStatus::Active]);

            $logger->log(
                'brief.activate',
                "Activation du brief « {$brief->title} » (ID : {$brief->id}).",
                ['brief_id' => $brief->id],
                [Brief::class]
            );

            return redirect()->route('dashboard.briefs.show', $brief->id)
                ->with('success', 'Brief activé.');
        } catch (\Throwable $e) {
            $logger->log(
                'brief.activate.error',
                "Erreur lors de l'activation du brief (ID : {$brief->id}) : ".$e->getMessage(),
                ['brief_id' => $brief->id, 'exception' => $e->getMessage()],
                [Brief::class]
            );

            return Inertia::render('Fallback', [
                'error' => "Impossible d'activer ce brief.",
            ]);
        }
    }

    /**
     * Update the status of the specified brief and track lifecycle dates.
     *
     * @param  Request  $request  Must contain a valid status (lancement | cloture)
     * @param  Brief  $brief  Route-model-bound Brief instance to update
     * @return RedirectResponse|Response Redirects back on success or renders fallback on failure
     *
     * @throws ValidationException If validation fails (handled by Laravel)
     */
    public function updateStatus(Request $request, Brief $brief): RedirectResponse|Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate([
                'status' => ['required', Rule::enum(BriefStatus::class)],
            ]);

            $statutAvant = $brief->status;

            $modifications = [];

            // 🔁 status change
            if ($statutAvant !== $validated['status']) {
                $modifications['status'] = [
                    'avant' => $statutAvant,
                    'après' => $validated['status'],
                ];
            }

            // 📌 apply status
            $brief->status = $validated['status'];

            // 📅 lifecycle dates
            if ($validated['status'] === 'lancement' && ! $brief->date_lancement) {
                $brief->date_lancement = now();
            }

            if ($validated['status'] === 'cloture') {
                $brief->date_cloture = now();
            }

            $brief->save();

            // 🧾 logging (safe)
            try {
                $transitionStatut = $statutAvant !== $brief->status
                    ? " Changement de statut : « {$statutAvant} » → « {$brief->status} »."
                    : '';

                $descriptionBase = "Mise à jour du statut du brief « {$brief->title} » (ID : {$brief->id}).";

                $logger->log(
                    'brief.status.update',
                    $descriptionBase.$transitionStatut,
                    [
                        'brief_id' => $brief->id,
                        'modifications' => $modifications,
                    ],
                    [Brief::class]
                );
            } catch (\Throwable $e) {
                Log::error('Erreur lors de la mise à jour du statut', ['brief_id' => $brief->id, 'exception' => $e->getMessage()]);

                return back()->withErrors(['status' => 'Impossible de mettre à jour le statut du brief.']);
            }

            return back()->with('success', 'Statut du brief mis à jour.');

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return Inertia::render('Fallback', [
                'error' => 'Impossible de mettre à jour le statut du brief.',
                'brief' => $brief,
            ]);
        }
    }

    /**
     * Restore a previously soft-deleted brief.
     *
     * @param  Brief  $brief  Route-model-bound Brief instance to restore
     * @return RedirectResponse Redirects back on success or with an error on failure
     */
    public function restore(Brief $brief): RedirectResponse
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $brief->restore();

            $logger->log(
                'brief.restore',
                "Restauration du brief « {$brief->title} » (ID : {$brief->id}).",
                ['brief_id' => $brief->id],
                [Brief::class]
            );

            return back()->with('success', 'Brief restauré.');
        } catch (\Throwable $e) {
            $logger->log(
                'brief.restore.error',
                "Erreur lors de la restauration du brief (ID : {$brief->id}) : ".$e->getMessage(),
                ['brief_id' => $brief->id, 'exception' => $e->getMessage()],
                [Brief::class]
            );

            return back()->withErrors(['restore' => 'Impossible de restaurer ce brief.']);
        }
    }

    /**
     * Validate and permanently delete multiple briefs in a single request.
     *
     * @param  Request  $request  Must contain `ids` (array of existing brief IDs)
     * @return RedirectResponse Redirects back on success or with an error on failure
     *
     * @throws ValidationException If validation fails (auto-handled by Laravel)
     */
    public function bulkDestroy(Request $request): RedirectResponse
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate([
                'ids' => 'required|array|min:1',
                'ids.*' => 'integer|exists:briefs,id',
            ]);

            Brief::whereIn('id', $validated['ids'])->delete();

            $logger->log(
                'brief.bulk_destroy',
                'Suppression groupée de '.count($validated['ids']).' brief(s).',
                ['brief_ids' => $validated['ids']],
                [Brief::class]
            );

            return back()->with('success', count($validated['ids']).' brief(s) supprimé(s).');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $logger->log(
                'brief.bulk_destroy.error',
                'Erreur lors de la suppression groupée des briefs : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Brief::class]
            );

            return back()->withErrors(['delete' => 'Impossible de supprimer les briefs sélectionnés.']);
        }
    }

    /**
     * Validate and apply a status update to multiple briefs in a single request.
     *
     * @param  Request  $request  Must contain `ids` (array of existing brief IDs) and a valid `status`
     * @return RedirectResponse Redirects back on success or with an error on failure
     *
     * @throws ValidationException If validation fails (auto-handled by Laravel)
     */
    public function bulkUpdateStatus(Request $request): RedirectResponse
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $validated = $request->validate([
                'ids' => 'required|array|min:1',
                'ids.*' => 'integer|exists:briefs,id',
                'status' => ['required', Rule::enum(BriefStatus::class)],
            ]);

            Brief::whereIn('id', $validated['ids'])->update(['status' => $validated['status']]);

            $logger->log(
                'brief.bulk_status_update',
                'Mise à jour groupée du statut pour '.count($validated['ids']).' brief(s).',
                ['brief_ids' => $validated['ids'], 'status' => $validated['status']],
                [Brief::class]
            );

            return back()->with('success', 'Statut mis à jour pour '.count($validated['ids']).' brief(s).');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $logger->log(
                'brief.bulk_status_update.error',
                'Erreur lors de la mise à jour groupée du statut : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Brief::class]
            );

            return back()->withErrors(['status' => 'Impossible de mettre à jour le statut des briefs sélectionnés.']);
        }
    }
}
