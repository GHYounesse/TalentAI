<?php

return [

    'create' => [
        'breadcrumb' => 'Sourcing › New candidat',

        'form' => [
            'title' => 'Add a candidat',
            'subtitle' => 'Fill in the form below to create a new candidat.',

            'sections' => [
                'identity' => 'Identity',
                'professional' => 'Professional background',
                'profile' => 'Profile details',
            ],
        ],

        'fields' => [
            'full_name' => 'Full name',
            'full_name_placeholder' => 'e.g. Jane Dupont',
            'email' => 'Email address',
            'email_placeholder' => 'e.g. jane.dupont@email.com',
            'phone' => 'Phone number',
            'phone_placeholder' => 'e.g. +33 6 12 34 56 78',
            'current_title' => 'Current job title',
            'current_title_placeholder' => 'e.g. Senior Backend Developer',
            'current_company' => 'Current company',
            'current_company_placeholder' => 'e.g. Acme Corp',
            'location' => 'Location',
            'location_placeholder' => 'e.g. Paris, Remote…',
            'experience_years' => 'Years of experience',
            'experience_years_placeholder' => 'e.g. 5',
            'education_level' => 'Education level',
            'education_level_placeholder' => 'e.g. Bachelor, Master…',
            'source' => 'Source',
            'source_placeholder' => 'e.g. LinkedIn, Referral…',
            'source_url' => 'Source URL',
            'source_url_placeholder' => 'https://linkedin.com/in/…',
            'linkedin_url' => 'LinkedIn profile',
            'linkedin_url_placeholder' => 'https://linkedin.com/in/…',
            'headline' => 'Headline',
            'headline_placeholder' => 'e.g. Full-Stack Developer · 7 years exp.',
            'summary' => 'Summary',
            'summary_placeholder' => 'Overview of the candidat’s background and ambitions…',
            'skills' => 'Skills',
            'skills_placeholder' => 'e.g. Python, React, SQL…',
            'open_to_work' => 'Open to opportunities',
            'status' => 'Status',
            'status_placeholder' => 'Select a status',
        ],

        'actions' => [
            'back' => 'Back',
            'create' => 'Add candidat',
            'creating' => 'Adding…',
        ],
    ],

    'validation' => [
        'required' => 'This field is required.',
        'email_invalid' => 'Please enter a valid email address.',
        'url_invalid' => 'Please enter a valid URL.',
        'min_length' => 'This field must contain at least :min characters.',
        'max_length' => 'This field must not exceed :max characters.',
        'positive_number' => 'Please enter a valid positive number.',
    ],

    'show' => [
        'breadcrumb' => 'Sourcing › Candidat details',
        'subtitle' => 'Full profile of the candidat',

        'sections' => [
            'identity' => 'Identity',
            'professional' => 'Professional background',
            'profile' => 'Profile details',
            'meta' => 'System information',
        ],

        'fields' => [
            'full_name' => 'Full name',
            'email' => 'Email address',
            'phone' => 'Phone number',
            'current_title' => 'Current job title',
            'current_company' => 'Current company',
            'location' => 'Location',
            'experience_years' => 'Experience',
            'years' => 'years',
            'education_level' => 'Education level',
            'source' => 'Source',
            'source_url' => 'Source URL',
            'linkedin_url' => 'LinkedIn profile',
            'headline' => 'Headline',
            'summary' => 'Summary',
            'skills' => 'Skills',
            'open_to_work' => 'Open to opportunities',
            'status' => 'Status',
            'created_at' => 'Date added',
        ],

        'statuses' => [
            'sourced' => 'Sourced',
            'contacted' => 'Contacted',
            'interview' => 'Interview',
            'recommended' => 'Recommended',
            'offer' => 'Offer',
            'rejected' => 'Rejected',
        ],

        'actions' => [
            'back' => 'Back to list',
            'edit' => 'Edit',
            'delete' => 'Delete',
        ],
    ],

    'fallback' => [
        'breadcrumb' => 'Sourcing › Error',
        'title' => 'Something went wrong',
        'subtitle' => 'An unexpected error occurred',
        'heading' => 'Unable to load this page',
        'description' => 'An error occurred on our end. You can try again or go back to the list.',

        'actions' => [
            'back' => 'Back to list',
            'retry' => 'Try again',
        ],
    ],

    'edit' => [
        'breadcrumb' => 'Sourcing › Edit candidat',
        'title' => 'Edit candidat',
        'subtitle' => 'Update the candidat information below.',

        'actions' => [
            'back' => 'Back to list',
            'show' => 'View profile',
            'save' => 'Save changes',
            'saving' => 'Saving…',
            'cancel' => 'Cancel',
            'cancel_confirm' => 'Discard changes?',
            'cancel_yes' => 'Yes, discard',
            'cancel_no' => 'Keep editing',
        ],
    ],

    'index' => [
        'breadcrumb' => 'Sourcing / Candidats',
        'title' => 'Candidat Management',
        'subtitle' => 'Manage and track all your candidats efficiently.',

        'search_placeholder' => 'Search by name, email or title…',

        'actions' => [
            'create' => 'Add Candidat',
            'search' => 'Search',
            'reset' => 'Reset',
            'view' => 'View',
            'edit' => 'Edit',
            'delete' => 'Delete',
        ],

        'columns' => [
            'candidat' => 'Candidat',
            'current_position' => 'Current position',
            'experience' => 'Experience',
            'location' => 'Location',
            'source' => 'Source',
            'status' => 'Status',
            'created_at' => 'Added',
            'actions' => 'Actions',
        ],

        'empty' => [
            'title' => 'No candidats found',
            'description' => 'Get started by adding your first candidat.',
        ],

        'modal' => [
            'title' => 'Delete candidat',
            'description' => 'Are you sure you want to permanently delete this candidat?',
            'cancel' => 'Cancel',
            'confirm' => 'Yes, delete',
            'recruiter_notes' => 'Recruiter Notes',
            'close' => 'Close',
        ],

        'filters' => [
            'full_name' => 'Full name',
            'headline' => 'Headline',
            'location' => 'Location',
            'recruiter_notes' => 'Recruiter notes',
            'current_company' => 'Company',
            'current_title' => 'Current position',
            'experience_years' => 'Experience',
            'education_level' => 'Education',
            'sector' => 'Sector',
            'source' => 'Source',
            'status' => 'Status',
            'open_to_work' => 'Open to Work',
            'yes' => 'Yes',
            'no' => 'No',
            'status_options' => [
                'sourced' => 'Sourced',
                'contacted' => 'Contacted',
                'interview' => 'Interview',
                'recommended' => 'Recommended',
                'offer' => 'Offer',
                'rejected' => 'Rejected',
            ],
        ],
    ],

];
