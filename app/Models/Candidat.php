<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Candidat extends Model
{
    use SoftDeletes;

    protected $table = 'candidats';

    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'current_title',
        'current_company',
        'location',
        'experience_years',
        'education_level',
        'source',
        'source_url',
        'status',
        'linkedin_url', 'headline', 'summary', 'skills', 'open_to_work', 'raw_data',

    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    public function briefs(): BelongsToMany
    {
        return $this->belongsToMany(Brief::class, 'brief_candidat')
            ->withPivot(['score', 'score_breakdown', 'ai_analysis', 'sourced_at'])
            ->withTimestamps();
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class, 'candidate_id');
    }

    protected function casts(): array
    {
        return [
            'skills' => 'array',
            'raw_data' => 'array',
            'open_to_work' => 'boolean',
            'experience_years' => 'float',
        ];
    }
}
