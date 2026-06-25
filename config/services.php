<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'apify' => [
        'token' => env('APIFY_API_TOKEN'),
    ],
    'anthropic' => [
        'key' => env('ANTHROPIC_KEY'),
    ],
    'openrouter' => [
        'key' => env('OPEN_ROUTER_KEY'),
        // Free models used for LinkedIn query generation (sourcing)
        'sourcing_models' => [
            'nvidia/nemotron-3-super-120b-a12b:free',
            'google/gemma-4-31b-it:free',
            'meta-llama/llama-3.3-70b-instruct:free',
        ],
        // Free models used for candidate AI synthesis (analysis)
        'analysis_models' => [
            'nvidia/nemotron-3-super-120b-a12b:free',
            'openrouter/owl-alpha:free',
            'google/gemma-4-31b-it:free',
            'nex-agi/nex-n2-pro:free',
            'meta-llama/llama-3.3-70b-instruct:free',
        ],
    ],
    'groq' => [
        'key' => env('GROQ_API_KEY'),
        'analysis_models' => [
            'llama-3.3-70b-versatile',   // 1,000 req/day
            'qwen/qwen3-32b',             // 1,000 req/day
            'llama-3.1-8b-instant',       // 14,400 req/day — fallback
        ],
    ],
    'assemblyai' => [
        'key' => env('ASSEMBLYAI_API_KEY'),
        'webhook_secret' => env('ASSEMBLYAI_WEBHOOK_SECRET'),
    ],
    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
    ],
    'lusha' => [
        'api_key' => env('LUSHA_API_KEY'),
    ],

];
