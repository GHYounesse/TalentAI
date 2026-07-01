<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSourcingCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('sourcing-campaigns.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search_queries' => ['nullable', 'array'],
            'search_queries.*' => ['required', 'string', 'max:300'],
            'author_urls' => ['required', 'array', 'min:1'],
            'author_urls.*' => ['required', 'url'],
            'max_posts' => ['nullable', 'integer', 'min:0'],
            'posted_limit_date' => ['nullable', 'date'],
            'brief_id' => ['required', 'integer', 'exists:briefs,id'],
        ];
    }
}
