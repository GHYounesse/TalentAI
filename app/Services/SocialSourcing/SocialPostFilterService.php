<?php

namespace App\Services\SocialSourcing;

use App\Models\Brief;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SocialPostFilterService
{
    private const MODEL = 'mistralai/mistral-small-3.2-24b-instruct';

    private const MAX_TOKENS = 2048;

    private string $apiKey;

    private string $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('services.openrouter.key');
        $this->apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    }

    /**
     * Filter a batch of raw Apify post items against a brief.
     *
     * Returns only the items whose content is aligned with the brief.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    public function filterSocialPosts(array $items, Brief $brief): array
    {
        if (empty($items)) {
            return [];
        }

        // Build a compact index: we only send what the LLM needs to judge relevance.
        $indexed = [];
        foreach ($items as $i => $item) {
            $indexed[$i] = [
                'id' => $i,
                'content' => mb_substr($item['content'] ?? '', 0, 800),
            ];
        }

        $briefSummary = $this->buildBriefSummary($brief);
        $prompt = $this->buildPrompt($briefSummary, $indexed);

        $decisions = $this->callApi($prompt);

        if ($decisions === null) {
            // On API failure, be permissive — store everything rather than lose data.
            Log::warning('SocialPostFilterService: API call failed, storing all posts as fallback.');

            return $items;
        }

        // Keep only items the model marked as aligned.
        return array_values(
            array_filter($items, fn ($_, $i) => ($decisions[$i] ?? false) === true, ARRAY_FILTER_USE_BOTH)
        );
    }

    // -------------------------------------------------------------------------
    // Internals
    // -------------------------------------------------------------------------

    private function buildBriefSummary(Brief $brief): string
    {
        $parts = [];

        if ($brief->title) {
            $parts[] = "Poste : {$brief->title}";
        }
        if ($brief->sector) {
            $parts[] = "Secteur : {$brief->sector}";
        }
        if ($brief->mission_description) {
            $parts[] = "Mission : {$brief->mission_description}";
        }
        if ($brief->required_skills) {
            $parts[] = "Compétences requises : {$brief->required_skills}";
        }
        if ($brief->soft_skills) {
            $parts[] = "Soft skills : {$brief->soft_skills}";
        }
        if ($brief->search_prompt) {
            $parts[] = "Instruction de sourcing : {$brief->search_prompt}";
        }

        return implode("\n", $parts);
    }

    /**
     * @param  array<int, array{id: int, content: string}>  $indexed
     */
    private function buildPrompt(string $briefSummary, array $indexed): string
    {
        $postsJson = json_encode(array_values($indexed), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        return <<<PROMPT
        You are a recruitment sourcing assistant. You are given a set of LinkedIn company posts (job listings) and a recruitment brief.

        Your job is to decide whether each post is advertising a role that matches the brief.

        A post is RELEVANT (true) if the job it describes is aligned with the role in the brief — same or closely related field, skills, or position type.
        A post is NOT RELEVANT (false) if the job it describes is in a different field, requires unrelated skills, or targets a completely different profile.

        ## Examples
        - Brief: "Web Developer (React, Laravel)" | Post: "We are hiring an Electrical Engineer" → false
        - Brief: "Web Developer (React, Laravel)" | Post: "Join us as a Frontend Engineer (React, TypeScript)" → true
        - Brief: "Sales Manager, SaaS" | Post: "We are looking for a Civil Engineer" → false
        - Brief: "Sales Manager, SaaS" | Post: "Hiring: Account Executive B2B Software" → true

        ## Brief
        {$briefSummary}

        ## Job posts to evaluate
        {$postsJson}

        ## Instructions
        - Evaluate each post independently based on whether the advertised role matches the brief.
        - Respond ONLY with a valid JSON object mapping each post's "id" (integer) to true or false.
        - No explanation, no markdown, no extra keys. Example: {"0": true, "1": false, "2": true}
        PROMPT;
    }

    /**
     * Call OpenRouter and parse the JSON decision map.
     *
     * @return array<int, bool>|null null on failure
     */
    private function callApi(string $prompt): ?array
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(60)
                ->post($this->apiUrl, [
                    'model' => self::MODEL,
                    'max_tokens' => self::MAX_TOKENS,
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt],
                    ],
                ]);

            if (! $response->successful()) {
                Log::error('SocialPostFilterService: API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $raw = $response->json('choices.0.message.content', '');
            // Strip any accidental markdown fences the model may add.
            $clean = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));

            /** @var array<string, bool>|null $decoded */
            $decoded = json_decode($clean, true);

            if (! is_array($decoded)) {
                Log::error('SocialPostFilterService: Could not parse response', ['raw' => $raw]);

                return null;
            }

            // Normalise string keys ("0", "1"…) to int keys.
            return array_combine(
                array_map('intval', array_keys($decoded)),
                array_values($decoded),
            );

        } catch (\Throwable $e) {
            Log::error('SocialPostFilterService: Exception', ['message' => $e->getMessage()]);

            return null;
        }
    }
}
