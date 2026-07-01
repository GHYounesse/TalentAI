<?php

namespace App\Services\Recruitment;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Generates a LinkedIn Boolean job-title search string from a natural-language
 * recruiter prompt + brief title, using free AI models with automatic fallback.
 *
 * Chain: OpenRouter (llama-3.1-8b free) → Groq (llama-3.1-8b) → hardcoded keyword fallback
 *
 * Output format: "title" NOT (term1 OR term2 OR ...) — max 300 chars for Apify's currentJobTitles.
 */
class QueryGeneratorService
{
    private const MAX_CHARS = 300;

    private const SYSTEM_PROMPT_TARGETED = <<<'PROMPT'
You are a LinkedIn recruiter search expert. Given a job title and a recruiter's instruction in French or English, generate a LinkedIn Boolean search string for the currentJobTitles field.

Rules:
1. Output ONLY the search string, nothing else — no explanation, no markdown, no quotes around the whole string.
2. Format: "job title" NOT (excluded1 OR excluded2 OR ...)
3. Use the exact job title from the brief inside double quotes.
4. Extract exclusion keywords from the instruction. Include obvious seniority/management terms that contradict the intent (e.g. if junior is requested, exclude: senior, lead, manager, responsable, directeur, chef, head, principal, VP).
5. All operators (NOT, OR) must be UPPERCASE.
6. The entire output must not exceed 280 characters.
7. If no exclusions are needed, output just the quoted title.
PROMPT;

    private const SYSTEM_PROMPT_BROAD = <<<'PROMPT'
You are a LinkedIn recruiter search expert. Given a job title and a recruiter's instruction in French or English, generate a LinkedIn Boolean search string for the searchQuery field (fuzzy search).

Rules:
1. Output ONLY the search string, nothing else — no explanation, no markdown, no quotes around the whole string.
2. Format: "job title" NOT (excluded1 OR excluded2 OR ...)
3. Use the exact job title from the brief inside double quotes.
4. Extract the most important exclusion keywords only. Maximum 5 exclusion terms total.
5. All operators (NOT, OR) must be UPPERCASE.
6. The entire output must not exceed 280 characters.
7. If no exclusions are needed, output just the quoted title.
PROMPT;

    public function generate(string $briefTitle, string $searchPrompt, string $mode = 'targeted'): string
    {
        $userMessage = "Brief title: {$briefTitle}\nInstruction: {$searchPrompt}";

        $result = $this->tryOpenRouter($userMessage, $mode)
            ?? $this->tryGroq($userMessage, $mode)
            ?? $this->hardcodedFallback($briefTitle, $searchPrompt, $mode);

        // Reject responses that echo the prompt rather than generating a query
        if ($this->looksLikePrompt($result)) {
            Log::warning('[QueryGenerator] AI returned prompt echo, using fallback');
            $result = $this->hardcodedFallback($briefTitle, $searchPrompt);
        }

        if ($mode === 'broad') {
            $result = $this->enforceMaxExclusions($result, 5);
        }

        return $this->enforce300Limit($result);
    }

    private function enforceMaxExclusions(string $query, int $max): string
    {
        if (! preg_match('/^(.+? NOT \()(.+)(\))$/', $query, $m)) {
            return $query;
        }

        $terms = array_map('trim', explode(' OR ', $m[2]));
        if (count($terms) <= $max) {
            return $query;
        }

        return $m[1].implode(' OR ', array_slice($terms, 0, $max)).$m[3];
    }

    private function looksLikePrompt(string $text): bool
    {
        return str_contains($text, 'Instruction:')
            || str_starts_with($text, 'We need')
            || str_starts_with($text, 'Title:')
            || str_starts_with($text, 'Brief title');
    }

    private function tryOpenRouter(string $userMessage, string $mode = 'targeted'): ?string
    {
        $key = config('services.openrouter.key');
        if (! $key) {
            return null;
        }

        $systemPrompt = $mode === 'broad' ? self::SYSTEM_PROMPT_BROAD : self::SYSTEM_PROMPT_TARGETED;
        $models = config('services.openrouter.sourcing_models', ['google/gemini-2.0-flash-exp:free']);

        foreach ($models as $model) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => "Bearer {$key}",
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => 'TalentAI',
                ])
                    ->timeout(15)
                    ->post('https://openrouter.ai/api/v1/chat/completions', [
                        'model' => $model,
                        'messages' => [
                            ['role' => 'system', 'content' => $systemPrompt],
                            ['role' => 'user', 'content' => $userMessage],
                        ],
                        'max_tokens' => 100,
                        'temperature' => 0.2,
                    ]);

                if ($response->successful()) {
                    $text = trim($response->json('choices.0.message.content') ?? '');
                    if ($text) {
                        Log::info('[QueryGenerator] OpenRouter success', ['model' => $model]);

                        return $text;
                    }
                }

                Log::warning('[QueryGenerator] OpenRouter model failed, trying next', [
                    'model' => $model,
                    'status' => $response->status(),
                ]);
            } catch (\Throwable $e) {
                Log::warning('[QueryGenerator] OpenRouter model exception, trying next', [
                    'model' => $model,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return null;
    }

    private function tryGroq(string $userMessage, string $mode = 'targeted'): ?string
    {
        $key = config('services.groq.key');
        if (! $key) {
            return null;
        }

        $systemPrompt = $mode === 'broad' ? self::SYSTEM_PROMPT_BROAD : self::SYSTEM_PROMPT_TARGETED;

        try {
            $response = Http::withToken($key)
                ->timeout(15)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.1-8b-instant',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userMessage],
                    ],
                    'max_tokens' => 100,
                    'temperature' => 0.2,
                ]);

            if ($response->successful()) {
                $text = trim($response->json('choices.0.message.content') ?? '');
                if ($text) {
                    return $text;
                }
            }

            Log::warning('[QueryGenerator] Groq failed', ['status' => $response->status()]);
        } catch (\Throwable $e) {
            Log::warning('[QueryGenerator] Groq exception', ['error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Rule-based fallback: extract explicit exclusions from the prompt + apply
     * a seniority/management exclusion list when "junior" or "débutant" is detected.
     */
    private function hardcodedFallback(string $briefTitle, string $searchPrompt, string $mode = 'targeted'): string
    {
        $prompt = mb_strtolower($searchPrompt);

        // Management/seniority terms always worth excluding
        $managementTerms = $mode === 'broad'
            ? ['responsable', 'directeur', 'manager', 'chef', 'lead']
            : ['responsable', 'directeur', 'manager', 'chef', 'lead', 'head', 'senior', 'principal', 'VP', 'DG', 'DAF'];

        // Detect junior intent
        $wantsJunior = preg_match('/junior|débutant|debutant|entry.level|0.?[àa].?2.?ans/u', $prompt);

        $exclusions = $wantsJunior ? $managementTerms : [];

        // Extract explicit "exclure/exclude/pas de X" patterns
        if (preg_match_all('/(?:exclure?|exclude?|pas de|without|sans)\s+([\w\s,]+?)(?:\.|,|$)/u', $prompt, $matches)) {
            foreach ($matches[1] as $group) {
                foreach (preg_split('/[\s,]+/', trim($group)) as $word) {
                    $word = trim($word);
                    if (strlen($word) >= 3 && ! in_array(mb_strtolower($word), array_map('mb_strtolower', $exclusions))) {
                        $exclusions[] = $word;
                    }
                }
            }
        }

        if (empty($exclusions)) {
            return '"'.$briefTitle.'"';
        }

        return '"'.$briefTitle.'" NOT ('.implode(' OR ', $exclusions).')';
    }

    private function enforce300Limit(string $query): string
    {
        if (mb_strlen($query) <= self::MAX_CHARS) {
            return $query;
        }

        // Strip terms from the NOT list one by one until it fits
        if (preg_match('/^(.+? NOT \()(.+)(\))$/', $query, $m)) {
            $prefix = $m[1];
            $terms = array_map('trim', explode(' OR ', $m[2]));
            $suffix = $m[3];

            while (! empty($terms) && mb_strlen($prefix.implode(' OR ', $terms).$suffix) > self::MAX_CHARS) {
                array_pop($terms);
            }

            if (empty($terms)) {
                // Extract just the quoted title
                preg_match('/"[^"]+"/', $query, $titleMatch);

                return $titleMatch[0] ?? mb_substr($query, 0, self::MAX_CHARS);
            }

            return $prefix.implode(' OR ', $terms).$suffix;
        }

        return mb_substr($query, 0, self::MAX_CHARS);
    }
}
