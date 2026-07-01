<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class SourcingCampaign extends Model
{
    protected $fillable = [
        'search_queries',
        'author_urls',
        'max_posts',
        'posted_limit_date',
        'brief_id',
        'status',
        'apify_run_id',
        'apify_dataset_id',
        'error_message',
    ];

    protected $casts = [
        'search_queries' => 'array',
        'author_urls' => 'array',
        'posted_limit_date' => 'date',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function brief(): BelongsTo
    {
        return $this->belongsTo(Brief::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(SocialPost::class);
    }

    public function comments(): HasManyThrough
    {
        return $this->hasManyThrough(SocialComment::class, SocialPost::class);
    }
}
