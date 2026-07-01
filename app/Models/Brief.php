<?php

namespace App\Models;

use App\Enums\ContractType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Brief extends Model
{
    use SoftDeletes;

    protected $table = 'briefs';

    protected $fillable = [
        'created_by',
        'product_reference',
        'mission_code',
        'title',
        'sector',
        'contract_type',
        'location',
        'salary_range',
        'min_experience_years',
        'education_level',
        'languages',
        'seniority_level',
        'target_companies',
        'company_headcount',
        'linkedin_function',
        'min_years_at_current_company',
        'gender_pref',
        'age_range',
        'mission_description',
        'required_skills',
        'soft_skills',
        'search_prompt',
        'current_query',
        'next_start_page',
        'scoring_weights',
        'date_lancement',
        'date_cloture',
        'status',
    ];

    protected $hidden = ['search_prompt', 'current_query', 'scoring_weights'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scoring_weights' => 'array',
            'min_experience_years' => 'integer',
            'min_years_at_current_company' => 'integer',
            'next_start_page' => 'integer',
            'contract_type' => ContractType::class,
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function apifyRuns(): HasMany
    {
        return $this->hasMany(ApifyRun::class);
    }

    public function queryHistories(): HasMany
    {
        return $this->hasMany(BriefQueryHistory::class)->latest('created_at');
    }

    public function candidates(): BelongsToMany
    {
        return $this->belongsToMany(Candidat::class)
            ->withPivot(['score', 'score_breakdown', 'ai_analysis', 'sourced_at'])
            ->withTimestamps();
    }
}
