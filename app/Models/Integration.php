<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Integration extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'provider', 'label', 'category', 'icon', 'description',
        'token_label', 'placeholder', 'env_key', 'test_url',
        'docs_url', 'oauth', 'is_active', 'is_system',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'api_token' => 'encrypted',
            'active' => 'boolean',
            'credits_used' => 'integer',
            'credits_limit' => 'integer',
            'token_expires_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
