<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialComment extends Model
{
    protected $fillable = [
        'social_post_id',
        'linkedin_comment_id',
        'commenter_name',
        'commenter_linkedin_url',
        'commenter_position',
        'commentary',
        'mentions',
        'commented_at',
    ];

    protected $casts = [
        'mentions' => 'array',
        'commented_at' => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function post(): BelongsTo
    {
        return $this->belongsTo(SocialPost::class);
    }

    /**
     * The enriched Candidat profile for this commenter, if one exists.
     * Matched on linkedin_url = commenter_linkedin_url.
     */
    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class, 'commenter_linkedin_url', 'linkedin_url');
    }
}
