<?php

return [
    'index' => [
        'title' => 'Historique des candidatures',

        'total' => '{count} entretien au total',
        'total_plural' => '{count} entretiens au total',
        'active_filters' => '{count} filtre actif',
        'active_filters_plural' => '{count} filtres actifs',

        'filters' => [
            'fields' => [
                'candidat' => 'Candidat',
                'brief' => 'Brief',
                'decision' => 'Décision',
                'date_from' => 'Date début',
                'date_to' => 'Date fin',
            ],
        ],

        'decision' => [
            'accepted' => 'Accepté',
            'rejected' => 'Refusé',
            'pending' => 'En attente',
        ],

        'columns' => [
            'candidat' => 'CANDIDAT',
            'brief' => 'BRIEF',
            'date' => 'DATE',
            'platform' => 'PLATEFORME',
            'ai_score' => 'SCORE IA',
            'decision' => 'DÉCISION',
            'decided_by' => 'DÉCIDÉ PAR',
        ],

        'empty' => [
            'title' => 'Aucun entretien trouvé',
            'no_results' => 'Aucun résultat pour ces filtres. Essayez de les réinitialiser.',
            'no_data' => "Aucun entretien n'a encore été enregistré.",
        ],

        'actions' => [
            'view_candidat_history' => "Voir l'historique du candidat",
        ],

        'pagination' => [
            'range' => '{from}–{to} sur {total} entretiens',
            'count' => '{total} entretiens',
        ],
    ],
    'candidat' => [
        'title' => 'Historique — {name}',
        'breadcrumb' => [
            'candidats' => 'Candidats',
            'historique' => 'Historique',
        ],
        'heading' => 'Historique des candidatures',
        'subtitle' => 'Tous les entretiens et décisions associés à ce candidat.',
        'linkedin_link' => 'Voir le profil LinkedIn',
        'open_to_work' => '✓ Open to work',
        'summary' => [
            'title' => 'Résumé',
            'total' => 'Total entretiens',
            'accepted' => 'Acceptés',
            'rejected' => 'Refusés',
        ],
        'empty' => [
            'title' => 'Aucun entretien',
            'description' => "Ce candidat n'a pas encore passé d'entretien.",
        ],
    ],

    'interview_card' => [
        'ai_label' => 'IA',
        'ai_recommendation' => 'Recommandation IA',
        'recruiter_decision' => 'Décision du recruteur',
        'decided_by' => 'par {name}',
        'actions' => [
            'add' => '+ Saisir une décision',
            'edit' => '✎ Modifier la décision',
        ],
    ],

    'decision_form' => [
        'title' => 'Enregistrer une décision',
        'comment_placeholder' => 'Commentaire (optionnel)…',
        'cancel' => 'Annuler',
        'submitting' => 'Enregistrement…',
        'confirm' => 'Confirmer →',
    ],
];
