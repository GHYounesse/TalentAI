<?php

namespace App\Jobs;

use App\Models\Brief;
use App\Models\SocialComment;
use App\Models\SocialPost;
use App\Models\SourcingCampaign;
use App\Services\SocialSourcing\SocialPostFilterService;
use App\Services\SocialSourcing\SourcingCampaignService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SocialPostScrapePollerJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    protected const POLL_DELAY_SECONDS = 15;

    // ~20 minutes of polling before we give up and mark the run failed
    protected const MAX_ATTEMPTS = 80;

    public function __construct(protected int $sourcingCampaignId) {}

    public function handle(SourcingCampaignService $sourcingCampaignService): void
    {
        $sourcingCampaign = SourcingCampaign::find($this->sourcingCampaignId);

        if (! $sourcingCampaign || ! $sourcingCampaign->apify_run_id) {
            return;
        }

        $run = $sourcingCampaignService->getRun($sourcingCampaign->apify_run_id);

        $status = $run['status'] ?? 'UNKNOWN';

        match ($status) {
            'SUCCEEDED' => $this->handleSuccess($sourcingCampaign, $sourcingCampaignService, $run),
            'FAILED', 'ABORTED', 'TIMED-OUT' => $this->handleFailure($sourcingCampaign, $status),
            default => $this->handleStillRunning($sourcingCampaign),
        };
    }

    protected function handleStillRunning(SourcingCampaign $sourcingCampaign): void
    {
        $sourcingCampaign->increment('poll_attempts');
        $sourcingCampaign->update(['status' => 'running']);

        if ($sourcingCampaign->poll_attempts >= self::MAX_ATTEMPTS) {
            $sourcingCampaign->update([
                'status' => 'failed',
                'error_message' => 'Polling timed out waiting for the Apify run to finish.',
            ]);

            return;
        }

        self::dispatch($this->sourcingCampaignId)->delay(now()->addSeconds(self::POLL_DELAY_SECONDS));
    }

    protected function handleFailure(SourcingCampaign $sourcingCampaign, string $status): void
    {
        $sourcingCampaign->update([
            'status' => 'failed',
            'error_message' => "Apify run ended with status: {$status}",
        ]);
    }

    /**
     * @param  array<string, mixed>  $run
     */
    protected function handleSuccess(SourcingCampaign $sourcingCampaign, SourcingCampaignService $sourcingCampaignService, array $run): void
    {
        $datasetId = $run['defaultDatasetId'] ?? $sourcingCampaign->apify_dataset_id;

        if (! $datasetId) {
            $sourcingCampaign->update([
                'status' => 'failed',
                'error_message' => 'Run succeeded but no dataset id was returned.',
            ]);

            return;
        }

        $sourcingCampaign->update(['apify_dataset_id' => $datasetId]);

        $items = $sourcingCampaignService->getDatasetItems($datasetId);

        // Isolate post-type items first.
        $postItems = array_values(
            array_filter($items, fn ($item) => ($item['type'] ?? null) === 'post')
        );

        // Filter against the brief using AI — skip filtering if no brief is linked.
        $brief = Brief::find($sourcingCampaign->brief_id);

        if ($brief) {
            $filter = app(SocialPostFilterService::class);
            $postItems = $filter->filterSocialPosts($postItems, $brief);
        }

        foreach ($postItems as $item) {
            $this->storeSocialPost($sourcingCampaign, $item);
        }

        $sourcingCampaign->update(['status' => 'completed']);
    }

    /**
     * @param  array<string, mixed>  $item
     */
    protected function storeSocialPost(SourcingCampaign $sourcingCampaign, array $item): void
    {
        $author = $item['author'] ?? [];

        $post = SocialPost::updateOrCreate(
            [
                'sourcing_campaign_id' => $sourcingCampaign->id,
                'linkedin_post_id' => $item['id'] ?? $item['linkedinUrl'] ?? uniqid('post_'),
            ],
            [
                'linkedin_url' => $item['linkedinUrl'] ?? null,
                'content' => $item['content'] ?? null,
                'author_name' => $author['name'] ?? null,
                'author_public_identifier' => $author['publicIdentifier'] ?? null,
                'author_linkedin_url' => $author['linkedinUrl'] ?? null,
                'author_info' => $author['info'] ?? null,
                'posted_at' => $item['postedAt']['date'] ?? null,
            ]
        );

        foreach ($item['comments'] ?? [] as $comment) {
            $actor = $comment['actor'] ?? [];

            SocialComment::updateOrCreate(
                [
                    'social_post_id' => $post->id,
                    'linkedin_comment_id' => $comment['id'] ?? null,
                ],
                [
                    'commenter_name' => $actor['name'] ?? null,
                    'commenter_linkedin_url' => $actor['linkedinUrl'] ?? null,
                    'commenter_position' => $actor['position'] ?? null,
                    'commentary' => $comment['commentary'] ?? null,
                    'commented_at' => $comment['createdAt'] ?? null,
                ]
            );
        }
    }
}
