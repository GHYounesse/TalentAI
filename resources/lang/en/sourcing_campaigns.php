<?php

return [

    'index' => [
        'title' => 'Sourcing Campaigns',
        'subtitle' => 'History of LinkedIn post and comment collections.',

        'toolbar' => [
            'new' => 'New Sourcing Campaign',
        ],

        'empty' => [
            'title' => 'No sourcing campaigns yet',
            'description' => 'Launch your first LinkedIn post collection.',
            'cta' => 'New Sourcing Campaign',
        ],

        'columns' => [
            'brief' => 'BRIEF',
            'targets' => 'TARGETS',
            'posts' => 'POSTS',
            'candidates' => 'COMMENTERS',
            'status' => 'STATUS',
            'started' => 'STARTED',
            'campaigns' => 'CAMPAIGNS',
        ],

        'table' => [
            'no_brief' => '—',
            'url_single' => 'URL',
            'url_plural' => 'URLs',
            'keyword_single' => 'keyword',
            'keyword_plural' => 'keywords',
            'no_candidates' => '—',
            'view' => 'View details',
        ],

        'pagination' => [
            'summary_range' => ':from–:to of :total runs',
            'summary_total' => ':total runs',
            'previous' => 'Previous page',
            'next' => 'Next page',
        ],

        'status' => [
            'pending' => 'Pending',
            'running' => 'Running',
            'completed' => 'Completed',
            'failed' => 'Failed',
            'stalled' => 'Stalled',
        ],
    ],

    'create' => [
        'breadcrumb' => 'Sourcing Campaigns › New Sourcing Campaign',

        'header' => [
            'back' => 'Back',
            'parent' => 'Sourcing Campaigns',
            'title' => 'Start a New Sourcing Campaign',
            'subtitle' => 'Enter your search keywords, optionally filter by author profiles, and configure the collection settings.',
        ],

        'sections' => [
            'search' => 'Search',
            'search_desc' => 'Enter the keywords you want to find in LinkedIn posts.',
            'parameters' => 'Collection Parameters',
            'parameters_desc' => 'Fine-tune limits and date filters for this scrape.',
            'brief' => 'Associated Brief',
            'brief_desc' => 'Optionally link this campaign to a job brief.',
        ],

        'fields' => [
            'brief' => [
                'label' => 'Associated Brief',
                'placeholder' => 'Select a brief… (optional)',
            ],
            'search_queries' => [
                'label' => 'Search Keywords',
                'placeholder' => 'Type a keyword and press Enter…',
                'hint' => 'Press Enter or comma to add each keyword',
            ],
            'author_urls' => [
                'label' => 'Author Profiles / Companies',
                'placeholder' => 'Select profiles or companies… (optional)',
                'hint' => 'Restrict results to posts by these authors',
                'no_options' => 'No options found',
            ],
            'max_posts' => [
                'label' => 'Maximum Posts',
                'hint' => '0 = all available posts',
            ],
            'posted_limit_date' => [
                'label' => 'Collect posts after',
                'hint' => 'Leave empty to collect everything',
            ],
        ],

        'actions' => [
            'cancel' => 'Cancel',
            'submit' => 'Start Campaign →',
            'submitting' => 'Starting…',
        ],

        'summary' => [
            'title' => 'Campaign summary',
            'ready' => 'Ready to launch',
            'incomplete' => 'Fill required fields',
            'tip' => 'The campaign will start immediately after submission.',
        ],
    ],

    'show' => [
        'title' => 'Sourcing Campaign #:id',
        'subtitle' => 'Post & Comment Collector',

        'breadcrumb' => [
            'all' => 'All runs',
            'back' => 'Back to Sourcing Campaigns',
        ],

        'status' => [
            'pending' => 'Pending',
            'running' => 'Running',
            'completed' => 'Completed',
            'failed' => 'Failed',
        ],

        'cards' => [
            'search_queries' => [
                'title' => 'Search Keywords',
            ],
            'author_urls' => [
                'title' => 'Author Filters',
            ],
            'status' => [
                'title' => 'Status',
                'label' => 'Current Status',
                'scrape_in_progress' => 'Post collection is in progress — the page updates automatically.',
                'enrich_in_progress' => 'Candidate enrichment is in progress — the page updates automatically.',
            ],
            'posts' => [
                'title' => 'Collected Posts',
                'unit_single' => 'post collected',
                'unit_plural' => 'posts collected',
            ],
            'enrichment' => [
                'label' => 'Candidate Enrichment',
                'complete' => '✓ Completed',
                'running' => 'Enriching…',
            ],
        ],

        'posts_section' => [
            'title' => 'Posts',
            'empty_pending' => 'Posts will appear here once the run is complete.',
            'empty_done' => 'No posts found.',
            'no_comments' => 'No comments collected.',
            'view_post' => 'View original post ↗',
        ],

        'comments_table' => [
            'commenter' => 'Commenter',
            'comment' => 'Comment',
            'candidate' => 'Candidate',
        ],

        'candidat_badge' => [
            'view' => 'View',
        ],

        'post_card' => [
            'unknown_author' => 'Unknown Author',
        ],
    ],

];
