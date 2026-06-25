<?php

return [
    'index' => [
        'title' => 'Interview Management',
        'subtitle' => 'Upload your recordings · AI transcribes and analyses automatically',
        'breadcrumb' => 'Interviews',
        'form' => [
            'title' => 'Import an Interview',
            'candidate_label' => 'Associated Candidate',
            'candidate_placeholder' => 'Select a candidate…',
            'brief_label' => 'Job Brief',
            'brief_placeholder' => 'Select a brief…',
            'platform_label' => 'Interview Type',
            'recruiter_notes_label' => 'Recruiter Notes',
            'recruiter_notes_placeholder' => 'Separate the information with a comma. Example: HTML, Driving Licence B, Capable, Independent, ...',
        ],
        'actions' => [
            'upload' => 'Upload',
            'uploading' => 'Uploading…',
            'analyse' => 'Analyse with AI →',
            'processing' => 'Processing…',
            'reset' => 'Reset',
            'copy' => 'Copy',
            'copied' => 'Copied!',
            'download' => 'Download',
        ],
        'history_title' => 'Recently Analysed Interviews',
        'history_empty' => 'No interviews found',
        'history_description' => 'Your processed interviews will appear here.',

        'empty' => [
            'title' => 'No file selected',
            'description' => 'Drop an audio file here or click to browse your files.',
        ],

        'dropzone' => [
            'prompt' => 'Drop the recording here',
            'link' => 'browse',
            'formats' => 'MP4, M4A, WAV, MP3 · Max 500 MB',
        ],

        'stepper' => [
            'heading' => 'Processing',
            'upload' => 'Uploading audio file',
            'queue' => 'Queued for processing',
            'transcribe' => 'Transcribing audio',
            'analyse' => 'AI analysis running',
            'done' => 'Analysis complete',
        ],

        'done' => [
            'title' => 'Analysis completed successfully',
            'description' => 'You can submit a new interview.',
        ],

        'toast' => [
            'success' => 'Analysis completed successfully!',
            'failed' => 'Transcription failed.',
            'connection_lost' => 'Connection lost during polling.',
            'no_job_id' => 'Server did not return an interview ID.',
            'unsupported_format' => 'Unsupported format. Use MP3, WAV, M4A or MP4.',
            'file_too_large' => 'File exceeds 500 MB.',
            'upload_failed' => 'Upload failed.',
        ],

        'progress' => [
            'uploading' => 'Uploading file…',
            'pending' => 'Queued — waiting for a worker…',
            'processing' => 'Transcribing audio…',
            'done' => 'Done',
            'failed' => 'Transcription failed',
        ],

        'result' => [
            'label' => 'Transcript',
            'word_count' => ':count words',
        ],

        'status' => [
            'done' => 'Done',
            'processing' => 'Processing',
            'pending' => 'Pending',
            'failed' => 'Failed',
        ],

        'errors' => [
            'unsupported_format' => 'Unsupported format. Please use MP3, WAV or M4A.',
            'file_too_large' => 'File exceeds the 80 MB limit.',
            'no_job_id' => 'The server did not return a job ID.',
            'connection_lost' => 'Lost connection while polling.',
            'upload_failed' => 'Upload failed.',
        ],
    ],
    'show' => [
        'breadcrumb' => 'AI Report',
        'title' => 'Interview Report',
        'duration' => '{{count}} min',
        'interview_date' => 'Interview on {{date}}',
        'score_label' => 'Interview score',
        'criteria_title' => 'Criteria evaluation',
        'strengths_title' => 'Identified strengths',
        'red_flags_title' => 'Watch points',
        'excerpts_title' => 'Key interview excerpts',
        'export_pdf' => 'Export PDF',
        'make_offer' => 'Make an offer →',
        'back' => 'Back to interviews',
        'ranking_title' => 'COMPARATIVE RANKING OF {{count}} INTERVIEWS',
        'ranking_rank' => 'RANK',
        'ranking_candidate' => 'CANDIDATE',
        'ranking_score' => 'GLOBAL SCORE',
        'ranking_communication' => 'COMMUNICATION',
        'ranking_leadership' => 'LEADERSHIP',
        'ranking_adequation' => 'ADEQUACY',
        'ranking_verdict' => 'VERDICT',
        'ai_recommendation' => 'AI General Recommendation',
        'waiting_title' => 'Analysis in progress',
        'waiting_desc' => 'The AI report will be available in a few moments.',
    ],
    'list' => [
        'title' => 'All Interviews',
        'subtitle' => 'Get insights from your interviews and make informed hiring decisions.',
        'new' => '+ New Interview',

        'columns' => [
            'candidate' => 'Candidate',
            'brief' => 'Brief',
            'date' => 'Date',
            'platform' => 'Platform',
            'duration' => 'Duration',
            'status' => 'Status',
            'actions' => 'Actions',
        ],

        'filters' => [
            'search' => 'Search candidate or brief…',
            'status' => 'Status',
            'platform' => 'Platform',
            'all_statuses' => 'All statuses',
            'all_platforms' => 'All platforms',
            'clear' => 'Clear filters',
        ],

        'empty' => [
            'title' => 'No interviews found',
            'description' => 'Submit a recording to get started.',
            'no_results' => 'No interviews match your filters.',
        ],

        'pagination' => [
            'summary' => 'Page {{current}} of {{last}}',
            'previous' => 'Previous',
            'next' => 'Next',
        ],

        'row' => [
            'min' => '{{count}} min',
            'report' => 'Report →',
            'view' => 'View →',
        ],

        'status' => [
            'done' => '✓ Report ready',
            'done_short' => 'Done',
            'processing' => 'Processing',
            'pending' => 'Pending',
            'failed' => 'Failed',
            'none' => '—',
        ],

        'platforms' => [
            'zoom' => 'Zoom',
            'meet' => 'Meet',
            'teams' => 'Teams',
            'presentiel' => 'In-person',
        ],
    ],
];
