<?php

namespace App\Services\Recruitment;

use App\Models\Brief;
use App\Services\ActivityLogger;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    public function analyseCV(string $cvText, Brief $brief): array
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        $prompt = $this->buildPrompt(substr($cvText, 0, 12000), $brief);

        try {
            return $this->callGemini($prompt, $logger);
        } catch (\Throwable $e) {
            Log::warning('GEMINI FAILED — switching to OpenRouter fallback', [
                'reason' => $e->getMessage(),
            ]);

            try {
                return $this->callOpenRouterFallback($prompt, $logger);
            } catch (\Throwable $fallbackException) {
                Log::error('OPENROUTER FALLBACK ALSO FAILED', [
                    'message' => $fallbackException->getMessage(),
                ]);
                $logger->log('cv_analysis.fallback_failed', $fallbackException->getMessage(), [], []);

                throw new \Exception($fallbackException->getMessage());
            }
        }
    }

    private function buildPrompt(string $cvText, Brief $brief): string
    {
        return <<<PROMPT
        You are an AI recruitment system.

        Return ONLY valid JSON.
        Do NOT return markdown.
        Do NOT omit any field.

        All fields are mandatory.

        You must extract:
        1. Candidate information
        2. Structured CV data
        3. Recruitment scoring

        You must ALWAYS generate:
        - reasoning_fr in French
        - reasoning_en in English

        Return this exact JSON structure:

        {
        "candidate": {
            "full_name": "",
            "email": "",
            "phone": "",
            "skills": [],
            "experience_years": 0,
            "summary": ""
        },

        "structured_cv": {
            "profile": "",
            "education": [
            {
                "degree": "",
                "school": "",
                "year": ""
            }
            ],
            "experiences": [
            {
                "position": "",
                "company": "",
                "duration": "",
                "description": ""
            }
            ],
            "projects": [
            {
                "name": "",
                "description": "",
                "technologies": []
            }
            ],
            "certifications": [],
            "languages": [],
            "technical_skills": [],
            "soft_skills": []
        },

        "scores": {
            "experience": 0,
            "education": 0,
            "sector": 0,
            "soft_skills": 0,
            "location": 0
        },

        "global_score": 0,

        "matched_skills": [],
        "missing_skills": [],

        "reasoning_fr": "",
        "reasoning_en": ""
        }

        Job Brief:
        {$brief->mission_description}

        Skills Required:
        {$brief->required_skills}

        CV:
        {$cvText}
        PROMPT;
    }

    private function callGemini(string $prompt, ActivityLogger $logger): array
    {
        $logger->log('gemini.request', 'Appel Gemini API', [], []);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-goog-api-key' => config('services.gemini.key'),
        ])
            ->timeout(30)
            ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', [
                'contents' => [[
                    'parts' => [['text' => $prompt]],
                ]],
            ]);

        if (! $response->successful()) {
            $logger->log('gemini.error', 'API Gemini failed', ['status' => $response->status()], []);
            Log::error('Gemini request failed');
            throw new \Exception('Gemini API error: '.$response->status());
        }

        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');

        if (! $text) {
            Log::error('Gemini returned empty text');
            throw new \Exception('Gemini returned empty response');
        }

        return $this->parseJsonResponse($text);
    }

    private function callOpenRouterFallback(string $prompt, ActivityLogger $logger): array
    {
        $logger->log('openrouter.fallback.request', 'Appel OpenRouter fallback (Gemini indisponible)', [], []);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.config('services.openrouter.key'),
            'HTTP-Referer' => 'http://localhost',
            'X-Title' => 'TalentAI',
        ])->timeout(60)->post('https://openrouter.ai/api/v1/chat/completions', [
            'model' => 'meta-llama/llama-3.1-8b-instruct',
            'messages' => [
                ['role' => 'user', 'content' => trim($prompt)],
            ],
            'max_tokens' => 4000,
        ]);

        if (! $response->successful()) {
            $logger->log('openrouter.fallback.error', 'OpenRouter fallback failed', ['status' => $response->status()], []);
            throw new \Exception('OpenRouter fallback error: '.$response->status());
        }

        $text = $response->json('choices.0.message.content', '');

        if (! $text) {
            throw new \Exception('OpenRouter fallback returned empty response');
        }

        $logger->log('openrouter.fallback.success', 'OpenRouter fallback succeeded', [], []);

        return $this->parseJsonResponse($text);
    }

    private function parseJsonResponse(string $text): array
    {
        $text = preg_replace('/```json|```/', '', $text);
        preg_match('/\{.*\}/s', $text, $matches);

        if (! isset($matches[0])) {
            Log::error('No JSON found in response');
            throw new \Exception('No JSON found in response');
        }

        $decoded = json_decode($matches[0], true);

        if (! is_array($decoded)) {
            Log::error('JSON decode failed');
            throw new \Exception('Failed to decode JSON response');
        }

        return $decoded;
    }
}
