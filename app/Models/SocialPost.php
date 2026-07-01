<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SocialPost extends Model
{
    protected $fillable = [
        'sourcing_campaign_id',
        'linkedin_post_id',
        'linkedin_url',
        'content',
        'author_name',
        'author_public_identifier',
        'author_linkedin_url',
        'author_info',
        'posted_at',
    ];

    protected $casts = [
        'posted_at' => 'datetime',
    ];

    public function sourcingCampaign(): BelongsTo
    {
        return $this->belongsTo(SourcingCampaign::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(SocialComment::class);
    }
}
