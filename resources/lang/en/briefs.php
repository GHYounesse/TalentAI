<?php

return [

    'create_briefs' => [
        'breadcrumb' => 'Sourcing › New brief',

        'create' => [
            'title' => 'Create a recruitment brief',
            'subtitle' => 'Fill in the criteria · The AI will use them to analyse candidates',

            'sections' => [
                'position' => 'Position information',
                'candidate' => 'Candidate criteria',
                'description' => 'Description',
                'scoring' => 'AI scoring weights',
            ],
        ],

        'fields' => [
            'mission_code' => 'Mission Code',
            'mission_code_placeholder' => 'e.g. DEV-001',
            'product_reference' => 'Product Reference',
            'product_reference_placeholder' => 'e.g. PROD-001',
            'title' => 'Job title',
            'title_placeholder' => 'e.g. Senior Full-Stack Developer',
            'sector' => 'Sector',
            'sector_placeholder' => 'e.g. Technology, Finance…',
            'contract_type' => 'Contract type',
            'contract_type_placeholder' => 'Select a contract type',
            'location' => 'Location',
            'location_placeholder' => 'e.g. Paris, Remote…',
            'salary_range' => 'Salary range',
            'salary_range_placeholder' => 'e.g. 40000 - 55000 €',
            'min_experience_years' => 'Minimum experience (years)',
            'min_experience_years_placeholder' => 'e.g. 3',
            'education_level' => 'Education level',
            'education_level_placeholder' => 'e.g. Bachelor, Master…',
            'required_skills' => 'Required skills',
            'required_skills_placeholder' => 'e.g. Python, SQL…',
            'languages' => 'Required languages ',
            'languages_placeholder' => 'e.g. English, French, Arabe…',
            'age_range' => 'Preferred age range',
            'age_range_placeholder' => 'e.g. 25 - 35',
            'gender_pref' => 'Gender preference',
            'gender_pref_placeholder' => 'No preference',
            'mission_description' => 'Main mission',
            'mission_description_placeholder' => 'Describe the main responsibilities and expected deliverables…',
            'soft_skills' => 'Soft skills',
            'soft_skills_placeholder' => 'e.g. Leadership, Teamwork, Adaptability…',
        ],

        'scoring' => [
            'total' => 'Total',
            'experience' => 'Experience',
            'education' => 'Education',
            'sector' => 'Sector',
            'soft_skills' => 'Soft skills',
            'location' => 'Location',
        ],

        'actions' => [
            'save_draft' => 'Save as draft',
            'create' => 'Create brief',
            'creating' => 'Creating…',
            'back' => 'Back',
        ],
    ],

    'validation' => [
        'required' => 'This field is required.',
        'min_length' => 'This field must contain at least :min characters.',
        'max_length' => 'This field must not exceed :max characters.',
        'positive_number' => 'Please enter a valid positive number.',
        'max_value' => 'The value must not exceed :max.',
        'salary_format' => 'Invalid format. Example: 40000 - 55000 € or 40000.',
        'age_format' => 'Invalid format. Example: 25 - 35 or 30.',
        'weight_range' => 'Each weight must be between 0 and 100.',
        'weight_total' => 'The total of all weights must equal 100 (currently :total).',
    ],
    'show_brief' => [
        'breadcrumb' => 'Sourcing › Brief details',
        'subtitle' => 'Full details of the recruitment brief',

        'sections' => [
            'position' => 'Position information',
            'candidate' => 'Candidate criteria',
            'description' => 'Description',
            'scoring' => 'AI Scoring',
            'meta' => 'System information',
        ],

        'fields' => [
            'mission_code' => 'Mission Code',
            'product_reference' => 'Product Reference',
            'title' => 'Job title',
            'sector' => 'Sector',
            'contract_type' => 'Contract type',
            'location' => 'Location',
            'salary_range' => 'Salary range',
            'status' => 'Status',
            'min_experience_years' => 'Experience',
            'years' => 'years',
            'education_level' => 'Education level',
            'age_range' => 'Age range',
            'gender_pref' => 'Gender preference',
            'required_skills' => 'Required skills',
            'soft_skills' => 'Soft skills',
            'created_by' => 'Created by:',
            'created_at' => 'Date:',
            'languages' => 'Languages',
        ],

        'statuses' => [
            'active' => 'Active',
            'draft' => 'Draft',
        ],

        'scoring' => [
            'experience' => 'Experience',
            'education' => 'Education',
            'sector' => 'Sector',
            'soft_skills' => 'Soft skills',
            'location' => 'Location',
        ],

        'actions' => [
            'back' => 'Back to list',
            'edit' => 'Edit',
            'delete' => 'Delete',
            'delete_confirm' => 'Are you sure you want to delete this brief?',
            'delete_yes' => 'Yes, delete',
            'delete_no' => 'Cancel',
            'delete_confirming' => 'Are you sure?',
            'activate' => 'Activate & Start Sourcing',

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
    'edit_brief' => [
        'breadcrumb' => 'Sourcing › Edit brief',
        'title' => 'Edit recruitment brief',
        'subtitle' => 'Update the criteria · Changes will affect future candidate scoring',

        'sections' => [
            'position' => 'Position information',
            'candidate' => 'Candidate criteria',
            'description' => 'Description',
            'scoring' => 'AI scoring weights',
        ],

        'actions' => [
            'back' => 'Back to list',
            'show' => 'View brief',
            'save' => 'Save changes',
            'saving' => 'Saving…',
            'save_draft' => 'Save as draft',
            'cancel' => 'Cancel',
            'cancel_confirm' => 'Discard changes?',
            'cancel_yes' => 'Yes, discard',
            'cancel_no' => 'Keep editing',
        ],
    ],
    'classement' => [
        'filters' => [
            'score' => 'Score',
            'skills' => 'Skills',
            'brief' => 'Brief',
        ],
    ],

    'index' => [
        'breadcrumb' => 'Recruitment / Briefs',
        'title' => 'Brief Management',
        'subtitle' => 'Manage and track all your recruitment briefs efficiently.',

        'search_placeholder' => 'Search briefs by title…',

        'actions' => [
            'create' => 'Create Brief',
            'search' => 'Search',
            'filters' => 'Filters',
            'apply' => 'Apply',
            'reset' => 'Reset',
            'view' => 'View',
            'edit' => 'Edit',
            'delete' => 'Delete',
        ],

        'filters' => [
            'modal_title' => 'Advanced filters',
            'modal_subtitle' => 'Select the filters to display',
            'active_title' => 'Active filters',
            'active_subtitle' => 'Configure your search filters',
            'selected_count' => 'filter(s) selected',
            'select_placeholder' => 'Select...',
            'search_btn' => 'Search',
            'fields' => [
                'title' => 'Position',
                'sector' => 'Sector',
                'contract_type' => 'Contract',
                'location' => 'Location',
                'min_experience_years' => 'Experience',
                'education_level' => 'Education',
                'status' => 'Status',
            ],
            'sector_options' => [
                'commerce' => 'Sales & Commerce',
                'tech' => 'Tech & Digital',
                'finance' => 'Finance & Audit',
                'rh' => 'HR & Training',
                'marketing' => 'Marketing',
                'operations' => 'Operations & Logistics',
                'juridique' => 'Legal',
                'sante' => 'Healthcare',
            ],
            'contract_options' => [
                'CDI' => 'Permanent',
                'CDD' => 'Fixed-term',
                'freelance' => 'Freelance',
                'stage' => 'Internship',
            ],
            'education_options' => [
                'bac' => 'High School',
                'bac2' => 'Associate Degree',
                'bac3' => 'Bachelor\'s Degree',
                'bac5' => 'Master\'s Degree',
                'bac5_grande_ecole' => 'Grande École (Master)',
                'doctorat' => 'PhD',
            ],
            'status_options' => [
                'draft' => 'Draft',
                'active' => 'Active',
                'sourcing' => 'Sourcing',
                'interviews' => 'Interviews',
                'closed' => 'Closed',
            ],
        ],

        'columns' => [
            'title' => 'Title',
            'sector' => 'Sector',
            'contract' => 'Contract',
            'status' => 'Status',
            'gender_pref' => 'Gender Pref',
            'education' => 'Education Level',
            'created_at' => 'Created At',
            'actions' => 'Actions',
        ],

        'gender' => [
            'male' => 'Male',
            'female' => 'Female',
            'any' => 'Any',
        ],

        'empty' => [
            'title' => 'No briefs found',
            'description' => 'Get started by creating your first recruitment brief.',
        ],

        'modal' => [
            'title' => 'Delete brief',
            'description' => 'Are you sure you want to permanently delete this brief?',
            'cancel' => 'Cancel',
            'confirm' => 'Yes, delete',
        ],
        'modale' => [
            'status' => [
                'title' => 'Update brief status',
                'description' => 'Select the new status for this brief.',
                'updating' => 'Updating…',
                'confirm' => 'Update status',
                'cancel' => 'Cancel',
                'label' => 'New status',
            ],
        ],
        'flash' => [
            'status_error' => 'Error updating brief status',
            'index_error' => 'Error searching for briefs',
            'delete_error' => 'Error deleting brief',
        ],
    ],
    'import_modal' => [
        'title' => 'New mission brief',
        'subtitle' => 'Import a job description to pre-fill the form automatically, or fill it in manually.',
        'import_file' => 'Import a file',
        'import_file_sub' => 'PDF, Word',
        'manual' => 'Manual entry',
        'manual_sub' => 'Empty form',
        'drop_active' => 'Drop the file here…',
        'drop_idle' => 'Drag your file here or browse',
        'drop_formats' => 'PDF, DOC, DOCX — max 5 MB',
        'file_hint' => 'Click Analyse or drop another file',
        'extracting' => 'Extracting…',
        'extracting_sub' => 'Mistral AI is analysing your document',
        'extracting_slow' => 'Taking longer than expected, a few more seconds…',
        'error_retry' => 'Retry with another file',
        'back' => '← Back',
        'skip_manual' => 'Skip, fill in manually',
        'analyse' => 'Analyse →',
    ],

    'extraction_preview' => [
        'title' => 'Extraction result',
        'detected' => '{count} field detected — review before applying.',
        'detected_plural' => '{count} fields detected — review before applying.',
        'to_verify' => 'to verify',
        'not_detected' => 'Not detected — fill in manually',
        'discard' => 'Ignore, fill in manually',
        'confirm' => 'Apply to form →',
        'fields' => [
            'title' => 'Job Title',
            'sector' => 'Sector',
            'contract_type' => 'Contract Type',
            'location' => 'Location',
            'salary_range' => 'Salary',
            'min_experience_years' => 'Experience',
            'education_level' => 'Education Level',
            'seniority_level' => 'Seniority',
            'languages' => 'Languages',
            'gender_pref' => 'Gender',
            'age_range' => 'Age Range',
            'target_companies' => 'Target Companies',
            'mission_description' => 'Job Description',
            'required_skills' => 'Required Skills',
            'soft_skills' => 'Soft Skills',
        ],

    ],

];
