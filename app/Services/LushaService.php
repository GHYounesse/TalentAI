<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LushaService
{
    protected string $apiKey;

    protected string $baseUrl = 'https://api.lusha.com/v3';

    public function __construct()
    {
        $this->apiKey = config('services.lusha.api_key');
    }

    public function searchContact(string $linkedinUrl): ?array
    {
        $response = Http::withHeaders([
            'api_key' => $this->apiKey,
        ])->post("{$this->baseUrl}/contacts/search", [
            'contacts' => [
                [
                    'clientReferenceId' => 'ref-1',
                    'linkedinUrl' => $linkedinUrl,
                ],
            ],
            'options' => ['includePartialProfiles' => true],
        ]);

        if ($response->failed()) {
            return null;
        }

        $results = $response->json('results');

        if (empty($results) || isset($results[0]['error'])) {
            return null;
        }

        return $results[0];
    }

    public function enrichContact(string $lushaId): ?array
    {
        try {
            $response = Http::withHeaders([
                'api_key' => $this->apiKey,
            ])->post("{$this->baseUrl}/contacts/enrich", [
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

            if (empty($results)) {
                Log::warning('Lusha enrich: empty results', ['lusha_id' => $lushaId]);

                return null;
            }

            if (isset($results[0]['error'])) {
                Log::warning('Lusha enrich returned error', ['error' => $results[0]['error']]);

                return null;
            }

            return $results[0];

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
        $contact = $this->searchContact($linkedinUrl);

        if (! $contact) {
            return null;
        }

        return $this->enrichContact($contact['id']);
    }
}
