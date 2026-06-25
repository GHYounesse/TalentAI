<?php

return [
    'index' => [
        'title' => 'Gestion des entretiens',
        'subtitle' => 'Uploadez vos enregistrements · L\'IA transcrit et analyse automatiquement',
        'breadcrumb' => 'Entretiens',
        'form' => [
            'title' => 'Importer un entretien',
            'candidate_label' => 'Candidat associé',
            'candidate_placeholder' => 'Sélectionnez un candidat…',
            'brief_label' => 'Brief de poste',
            'brief_placeholder' => 'Sélectionnez un brief…',
            'platform_label' => 'Type d\'entretien',
            'recruiter_notes_label' => 'Notes de l\'recruteur',
            'recruiter_notes_placeholder' => 'Séparez les informations par une virgule. Exemple : HTML, Permis B, Capable, Autonome, ...',
        ],
        'actions' => [
            'upload' => 'Téléverser',
            'uploading' => 'Téléversement…',
            'analyse' => 'Analyser avec l\'IA →',
            'processing' => 'Traitement en cours…',
            'reset' => 'Réinitialiser',
            'copy' => 'Copier',
            'copied' => 'Copié !',
            'download' => 'Télécharger',
        ],

        'empty' => [
            'title' => 'Aucun fichier sélectionné',
            'description' => 'Déposez un fichier audio ou cliquez pour parcourir vos fichiers.',
        ],
        'history_title' => 'Entretiens analysés récemment',
        'history_empty' => 'Aucun entretien trouvé',
        'history_description' => 'Vos entretiens traités apparaîtront ici.',

        'dropzone' => [
            'prompt' => 'Déposez l\'enregistrement ici',
            'link' => 'parcourez',
            'formats' => 'MP4, M4A, WAV, MP3 · Max 500 MB',
        ],

        'stepper' => [
            'heading' => 'Traitement en cours',
            'upload' => 'Envoi du fichier audio',
            'queue' => 'En file d\'attente',
            'transcribe' => 'Transcription en cours',
            'analyse' => 'Analyse IA en cours',
            'done' => 'Analyse terminée',
        ],

        'done' => [
            'title' => 'Analyse terminée avec succès',
            'description' => 'Vous pouvez soumettre un nouvel entretien.',
        ],

        'toast' => [
            'success' => 'Analyse terminée avec succès !',
            'failed' => 'Échec de la transcription.',
            'connection_lost' => 'Connexion perdue lors du suivi.',
            'no_job_id' => 'Le serveur n\'a pas retourné d\'identifiant.',
            'unsupported_format' => 'Format non supporté. Utilisez MP3, WAV, M4A ou MP4.',
            'file_too_large' => 'Le fichier dépasse 500 Mo.',
            'upload_failed' => 'Échec de l\'envoi.',
        ],

        'progress' => [
            'uploading' => 'Envoi du fichier…',
            'pending' => 'En file d\'attente — en attente d\'un worker…',
            'processing' => 'Transcription en cours…',
            'done' => 'Terminé',
            'failed' => 'Échec de la transcription',
        ],

        'result' => [
            'label' => 'Transcription',
            'word_count' => ':count mots',
        ],

        'status' => [
            'done' => 'Terminé',
            'processing' => 'En cours',
            'pending' => 'En attente',
            'failed' => 'Échoué',
        ],

        'errors' => [
            'unsupported_format' => 'Format non supporté. Utilisez MP3, WAV ou M4A.',
            'file_too_large' => 'Le fichier dépasse la limite de 80 Mo.',
            'no_job_id' => 'Le serveur n\'a pas retourné d\'identifiant.',
            'connection_lost' => 'Connexion perdue lors du suivi.',
            'upload_failed' => 'Échec de l\'envoi.',
        ],
    ],
    'show' => [
        'breadcrumb' => 'Rapport IA',
        'title' => 'Rapport d\'entretien',
        'duration' => '{{count}} min',
        'interview_date' => 'Entretien du {{date}}',
        'score_label' => 'Score entretien',
        'criteria_title' => 'Évaluation par critère',
        'strengths_title' => 'Points forts identifiés',
        'red_flags_title' => 'Axes de vigilance',
        'excerpts_title' => 'Extraits clés de l\'entretien',
        'export_pdf' => 'Exporter PDF',
        'make_offer' => 'Faire une offre →',
        'back' => 'Retour aux entretiens',
        'ranking_title' => 'CLASSEMENT COMPARATIF DES {{count}} ENTRETIENS',
        'ranking_rank' => 'RANG',
        'ranking_candidate' => 'CANDIDAT',
        'ranking_score' => 'SCORE GLOBAL',
        'ranking_communication' => 'COMMUNICATION',
        'ranking_leadership' => 'LEADERSHIP',
        'ranking_adequation' => 'ADÉQUATION',
        'ranking_verdict' => 'VERDICT',
        'ai_recommendation' => 'Recommandation générale IA',
        'waiting_title' => 'Analyse en cours',
        'waiting_desc' => 'Le rapport IA sera disponible dans quelques instants.',
    ],
    'list' => [
        'title' => 'Tous les entretiens',
        'subtitle' => 'Obtenez des insights de vos entretiens et prenez des décisions de recrutement éclairées.',
        'new' => '+ Nouvel entretien',

        'columns' => [
            'candidate' => 'Candidat',
            'brief' => 'Brief',
            'date' => 'Date',
            'platform' => 'Plateforme',
            'duration' => 'Durée',
            'status' => 'Statut',
            'actions' => 'Actions',
        ],

        'filters' => [
            'search' => 'Rechercher un candidat ou un brief…',
            'status' => 'Statut',
            'platform' => 'Plateforme',
            'all_statuses' => 'Tous les statuts',
            'all_platforms' => 'Toutes les plateformes',
            'clear' => 'Effacer les filtres',
        ],

        'empty' => [
            'title' => 'Aucun entretien trouvé',
            'description' => 'Soumettez un enregistrement pour commencer.',
            'no_results' => 'Aucun entretien ne correspond à vos filtres.',
        ],

        'pagination' => [
            'summary' => 'Page {{current}} sur {{last}}',
            'previous' => 'Précédent',
            'next' => 'Suivant',
        ],

        'row' => [
            'min' => '{{count}} min',
            'report' => 'Rapport →',
            'view' => 'Voir →',
        ],

        'status' => [
            'done' => '✓ Rapport prêt',
            'done_short' => 'Rapport prêt',
            'processing' => 'En cours',
            'pending' => 'En attente',
            'failed' => 'Échoué',
            'none' => '—',
        ],

        'platforms' => [
            'zoom' => 'Zoom',
            'meet' => 'Meet',
            'teams' => 'Teams',
            'presentiel' => 'Presentiel',
        ],
    ],
];
