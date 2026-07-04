<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Looks up contact data (email/phone) by LinkedIn URL via SignalHire's
 * Person API, using synchronous "withoutWaterfall" mode so results come
 * back directly in the response — no public callback URL required.
 *
 * Confirmed against SignalHire docs: the withoutWaterfall (sync) response
 * body is identical in shape to the standard async callback payload — a
 * JSON array of {item, status, candidate} objects returned directly in
 * the response instead of POSTed to a callback URL.
 *
 * Docs: "Without Waterfall mode" — sync mode queries internal data only
 * (no external API enrichment), so it may return fewer or slightly older
 * contacts than async, in exchange for not needing a callback server.
 */
class SignalHireService
{
    protected string $apiKey;

    protected string $baseUrl = 'https://www.signalhire.com/api/v1';

    /**
     * SignalHire's documented per-request limit for the items array.
     */
    private const BATCH_LIMIT = 100;

    public function __construct()
    {
        $this->apiKey = config('services.signalhire.api_key');
    }

    /**
     * Batch lookup by LinkedIn URL in synchronous mode.
     *
     * @param  array<string>  $linkedinUrls
     * @return array<string, array{email: ?string, phone: ?string}> Keyed by linkedin_url.
     *                                                              Only successful matches are included.
     */
    public function searchBatch(array $linkedinUrls): array
    {
        $linkedinUrls = array_values(array_unique(array_filter($linkedinUrls)));

        if (empty($linkedinUrls)) {
            return [];
        }

        Log::info('[SignalHire] ▶ searchBatch started', [
            'total_urls' => count($linkedinUrls),
            'chunks' => (int) ceil(count($linkedinUrls) / self::BATCH_LIMIT),
        ]);

        $contactData = [];
        $notFound = [];
        $retryQueue = [];
        $creditsExhausted = false;

        foreach (array_chunk($linkedinUrls, self::BATCH_LIMIT) as $chunkIndex => $chunk) {
            try {
                $response = Http::withHeaders([
                    'apikey' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ])->timeout(60)->post("{$this->baseUrl}/candidate/search", [
                    'items' => $chunk,
                    'withoutWaterfall' => true,
                ]);

                $creditsLeft = $response->header('X-Credits-Left');

                if ($response->status() === 402) {
                    Log::warning('[SignalHire] ⚠ Credit limit reached — skipping remaining chunks', [
                        'chunk_index' => $chunkIndex,
                        'chunk_size' => count($chunk),
                    ]);
                    $creditsExhausted = true;
                    break;
                }

                if ($response->status() === 429) {
                    Log::warning('[SignalHire] ⚠ Rate limited', [
                        'chunk_index' => $chunkIndex,
                        'chunk_size' => count($chunk),
                    ]);

                    continue;
                }

                if ($response->failed()) {
                    Log::warning('[SignalHire] ✗ searchBatch chunk failed', [
                        'chunk_index' => $chunkIndex,
                        'chunk_size' => count($chunk),
                        'status' => $response->status(),
                        'body' => $response->json() ?? $response->body(),
                    ]);

                    continue;
                }

                $items = $response->json();

                if (! is_array($items)) {
                    Log::warning('[SignalHire] ⚠ Unexpected response shape for sync mode', [
                        'chunk_index' => $chunkIndex,
                        'body' => $items,
                    ]);

                    continue;
                }

                foreach ($items as $result) {
                    $item = $result['item'] ?? null;
                    $status = $result['status'] ?? null;

                    if (! $item) {
                        continue;
                    }

                    switch ($status) {
                        case 'success':
                            if (empty($result['candidate'])) {
                                $notFound[] = $item;
                                break;
                            }

                            $parsed = $this->parseCandidate($result['candidate']);
                            $contactData[$item] = $parsed;

                            Log::info('[SignalHire] ✓ Contact match found', [
                                'linkedin_url' => $item,
                                'name' => $result['candidate']['fullName'] ?? null,
                                'email' => $parsed['email'],
                                'phone' => $parsed['phone'],
                            ]);
                            break;

                        case 'failed':
                            $notFound[] = $item;
                            break;

                        case 'credits_are_over':
                            // Request succeeded, but credits ran out partway through
                            // this chunk's items — distinct from the top-level 402.
                            // Not a genuine "not found"; worth retrying once credits refresh.
                            $retryQueue[] = $item;
                            $creditsExhausted = true;

                            Log::warning('[SignalHire] ⚠ Credits exhausted mid-chunk', [
                                'linkedin_url' => $item,
                                'chunk_index' => $chunkIndex,
                            ]);
                            break;

                        case 'duplicate_query':
                            // Same request was submitted again within a short period —
                            // not a real result, safe to retry shortly.
                            $retryQueue[] = $item;

                            Log::info('[SignalHire] ↻ Duplicate query, queued for retry', [
                                'linkedin_url' => $item,
                            ]);
                            break;

                        default:
                            Log::warning('[SignalHire] ⚠ Unknown status value', [
                                'linkedin_url' => $item,
                                'status' => $status,
                            ]);
                            $notFound[] = $item;
                            break;
                    }
                }

                Log::info('[SignalHire] ✔ searchBatch chunk complete', [
                    'chunk_index' => $chunkIndex,
                    'requested' => count($chunk),
                    'matched' => count($contactData),
                    'credits_left' => $creditsLeft,
                ]);
            } catch (\Throwable $e) {
                Log::error('[SignalHire] ✗ searchBatch chunk exception', [
                    'chunk_index' => $chunkIndex,
                    'chunk_size' => count($chunk),
                    'message' => $e->getMessage(),
                ]);
            }
        }

        Log::info('[SignalHire] 🏁 searchBatch finished', [
            'requested' => count($linkedinUrls),
            'matched' => count($contactData),
            'not_found' => count($notFound),
            'queued_for_retry' => count($retryQueue),
            'credits_exhausted' => $creditsExhausted,
            'resolution_rate' => count($linkedinUrls) > 0
                ? round((count($contactData) / count($linkedinUrls)) * 100, 1).'%'
                : '0%',
        ]);

        return $contactData;
    }

    /**
     * Extract email/phone from a SignalHire candidate object.
     *
     * Assumes contacts is an array of {type, value, ...} entries where type
     * is "email" or "phone" (or "phone_number" — checked defensively).
     * Adjust field names here if a real response differs.
     *
     * @return array{email: ?string, phone: ?string}
     */
    private function parseCandidate(array $candidate): array
    {
        $contacts = collect($candidate['contacts'] ?? []);

        $email = $contacts->first(fn ($c) => in_array($c['type'] ?? null, ['email']))['value'] ?? null;
        $phone = $contacts->first(fn ($c) => in_array($c['type'] ?? null, ['phone', 'phone_number']))['value'] ?? null;

        return ['email' => $email, 'phone' => $phone];
    }
}
