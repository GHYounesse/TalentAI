<?php

use App\Models\Brief;
use Illuminate\Http\Request;
use Inertia\Inertia;

Route::get('/classement', function (Request $request) {
    abort_if(! $request->user()?->can('candidates.view'), 403);

    $briefs = Brief::select('id', 'title')
        ->orderByDesc('created_at')
        ->get();

    $selectedBriefId = $request->input('brief_id');
    if (! $selectedBriefId) {
        $selectedBriefId = $briefs->first()?->id;
    }

    $filters = $request->input('filters', []);

    if (is_string($filters)) {
        $filters = json_decode($filters, true);
    }

    $filters = is_array($filters) ? $filters : [];
    $candidates = collect();

    if ($selectedBriefId) {

        $brief = Brief::with(['candidates' => function ($q) {

            $q->orderByDesc('brief_candidat.score');

        }])->find($selectedBriefId);

        if ($brief) {

            $candidates = $brief->candidates;
            foreach ($filters as $filter) {

                if (! isset($filter['field'], $filter['value']) || $filter['value'] === '') {
                    continue;
                }

                $field = $filter['field'];
                $value = $filter['value'];

                $candidates = $candidates->filter(function ($c) use ($field, $value) {

                    if ($field === 'full_name') {
                        return str_contains(strtolower($c->full_name), strtolower($value));
                    }

                    if ($field === 'title') {
                        return str_contains(strtolower($c->current_title ?? ''), strtolower($value));
                    }

                    if ($field === 'score') {
                        return ($c->pivot->score ?? 0) >= (int) $value;
                    }
                    if ($field === 'skills') {
                        $skills = $c->skills ?? [];

                        return collect($skills)->contains(function ($s) use ($value) {
                            return str_contains(strtolower($s), strtolower($value));
                        });
                    }

                    return true;
                });
            }

            $candidates = $candidates->map(function ($c) {
                $pic = data_get($c->raw_data, 'profilePicture');
                $profilePhoto = null;
                if (is_string($pic)) {
                    $profilePhoto = $pic;
                } elseif (is_array($pic)) {
                    foreach (data_get($pic, 'sizes', []) as $size) {
                        if (($size['width'] ?? 0) === 200) {
                            $profilePhoto = $size['url'];
                            break;
                        }
                    }
                    if (! $profilePhoto) {
                        $profilePhoto = data_get($pic, 'url');
                    }
                }

                return [
                    'id' => $c->id,
                    'name' => $c->full_name,
                    'role' => $c->current_title,
                    'company' => $c->current_company,
                    'location' => $c->location,
                    'experience_years' => $c->experience_years,
                    'linkedin_url' => $c->linkedin_url,
                    'skills' => $c->skills ?? [],
                    'ai_analysis' => $c->pivot->ai_analysis ?? null,
                    'score' => round($c->pivot->score ?? 0),
                    'score_breakdown' => $c->pivot->score_breakdown
                        ? (is_string($c->pivot->score_breakdown)
                            ? json_decode($c->pivot->score_breakdown, true)
                            : $c->pivot->score_breakdown)
                        : null,
                    'profile_photo' => $profilePhoto,
                ];
            })->values();
        }
    }

    return Inertia::render('Classement/Index', [
        'briefs' => $briefs,
        'selectedBriefId' => (int) $selectedBriefId,
        'candidates' => $candidates,
        'filters' => $filters,
    ]);
})->name('classement');
