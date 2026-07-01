<?php

namespace App\Services\SocialSourcing;

use Illuminate\Support\Facades\Http;

class SourcingCampaignService
{
    protected string $token;

    protected string $baseUrl = 'https://api.apify.com/v2';

    public function __construct()
    {
        $this->token = config('services.apify.token');
    }

    public function startRun(
        array $searchQueries,
        array $authorUrls,
        int $maxPosts,
        ?string $postedLimitDate,
    ): array {
        $input = [
            'searchQueries' => $searchQueries,
            'maxPosts' => $maxPosts,
            'scrapeComments' => true,
            'postNestedComments' => true,
            'maxComments' => 50,
            'commentsProfileScraperMode' => 'short',
            'sortBy' => 'date',
        ];

        if (! empty($authorUrls)) {
            $input['authorUrls'] = $authorUrls;
        }

        if ($postedLimitDate) {
            $input['postedLimitDate'] = $postedLimitDate;
        }

        $response = Http::withToken($this->token)
            ->post("{$this->baseUrl}/acts/harvestapi~linkedin-post-search/runs", $input);

        return $response->json();
    }

    public function getRun(string $runId): array
    {
        return Http::withToken($this->token)
            ->get("{$this->baseUrl}/actor-runs/{$runId}")
            ->json('data', []);
    }

    public function getDatasetItems(string $datasetId): array
    {
        return Http::withToken($this->token)
            ->get("{$this->baseUrl}/datasets/{$datasetId}/items", [
                'format' => 'json',
                'clean' => true,
            ])
            ->json() ?? [];
    }
}
