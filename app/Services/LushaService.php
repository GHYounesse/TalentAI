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
        Log::info('=== LUSHA ENRICH STEP START ===', [
            'lusha_id' => $lushaId,
        ]);

        try {

            Log::info('Sending enrich request to Lusha API');

            $response = Http::withHeaders([
                'api_key' => $this->apiKey,
            ])->post("{$this->baseUrl}/contacts/enrich", [
                'ids' => [$lushaId],
                'reveal' => ['emails', 'phones'],
            ]);

            Log::info('Lusha response received', [
                'status' => $response->status(),
            ]);

            Log::info('Lusha raw body', [
                'body' => $response->body(),
            ]);

            if ($response->failed()) {
                Log::error('Lusha request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $results = $response->json('results');

            Log::info('Parsed Lusha results', [
                'results' => $results,
            ]);

            if (empty($results)) {
                Log::warning('Empty results from Lusha enrich');

                return null;
            }

            if (isset($results[0]['error'])) {
                Log::warning('Lusha enrich returned error', [
                    'error' => $results[0]['error'],
                ]);

                return null;
            }

            Log::info('=== LUSHA ENRICH SUCCESS ===', [
                'contact' => $results[0],
            ]);

            return $results[0];

        } catch (\Throwable $e) {

            Log::error('LUSHA EXCEPTION', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
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
