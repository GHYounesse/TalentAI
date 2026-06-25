<?php

namespace App\Services\Transcription;

use App\Models\UserApiToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AssemblyAIService
{
    private const BASE_URL = 'https://api.assemblyai.com/v2';

    private function headers(): array
    {
        $tokenRecord = UserApiToken::where('user_id', auth()->id())
            ->where('provider', 'assemblyai')
            ->first();

        $token = $tokenRecord?->token ?? config('services.assemblyai.key');

        return [
            'Authorization' => $token,
            'Content-Type' => 'application/json',
        ];
    }

    /**
     * Submit a transcription job using a pre-signed S3 URL. Returns the AssemblyAI transcript ID.
     */
    public function submit(string $audioUrl): string
    {
        $start = microtime(true);

        Log::info('AssemblyAIService: submitting transcript', [
            'audio_url_host' => parse_url($audioUrl, PHP_URL_HOST), // avoid logging the full signed URL
        ]);

        $response = Http::withHeaders($this->headers())
            ->retry(3, 500)
            ->timeout(30)
            ->post(self::BASE_URL.'/transcript', [
                'audio_url' => $audioUrl,
                'speech_models' => ['universal-3-pro', 'universal-2'],
                'speaker_labels' => true,
                'speakers_expected' => 2,
            ]);

        $durationMs = (int) ((microtime(true) - $start) * 1000);

        if ($response->failed()) {
            Log::error('AssemblyAIService: submit failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'duration_ms' => $durationMs,
            ]);
            throw new RuntimeException('AssemblyAI submit failed: '.$response->body());
        }

        $id = $response->json('id');

        if (! $id) {
            Log::error('AssemblyAIService: submit succeeded but no transcript ID returned', [
                'body' => $response->body(),
                'duration_ms' => $durationMs,
            ]);
            throw new RuntimeException('AssemblyAI did not return a transcript ID.');
        }

        Log::info('AssemblyAIService: transcript submitted', [
            'assemblyai_transcript_id' => $id,
            'duration_ms' => $durationMs,
        ]);

        return $id;
    }

    /**
     * Check the current status of a transcript. Returns 'queued', 'processing', 'completed', or 'error'.
     */
    public function checkStatus(string $transcriptId): string
    {
        $start = microtime(true);

        $response = Http::withHeaders($this->headers())
            ->retry(3, 500)
            ->timeout(15)
            ->get(self::BASE_URL.'/transcript/'.$transcriptId);

        $durationMs = (int) ((microtime(true) - $start) * 1000);

        if ($response->failed()) {
            Log::error('AssemblyAIService: status check failed', [
                'assemblyai_transcript_id' => $transcriptId,
                'status' => $response->status(),
                'body' => $response->body(),
                'duration_ms' => $durationMs,
            ]);
            throw new RuntimeException('AssemblyAI status check failed: '.$response->body());
        }

        $status = $response->json('status') ?? 'error';

        Log::debug('AssemblyAIService: status checked', [
            'assemblyai_transcript_id' => $transcriptId,
            'assemblyai_status' => $status,
            'duration_ms' => $durationMs,
        ]);

        if ($status === 'error') {
            Log::warning('AssemblyAIService: transcript reported error status', [
                'assemblyai_transcript_id' => $transcriptId,
                'error_detail' => $response->json('error'),
            ]);
        }

        return $status;
    }

    /**
     * Fetch the completed transcript and return parsed utterances.
     * Only call this when checkStatus() returns 'completed'.
     */
    public function fetchUtterances(string $transcriptId): array
    {
        $start = microtime(true);

        $response = Http::withHeaders($this->headers())
            ->retry(3, 500)
            ->timeout(30)
            ->get(self::BASE_URL.'/transcript/'.$transcriptId);

        $durationMs = (int) ((microtime(true) - $start) * 1000);

        if ($response->failed()) {
            Log::error('AssemblyAIService: fetchUtterances failed', [
                'assemblyai_transcript_id' => $transcriptId,
                'status' => $response->status(),
                'body' => $response->body(),
                'duration_ms' => $durationMs,
            ]);
            throw new RuntimeException('AssemblyAI fetch failed: '.$response->body());
        }

        $utterances = $response->json('utterances') ?? [];

        if (empty($utterances)) {
            Log::error('AssemblyAIService: completed transcript has no utterances', [
                'assemblyai_transcript_id' => $transcriptId,
                'duration_ms' => $durationMs,
            ]);
            throw new RuntimeException('AssemblyAI returned no utterances.');
        }

        Log::info('AssemblyAIService: utterances fetched', [
            'assemblyai_transcript_id' => $transcriptId,
            'utterance_count' => count($utterances),
            'duration_ms' => $durationMs,
        ]);

        return array_map(fn ($u) => [
            'speaker' => $u['speaker'],
            'start' => $u['start'],
            'end' => $u['end'],
            'text' => trim($u['text']),
        ], $utterances);
    }
}
