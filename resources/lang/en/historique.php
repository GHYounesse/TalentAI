<?php

return [
    'index' => [
        'title' => 'Application history',

        'total' => '{count} interview in total',
        'total_plural' => '{count} interviews in total',
        'active_filters' => '{count} active filter',
        'active_filters_plural' => '{count} active filters',

        'filters' => [
            'fields' => [
                'candidat' => 'Candidate',
                'brief' => 'Brief',
                'decision' => 'Decision',
                'date_from' => 'Start date',
                'date_to' => 'End date',
            ],
        ],

        'decision' => [
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
            'pending' => 'Pending',
        ],

        'columns' => [
            'candidat' => 'CANDIDATE',
            'brief' => 'BRIEF',
            'date' => 'DATE',
            'platform' => 'PLATFORM',
            'ai_score' => 'AI SCORE',
            'decision' => 'DECISION',
            'decided_by' => 'DECIDED BY',
        ],

        'empty' => [
            'title' => 'No interviews found',
            'no_results' => 'No results for these filters. Try resetting them.',
            'no_data' => 'No interviews have been recorded yet.',
        ],

        'actions' => [
            'view_candidat_history' => "View candidate's history",
        ],

        'pagination' => [
            'range' => '{from}–{to} of {total} interviews',
            'count' => '{total} interviews',
        ],
    ],
    'candidat' => [
        'title' => 'History — {name}',
        'breadcrumb' => [
            'candidats' => 'Candidates',
            'historique' => 'History',
        ],
        'heading' => 'Application history',
        'subtitle' => 'All interviews and decisions related to this candidate.',
        'linkedin_link' => 'View LinkedIn profile',
        'open_to_work' => '✓ Open to work',
        'summary' => [
            'title' => 'Summary',
            'total' => 'Total interviews',
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
        ],
        'empty' => [
            'title' => 'No interviews',
            'description' => 'This candidate has not had any interviews yet.',
        ],
    ],

    'interview_card' => [
        'ai_label' => 'AI',
        'ai_recommendation' => 'AI recommendation',
        'recruiter_decision' => "Recruiter's decision",
        'decided_by' => 'by {name}',
        'actions' => [
            'add' => '+ Record a decision',
            'edit' => '✎ Edit decision',
        ],
    ],

    'decision_form' => [
        'title' => 'Record a decision',
        'comment_placeholder' => 'Comment (optional)…',
        'cancel' => 'Cancel',
        'submitting' => 'Saving…',
        'confirm' => 'Confirm →',
    ],
];
