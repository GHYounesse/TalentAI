<?php

return [

    /*
    |--------------------------------------------------------------------------
    | User Integrations
    |--------------------------------------------------------------------------
    */

    'page' => [
        'title' => 'Integrations & APIs',
        'subtitle' => 'Connect external services. Credentials are encrypted and stored per user.',
    ],

    'counter' => [
        'connected' => 'connected',
    ],

    'status' => [
        'connected' => 'Connected',
        'env_fallback' => 'Global configuration',
        'not_configured' => 'Not configured',
        'expired' => 'Expired',
    ],

    'token' => [
        'current' => 'Current token',
        'replace' => 'Replace token',
        'copy' => 'Copy',
        'client_secret' => 'Client Secret',
        'expiry_date' => 'Expiration date',
        'expiry_optional' => '(optional)',
        'expires' => 'Expires :date',
        'last_used' => 'Last used: :date',
    ],

    'token_invalid' => 'Invalid token or connection failed. Please check and try again.',

    'expiry_warning' => 'This token expired on :date. Please renew it.',

    'test_result' => [
        'ok' => 'Connection successful',
        'fail' => 'Invalid token or service unavailable',
    ],

    'actions' => [
        'connect' => 'Connect',
        'replace' => 'Replace',
        'test' => 'Test',
        'docs' => 'Documentation',
        'revoke' => 'Revoke',
    ],

    'fallback_note' => [
        'label' => 'Global configuration',
        'message' => 'If no personal token is configured, the application-wide configuration will be used.',
    ],
    'category_count' => '{{count}} integrations',

    'empty' => [
        'title' => 'No integrations found',
        'description' => 'Try changing the selected filter.',
    ],
    'all' => 'All',

    /*
    |--------------------------------------------------------------------------
    | Categories
    |--------------------------------------------------------------------------
    */

    'categories' => [
        'sourcing' => 'Sourcing',
        'ai' => 'Artificial Intelligence',
        'scheduling' => 'Scheduling',
        'communication' => 'Communication',
        'storage' => 'Storage',
        'analytics' => 'Analytics',
        'other' => 'Other',
    ],

    /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    */

    'admin' => [

        'page' => [
            'title' => 'Integration Management',
            'subtitle' => 'Manage providers available to users.',
        ],

        'counter' => [
            'active' => 'active',
        ],

        'empty' => [
            'title' => 'No integrations configured',
            'description' => 'Create your first integration to get started.',
        ],

        'table' => [
            'integration' => 'Integration',
            'provider' => 'Provider',
            'env_key' => 'ENV Key',
            'oauth' => 'Authentication',
            'status' => 'Status',
            'actions' => 'Actions',
        ],

        'status' => [
            'active' => 'Active',
            'inactive' => 'Inactive',
        ],

        'auth' => [
            'oauth' => 'OAuth',
            'token' => 'Token',
        ],

        'badges' => [
            'system' => 'System',
        ],

        'actions' => [
            'create' => 'New Integration',
            'edit' => 'Edit',
            'delete' => 'Delete',
            'activate' => 'Activate',
            'deactivate' => 'Deactivate',
            'close' => 'Close',
            'save' => 'Save',
            'create_submit' => 'Create',
        ],

        'modal' => [
            'create_title' => 'Create Integration',
            'edit_title' => 'Edit Integration',
            'create_subtitle' => 'Add a new provider',
            'edit_subtitle' => 'Update "{{label}}"',
            'delete' => [
                'title' => 'Delete Integration',
                'description' => 'Are you sure you want to delete this integration?',
                'confirm' => 'Delete',
                'cancel' => 'Cancel',
            ],

        ],
        'form' => [
            'icon' => 'Icon',
            'provider_key' => 'Provider key',
            'display_name' => 'Display name',
            'category' => 'Category',
            'choose' => 'Choose...',
            'description' => 'Description',
            'token_label' => 'Token field label',
            'placeholder' => 'Placeholder',
            'env_key' => 'Environment variable (fallback)',
            'test_url' => 'Test URL',
            'docs_url' => 'Documentation URL',
            'active' => 'Active',
            'active_help' => 'Visible and usable by users',

            'sections' => [
                'user_fields' => 'User form fields',
                'technical_config' => 'Technical configuration',
            ],

            'placeholders' => [
                'label' => 'My Integration',
                'description' => 'Short integration description',
                'token_label' => 'API key',
            ],
        ],

    ],
];
