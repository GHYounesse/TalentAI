<?php

namespace App\Services\Recruitment;

use App\Models\ApifyRun;
use App\Models\Candidat;
use App\Services\LushaService;
use App\Services\SignalHireService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * Fetches scraped LinkedIn profiles from an Apify dataset, upserts them as
 * Candidat records, enriches them with contact data (email/phone) via Lusha
 * (with SignalHire as a fallback for anything Lusha can't resolve), scores
 * them against the brief, and attaches them to the brief via the pivot table.
 *
 * Two entry points:
 *   importPage()  — incremental, cursor-based (used by ApifySourceJob).
 *                   Fetches one page of PAGE_SIZE items starting at run->dataset_offset.
 *                   Returns the number of dataset items fetched (for offset advancement),
 *                   regardless of how many passed the score threshold.
 *
 *   import()      — legacy bulk import used by FetchApifyResultsJob (background sourcing).
 *                   Fetches the full dataset in one call, no cursor.
 *
 * Contact enrichment: after each batch of candidates is upserted (and before
 * scoring), enrichBatchAndPersist() calls Lusha once for the whole batch
 * (search + enrich, each chunked at Lusha's 100-per-request limit) instead of
 * once per candidate. Candidates that already have an email or phone from a
 * prior run are skipped to avoid paying for the same lookup twice.
 *
 * Any candidate Lusha couldn't resolve (no email AND no phone returned) is
 * retried once against SignalHireService (synchronous "withoutWaterfall"
 * mode) as a fallback source. Lusha is always tried first since it's the
 * primary/preferred provider; SignalHire only picks up the leftovers.
 *
 * Enrichment failures — from either provider — never block import: a
 * candidate is always upserted/scored/attached even if enrichment fails or
 * both providers find nothing.
 */
class ApifyCandidateImporter
{
    private const MIN_SCORE = 0.0;

    public function __construct(
        private CandidateScoringService $scorer,
        private LushaService $lusha,
        private SignalHireService $signalHire,
    ) {}

    // -------------------------------------------------------------------------
    // Public: incremental page import (used by ApifySourceJob)
    // -------------------------------------------------------------------------

    /**
     * Fetch and import one page of dataset items starting at run->dataset_offset.
     *
     * @param  ApifyRun  $run  Run with a valid dataset_id and dataset_offset.
     * @param  string  $token  Apify API token.
     * @param  int  $limit  Page size.
     * @return int Number of items fetched from the dataset (use this to advance the offset).
     */
    public function importPage(ApifyRun $run, string $token, int $limit = 25): int
    {
        if (! $run->dataset_id) {
            return 0;
        }

        $items = $this->fetchDatasetPage($run->dataset_id, $run->dataset_offset, $limit, $token);

        if (empty($items)) {
            return 0;
        }

        $brief = $run->brief;

        // Collect linkedin_urls already attached to this brief so we never re-import them
        $alreadyLinked = DB::table('brief_candidat')
            ->where('brief_id', $brief->id)
            ->join('candidats', 'candidats.id', '=', 'brief_candidat.candidat_id')
            ->pluck('candidats.linkedin_url')
            ->flip();

        $candidates = collect();

        foreach ($items as $item) {
            $url = $item['linkedinUrl'] ?? null;

            if (! $url || $alreadyLinked->has($url)) {
                continue;
            }

            try {
                $candidates->push($this->upsertCandidate($item));
            } catch (\Throwable $e) {
                logger()->warning('[Importer] Failed to upsert candidate, skipping.', [
                    'linkedin_url' => $url,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($candidates->isNotEmpty()) {
            $this->enrichBatchAndPersist($candidates);

            $scores = $this->scorer->scoreBatch($brief, $candidates);
            $this->attachScored($brief, $candidates, $scores);

            $attached = collect($scores)->filter(fn ($r) => ($r['score'] ?? 0) >= self::MIN_SCORE)->count();
            $run->increment('candidates_imported', $attached);
        }

        return \count($items);
    }

    // -------------------------------------------------------------------------
    // Public: legacy bulk import (used by FetchApifyResultsJob)
    // -------------------------------------------------------------------------

    /**
     * Import all candidates from a succeeded Apify run in one shot.
     *
     * @return int Number of candidates attached to the brief.
     */
    public function import(ApifyRun $run): int
    {
        $items = $this->fetchDataset($run->dataset_id);
        $brief = $run->brief;

        if (empty($items)) {
            return 0;
        }

        $candidates = collect();

        foreach ($items as $item) {
            try {
                $candidates->push($this->upsertCandidate($item));
            } catch (\Throwable $e) {
                logger()->warning('[Importer] Failed to upsert candidate, skipping.', [
                    'linkedin_url' => $item['linkedinUrl'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($candidates->isEmpty()) {
            return 0;
        }

        $this->enrichBatchAndPersist($candidates);

        $scores = $this->scorer->scoreBatch($brief, $candidates);

        return $this->attachScored($brief, $candidates, $scores);
    }

    /**
     * Same as import() but streams each scored candidate via $onCandidate callback.
     *
     * @param  callable  $onCandidate  Called with the formatted candidate array after attaching.
     * @return int Number of candidates attached.
     */
    public function streamImport(ApifyRun $run, string $token, callable $onCandidate): int
    {
        $items = $this->fetchDataset($run->dataset_id, $token);
        $brief = $run->brief;

        if (empty($items)) {
            return 0;
        }

        $candidates = collect();

        foreach ($items as $item) {
            try {
                $candidates->push($this->upsertCandidate($item));
            } catch (\Throwable $e) {
                logger()->warning('[Importer] Failed to upsert candidate, skipping.', [
                    'linkedin_url' => $item['linkedinUrl'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($candidates->isEmpty()) {
            return 0;
        }

        $this->enrichBatchAndPersist($candidates);

        $scores = $this->scorer->scoreBatch($brief, $candidates);
        $count = 0;

        foreach ($candidates as $candidate) {
            $key = $candidate->linkedin_url;
            if (! $key) {
                continue;
            }
            $result = $scores[$key] ?? null;
            if (! $result || $result['score'] < self::MIN_SCORE) {
                continue;
            }

            try {
                $brief->candidates()->syncWithoutDetaching([
                    $candidate->id => [
                        'score' => $result['score'],
                        'score_breakdown' => json_encode($result['breakdown']),
                        'ai_analysis' => $result['ai_analysis'] ?? null,
                        'sourced_at' => now(),
                    ],
                ]);
                $count++;
                $onCandidate([
                    'id' => $candidate->id,
                    'full_name' => $candidate->full_name,
                    'linkedin_url' => $candidate->linkedin_url,
                    'current_title' => $candidate->current_title,
                    'current_company' => $candidate->current_company,
                    'location' => $candidate->location,
                    'experience_years' => $candidate->experience_years,
                    'status' => $candidate->status,
                    'score' => $result['score'],
                    'score_breakdown' => $result['breakdown'],
                    'sourced_at' => now()->toDateTimeString(),
                    'created_at' => $candidate->created_at?->toDateTimeString() ?? now()->toDateTimeString(),
                ]);
            } catch (\Throwable $e) {
                logger()->warning('[Importer] Failed to attach candidate.', ['error' => $e->getMessage()]);
            }
        }

        return $count;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Batch-enrich a set of freshly upserted candidates with contact data
     * (email/phone), skipping any that already have either field from a
     * prior run, and persist the results directly on the Candidat rows.
     *
     * Lusha is tried first for the whole batch (one search + one enrich HTTP
     * call, each chunked at Lusha's 100-per-request limit internally).
     * Any candidate Lusha couldn't resolve — i.e. it returned nothing, or
     * returned neither an email nor a phone — is retried against
     * SignalHireService as a fallback, again as a single batched call.
     *
     * Never throws — enrichment failures are logged inside the respective
     * services and simply result in no data for the affected candidates.
     */
    private function enrichBatchAndPersist(Collection $candidates): void
    {
        $toEnrich = $candidates->filter(
            fn (Candidat $c) => $c->linkedin_url && ! $c->email && ! $c->phone
        );

        if ($toEnrich->isEmpty()) {
            return;
        }

        $contactData = $this->lusha->getContactDataBatch(
            $toEnrich->pluck('linkedin_url')->all()
        );

        $stillMissing = collect();

        foreach ($toEnrich as $candidate) {
            $data = $contactData[$candidate->linkedin_url] ?? null;

            if (! $data || (empty($data['email']) && empty($data['phone']))) {
                $stillMissing->push($candidate);

                continue;
            }

            $this->persistContactData($candidate, $data);
        }

        if ($stillMissing->isEmpty()) {
            return;
        }

        logger()->info('[Importer] Lusha found no contact data for some candidates — falling back to SignalHire.', [
            'count' => $stillMissing->count(),
        ]);

        $fallbackData = $this->signalHire->searchBatch(
            $stillMissing->pluck('linkedin_url')->all()
        );

        if (empty($fallbackData)) {
            return;
        }

        foreach ($stillMissing as $candidate) {
            $data = $fallbackData[$candidate->linkedin_url] ?? null;

            if (! $data) {
                continue;
            }

            $this->persistContactData($candidate, $data);
        }
    }

    /**
     * Persist email/phone contact data onto a candidate row.
     * Shared by both the Lusha and SignalHire enrichment paths.
     */
    private function persistContactData(Candidat $candidate, array $data): void
    {
        try {
            $candidate->forceFill([
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
            ])->save();
        } catch (\Throwable $e) {
            logger()->warning('[Importer] Failed to persist contact data.', [
                'candidate_id' => $candidate->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Attach scored candidates to the brief pivot, skipping those below MIN_SCORE.
     *
     * @return int Number of candidates attached.
     */
    private function attachScored(mixed $brief, Collection $candidates, array $scores): int
    {
        $count = 0;

        foreach ($candidates as $candidate) {
            $key = $candidate->linkedin_url;
            if (! $key) {
                continue;
            }

            $result = $scores[$key] ?? null;

            if (! $result || $result['score'] < self::MIN_SCORE) {
                continue;
            }

            try {
                $brief->candidates()->syncWithoutDetaching([
                    $candidate->id => [
                        'score' => $result['score'],
                        'score_breakdown' => json_encode($result['breakdown']),
                        'ai_analysis' => $result['ai_analysis'] ?? null,
                        'sourced_at' => now(),
                    ],
                ]);
                $count++;
            } catch (\Throwable $e) {
                logger()->warning('[Importer] Failed to attach candidate.', [
                    'candidate_id' => $candidate->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $count;
    }

    /**
     * Insert or update a Candidat record from raw Apify profile data.
     * Uses linkedin_url as the unique key.
     *
     * Contact enrichment (email/phone) is handled separately in
     * enrichBatchAndPersist() after all candidates in a page/dataset are
     * upserted, so each contact provider is called once per batch instead
     * of once per candidate.
     */
    private function upsertCandidate(array $item): Candidat
    {
        $currentPosition = $item['currentPosition'][0] ?? $item['experience'][0] ?? null;

        return Candidat::updateOrCreate(
            ['linkedin_url' => $item['linkedinUrl'] ?? null],
            [
                'full_name' => trim(($item['firstName'] ?? '').' '.($item['lastName'] ?? '')),
                'headline' => $item['headline'] ?? null,
                'location' => $item['location']['linkedinText'] ?? $item['location'] ?? null,
                'summary' => $item['about'] ?? null,
                'skills' => $this->extractSkills($item['skills'] ?? []),
                'current_company' => $currentPosition['companyName'] ?? null,
                'current_title' => $currentPosition['position'] ?? $currentPosition['title'] ?? null,
                'experience_years' => $this->calculateTotalExperience($item['experience'] ?? []),
                'education_level' => $this->extractHighestDegree($item['education'] ?? []),
                'open_to_work' => $item['openToWork'] ?? false,
                'source' => 'LinkedIn',
                'source_url' => $item['linkedinUrl'] ?? null,
                'raw_data' => $item,
                'status' => 'sourced',
            ]
        );
    }

    /**
     * Normalise skills from the top-level `skills` field.
     * Apify returns [{name: string, ...}] objects; defensively handles plain strings too.
     *
     * @return array<string>
     */
    private function extractSkills(array $raw): array
    {
        return collect($raw)
            ->map(function ($s) {
                if (\is_array($s)) {
                    return $s['name'] ?? null;
                }

                return \is_string($s) ? $s : null;
            })
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Calculate total non-overlapping experience in years.
     *
     * Strategy (in order of preference):
     *   1. Date-based interval merge — handles concurrent roles correctly.
     *   2. Duration string fallback — used only when date fields are absent.
     */
    private function calculateTotalExperience(array $experiences): ?float
    {
        if (empty($experiences)) {
            return null;
        }

        $intervals = $this->extractDateIntervals($experiences);

        if ($intervals->isNotEmpty()) {
            return $this->sumMergedIntervals($intervals);
        }

        return $this->sumDurationStrings($experiences);
    }

    /**
     * Convert experience entries to [startMonths, endMonths] intervals.
     *
     * Fixes applied vs. the old version:
     *   - Month field: Apify returns "Jan", "Feb"… not integers. monthToInt() handles both.
     *   - isCurrent: also checks endDate.text === "Present" (Apify's actual field for ongoing roles).
     *
     * @return Collection<int, array{0: int, 1: int}>
     */
    private function extractDateIntervals(array $experiences): Collection
    {
        $nowMonths = (int) now()->format('Y') * 12 + (int) now()->format('n') - 1;

        return collect($experiences)
            ->filter(fn ($exp) => ! empty($exp['startDate']['year']))
            ->map(function ($exp) use ($nowMonths) {
                $startYear = (int) $exp['startDate']['year'];
                $startMonth = $this->monthToInt($exp['startDate']['month'] ?? 1) - 1;
                $start = $startYear * 12 + $startMonth;

                $isCurrent = ($exp['isCurrent'] ?? false)
                    || ($exp['endDate']['text'] ?? '') === 'Present'
                    || empty($exp['endDate']['year']);

                if ($isCurrent) {
                    $end = $nowMonths;
                } else {
                    $endYear = (int) $exp['endDate']['year'];
                    $endMonth = $this->monthToInt($exp['endDate']['month'] ?? 12) - 1;
                    $end = $endYear * 12 + $endMonth;
                }

                return $end > $start ? [$start, $end] : null;
            })
            ->filter()
            ->values();
    }

    /**
     * Convert a month value to an integer 1–12.
     * Handles both Apify's string format ("Jan", "February") and numeric strings/ints.
     */
    private function monthToInt(mixed $month): int
    {
        if (\is_numeric($month)) {
            return max(1, min(12, (int) $month));
        }

        $map = [
            'jan' => 1, 'feb' => 2, 'mar' => 3, 'apr' => 4,
            'may' => 5, 'jun' => 6, 'jul' => 7, 'aug' => 8,
            'sep' => 9, 'oct' => 10, 'nov' => 11, 'dec' => 12,
        ];

        $key = strtolower(substr((string) $month, 0, 3));

        return $map[$key] ?? 1;
    }

    /**
     * Merge overlapping intervals and sum their lengths in years.
     */
    private function sumMergedIntervals(Collection $intervals): float
    {
        $sorted = $intervals->sortBy(fn ($i) => $i[0])->values()->all();

        $merged = [];
        [$curStart, $curEnd] = $sorted[0];

        foreach (\array_slice($sorted, 1) as [$start, $end]) {
            if ($start <= $curEnd) {
                $curEnd = max($curEnd, $end);
            } else {
                $merged[] = [$curStart, $curEnd];
                $curStart = $start;
                $curEnd = $end;
            }
        }
        $merged[] = [$curStart, $curEnd];

        $totalMonths = array_sum(array_map(fn ($i) => $i[1] - $i[0], $merged));

        return round($totalMonths / 12, 1);
    }

    /**
     * Naive fallback: sum duration strings when date fields are absent.
     * Parses "2 yrs 3 mos", "1 yr", "5 mos" etc.
     */
    private function sumDurationStrings(array $experiences): ?float
    {
        $totalMonths = 0;

        foreach ($experiences as $exp) {
            $duration = $exp['duration'] ?? '';
            preg_match('/(\d+)\s*yr/', $duration, $years);
            preg_match('/(\d+)\s*mo/', $duration, $months);
            $totalMonths += (int) ($years[1] ?? 0) * 12;
            $totalMonths += (int) ($months[1] ?? 0);
        }

        return $totalMonths > 0 ? round($totalMonths / 12, 1) : null;
    }

    /**
     * Find the highest academic degree across all education entries.
     */
    private function extractHighestDegree(array $education): ?string
    {
        $degreeMap = [
            'doctor' => [5, 'phd'],
            'phd' => [5, 'phd'],
            'master' => [4, 'master'],
            'msc' => [4, 'msc'],
            'mba' => [4, 'mba'],
            'bachelor' => [3, 'bachelor'],
            'bsc' => [3, 'bsc'],
            'licence' => [3, 'licence'],
            'associate' => [2, 'bac+2'],
            'bac+2' => [2, 'bac+2'],
            'diploma' => [1, 'bac'],
            'certificate' => [1, 'bac'],
        ];

        $highestNormalized = null;
        $highestRank = 0;

        foreach ($education as $edu) {
            $degree = strtolower($edu['degree'] ?? '');

            foreach ($degreeMap as $keyword => [$rank, $normalized]) {
                if (str_contains($degree, $keyword) && $rank > $highestRank) {
                    $highestNormalized = $normalized;
                    $highestRank = $rank;
                }
            }
        }

        return $highestNormalized;
    }

    /**
     * Fetch a paginated slice of dataset items.
     *
     * @return array Raw profile objects, empty on failure.
     */
    private function fetchDatasetPage(string $datasetId, int $offset, int $limit, ?string $token = null): array
    {
        $response = Http::withToken($token ?? config('services.apify.token'))
            ->timeout(30)
            ->get("https://api.apify.com/v2/datasets/{$datasetId}/items", [
                'format' => 'json',
                'clean' => true,
                'offset' => $offset,
                'limit' => $limit,
            ]);

        if ($response->failed()) {
            logger()->warning('[Importer] fetchDatasetPage failed', [
                'dataset_id' => $datasetId,
                'offset' => $offset,
                'status' => $response->status(),
            ]);

            return [];
        }

        return $response->json() ?? [];
    }

    /**
     * Fetch all items from a dataset in one call (legacy, no pagination).
     *
     * @return array Raw profile objects, empty on failure.
     */
    private function fetchDataset(string $datasetId, ?string $token = null): array
    {
        $response = Http::withToken($token ?? config('services.apify.token'))
            ->timeout(60)
            ->get("https://api.apify.com/v2/datasets/{$datasetId}/items", [
                'format' => 'json',
                'clean' => true,
            ]);

        return $response->json() ?? [];
    }
}
