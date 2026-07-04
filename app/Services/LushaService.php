<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LushaService
{
    protected string $apiKey;

    protected string $baseUrl = 'https://api.lusha.com/v3';

    /**
     * Lusha's per-request cap for contacts/search and contacts/enrich.
     * Confirmed batch limit; split larger sets into chunks of this size.
     */
    private const BATCH_LIMIT = 100;

    public function __construct()
    {
        $this->apiKey = config('services.lusha.api_key');
    }

    /**
     * Batch search by LinkedIn URL. Keys the request contacts by
     * clientReferenceId = the LinkedIn URL itself, so results can be
     * matched back without needing a side index.
     *
     * @param  array<string>  $linkedinUrls
     * @return array<string, array> Keyed by linkedin_url. Only successful
     *                              (non-error) previews are included.
     */
    public function searchBatch(array $linkedinUrls): array
    {
        $linkedinUrls = array_values(array_unique(array_filter($linkedinUrls)));

        if (empty($linkedinUrls)) {
            return [];
        }

        Log::info('[Lusha] ▶ searchBatch started', [
            'total_urls' => count($linkedinUrls),
            'chunks' => (int) ceil(count($linkedinUrls) / self::BATCH_LIMIT),
        ]);

        $results = [];
        $notFound = [];

        foreach (array_chunk($linkedinUrls, self::BATCH_LIMIT) as $chunkIndex => $chunk) {
            $contacts = array_map(
                fn (string $url) => [
                    'clientReferenceId' => $url,
                    'linkedinUrl' => $url,
                ],
                $chunk
            );

            try {
                $response = Http::withHeaders([
                    'api_key' => $this->apiKey,
                ])->timeout(30)->post("{$this->baseUrl}/contacts/search", [
                    'contacts' => $contacts,
                    'options' => ['includePartialProfiles' => true],
                ]);

                if ($response->failed()) {
                    Log::warning('[Lusha] ✗ searchBatch chunk failed', [
                        'chunk_index' => $chunkIndex,
                        'chunk_size' => count($chunk),
                        'status' => $response->status(),
                        'body' => $response->json() ?? $response->body(),
                    ]);

                    continue;
                }

                $creditsCharged = $response->json('billing.creditsCharged');
                $resultsReturned = $response->json('billing.resultsReturned');

                foreach ($response->json('results', []) as $result) {
                    $ref = $result['clientReferenceId'] ?? null;
                    if (! $ref) {
                        continue;
                    }

                    if (isset($result['error'])) {
                        $notFound[] = $ref;

                        continue;
                    }

                    $results[$ref] = $result;

                    Log::info('[Lusha] ✓ Contact match found', [
                        'linkedin_url' => $ref,
                        'lusha_id' => $result['id'] ?? null,
                        'name' => trim(($result['firstName'] ?? '').' '.($result['lastName'] ?? '')),
                        'job_title' => $result['jobTitle']['title'] ?? null,
                        'company' => $result['company']['name'] ?? null,
                        'location' => trim(
                            ($result['location']['city'] ?? '').
                            (isset($result['location']['city'], $result['location']['country']) ? ', ' : '').
                            ($result['location']['country'] ?? '')
                        ) ?: null,
                        'revealable_fields' => collect($result['canReveal'] ?? [])->pluck('field')->all(),
                        'credits_to_reveal' => collect($result['canReveal'] ?? [])->sum('credits'),
                    ]);
                }

                Log::info('[Lusha] ✔ searchBatch chunk complete', [
                    'chunk_index' => $chunkIndex,
                    'requested' => count($chunk),
                    'matched' => $resultsReturned ?? count($results),
                    'credits_charged' => $creditsCharged,
                ]);
            } catch (\Throwable $e) {
                Log::error('[Lusha] ✗ searchBatch chunk exception', [
                    'chunk_index' => $chunkIndex,
                    'chunk_size' => count($chunk),
                    'message' => $e->getMessage(),
                ]);
            }
        }

        Log::info('[Lusha] 🏁 searchBatch finished', [
            'requested' => count($linkedinUrls),
            'matched' => count($results),
            'not_found' => count($notFound),
        ]);

        return $results;
    }

    /**
     * Batch enrich by Lusha contact id (obtained from searchBatch results).
     *
     * @param  array<string>  $lushaIds
     * @return array<string, array> Keyed by lusha id.
     */
    public function enrichBatch(array $lushaIds): array
    {
        $lushaIds = array_values(array_unique(array_filter($lushaIds)));

        if (empty($lushaIds)) {
            return [];
        }

        Log::info('[Lusha] ▶ enrichBatch started', [
            'total_ids' => count($lushaIds),
            'chunks' => (int) ceil(count($lushaIds) / self::BATCH_LIMIT),
        ]);

        $results = [];
        $emailsRevealed = 0;
        $phonesRevealed = 0;
        $failedIds = [];

        foreach (array_chunk($lushaIds, self::BATCH_LIMIT) as $chunkIndex => $chunk) {
            try {
                $response = Http::withHeaders([
                    'api_key' => $this->apiKey,
                ])->timeout(30)->post("{$this->baseUrl}/contacts/enrich", [
                    'ids' => $chunk,
                    'reveal' => ['emails', 'phones'],
                ]);

                if ($response->failed()) {
                    Log::error('[Lusha] ✗ enrichBatch chunk failed', [
                        'chunk_index' => $chunkIndex,
                        'chunk_size' => count($chunk),
                        'status' => $response->status(),
                        'body' => $response->json() ?? $response->body(),
                    ]);

                    continue;
                }

                $creditsCharged = $response->json('billing.creditsCharged');

                foreach ($response->json('results', []) as $result) {
                    $id = $result['id'] ?? null;

                    if (! $id) {
                        continue;
                    }

                    if (isset($result['error'])) {
                        $failedIds[] = $id;

                        continue;
                    }

                    $results[$id] = $result;

                    $email = collect($result['emails'] ?? [])->pluck('email')->first();
                    $phone = collect($result['phoneNumbers'] ?? [])->pluck('number')->first();

                    if ($email) {
                        $emailsRevealed++;
                    }
                    if ($phone) {
                        $phonesRevealed++;
                    }

                    Log::info('[Lusha] ✓ Contact enriched', [
                        'lusha_id' => $id,
                        'name' => trim(($result['firstName'] ?? '').' '.($result['lastName'] ?? '')),
                        'email' => $email,
                        'phone' => $phone,
                        'phone_type' => collect($result['phoneNumbers'] ?? [])->pluck('phoneType')->first(),
                    ]);
                }

                Log::info('[Lusha] ✔ enrichBatch chunk complete', [
                    'chunk_index' => $chunkIndex,
                    'requested' => count($chunk),
                    'enriched' => count($results),
                    'credits_charged' => $creditsCharged,
                ]);
            } catch (\Throwable $e) {
                Log::error('[Lusha] ✗ enrichBatch chunk exception', [
                    'chunk_index' => $chunkIndex,
                    'chunk_size' => count($chunk),
                    'message' => $e->getMessage(),
                ]);
            }
        }

        Log::info('[Lusha] 🏁 enrichBatch finished', [
            'requested' => count($lushaIds),
            'enriched' => count($results),
            'emails_revealed' => $emailsRevealed,
            'phones_revealed' => $phonesRevealed,
            'failed' => count($failedIds),
        ]);

        return $results;
    }

    /**
     * Convenience: search + enrich a full batch of LinkedIn URLs in one call each,
     * returning email/phone keyed by linkedin_url. Candidates with no match or no
     * revealable data are simply absent from the returned array.
     *
     * @param  array<string>  $linkedinUrls
     * @return array<string, array{email: ?string, phone: ?string}>
     */
    public function getContactDataBatch(array $linkedinUrls): array
    {
        Log::info('[Lusha] ▶ getContactDataBatch started', [
            'candidate_count' => count(array_unique(array_filter($linkedinUrls))),
        ]);

        $previews = $this->searchBatch($linkedinUrls);

        if (empty($previews)) {
            Log::info('[Lusha] 🏁 getContactDataBatch finished — no matches found', [
                'candidate_count' => count($linkedinUrls),
            ]);

            return [];
        }

        // Map lusha id -> linkedin_url so we can re-key after enrich
        $idToUrl = [];
        foreach ($previews as $url => $preview) {
            if (! empty($preview['id'])) {
                $idToUrl[$preview['id']] = $url;
            }
        }

        $enriched = $this->enrichBatch(array_keys($idToUrl));

        $contactData = [];
        foreach ($enriched as $lushaId => $data) {
            $url = $idToUrl[$lushaId] ?? null;
            if (! $url) {
                continue;
            }

            $email = collect($data['emails'] ?? [])->pluck('email')->first();
            $phone = collect($data['phoneNumbers'] ?? [])->pluck('number')->first();

            $contactData[$url] = [
                'email' => $email,
                'phone' => $phone,
            ];

            Log::info('[Lusha] ✓ Candidate contact data resolved', [
                'linkedin_url' => $url,
                'email' => $email,
                'phone' => $phone,
            ]);
        }

        Log::info('[Lusha] 🏁 getContactDataBatch finished', [
            'requested' => count($linkedinUrls),
            'previews_matched' => count($previews),
            'contacts_resolved' => count($contactData),
            'resolution_rate' => count($linkedinUrls) > 0
                ? round((count($contactData) / count($linkedinUrls)) * 100, 1).'%'
                : '0%',
        ]);

        return $contactData;
    }

    // -------------------------------------------------------------------
    // Single-lookup methods (kept for any ad-hoc/manual use elsewhere)
    // -------------------------------------------------------------------

    public function searchContact(string $linkedinUrl): ?array
    {
        try {
            $response = Http::withHeaders([
                'api_key' => $this->apiKey,
            ])->timeout(15)->post("{$this->baseUrl}/contacts/search", [
                'contacts' => [
                    [
                        'clientReferenceId' => 'ref-1',
                        'linkedinUrl' => $linkedinUrl,
                    ],
                ],
                'options' => ['includePartialProfiles' => true],
            ]);

            if ($response->failed()) {
                Log::warning('Lusha search request failed', [
                    'linkedin_url' => $linkedinUrl,
                    'status' => $response->status(),
                ]);

                return null;
            }

            $results = $response->json('results');
            if (empty($results) || isset($results[0]['error'])) {
                Log::info('[Lusha] ✗ searchContact: no match', [
                    'linkedin_url' => $linkedinUrl,
                ]);

                return null;
            }

            $result = $results[0];

            Log::info('[Lusha] ✓ searchContact match found', [
                'linkedin_url' => $linkedinUrl,
                'lusha_id' => $result['id'] ?? null,
                'name' => trim(($result['firstName'] ?? '').' '.($result['lastName'] ?? '')),
                'job_title' => $result['jobTitle']['title'] ?? null,
                'company' => $result['company']['name'] ?? null,
                'revealable_fields' => collect($result['canReveal'] ?? [])->pluck('field')->all(),
            ]);

            return $result;
        } catch (\Throwable $e) {
            Log::error('Lusha search exception', [
                'linkedin_url' => $linkedinUrl,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function enrichContact(string $lushaId): ?array
    {
        try {
            $response = Http::withHeaders([
                'api_key' => $this->apiKey,
            ])->timeout(15)->post("{$this->baseUrl}/contacts/enrich", [
                'ids' => [$lushaId],
                'reveal' => ['emails', 'phones'],
            ]);

            if ($response->failed()) {
                Log::error('Lusha enrich request failed', [
                    'lusha_id' => $lushaId,
                    'status' => $response->status(),
                ]);

                return null;
            }

            $results = $response->json('results');
            if (empty($results) || isset($results[0]['error'])) {
                Log::info('[Lusha] ✗ enrichContact: nothing revealed', [
                    'lusha_id' => $lushaId,
                ]);

                return null;
            }

            $result = $results[0];
            $email = collect($result['emails'] ?? [])->pluck('email')->first();
            $phone = collect($result['phoneNumbers'] ?? [])->pluck('number')->first();

            Log::info('[Lusha] ✓ enrichContact success', [
                'lusha_id' => $lushaId,
                'name' => trim(($result['firstName'] ?? '').' '.($result['lastName'] ?? '')),
                'email' => $email,
                'phone' => $phone,
            ]);

            return $result;
        } catch (\Throwable $e) {
            Log::error('Lusha enrich exception', [
                'lusha_id' => $lushaId,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function getContactData(string $linkedinUrl): ?array
    {
        Log::info('[Lusha] ▶ getContactData started', ['linkedin_url' => $linkedinUrl]);

        $contact = $this->searchContact($linkedinUrl);
        if (! $contact || ! isset($contact['id'])) {
            Log::info('[Lusha] 🏁 getContactData finished — no contact found', [
                'linkedin_url' => $linkedinUrl,
            ]);

            return null;
        }

        $data = $this->enrichContact($contact['id']);

        Log::info('[Lusha] 🏁 getContactData finished', [
            'linkedin_url' => $linkedinUrl,
            'success' => $data !== null,
        ]);

        return $data;
    }
}
