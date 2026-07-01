<?php

return [

    /*
    |--------------------------------------------------------------------------
    | User Integrations
    |--------------------------------------------------------------------------
    */

    'page' => [
        'title' => 'Intégrations & API',
        'subtitle' => 'Connectez vos services externes. Les identifiants sont chiffrés et propres à chaque utilisateur.',
    ],

    'counter' => [
        'connected' => 'connectés',
    ],

    'status' => [
        'connected' => 'Connecté',
        'env_fallback' => 'Configuration globale',
        'not_configured' => 'Non configuré',
        'expired' => 'Expiré',
    ],

    'token' => [
        'current' => 'Token actuel',
        'replace' => 'Remplacer le token',
        'copy' => 'Copier',
        'client_secret' => 'Client Secret',
        'expiry_date' => 'Date d’expiration',
        'expiry_optional' => '(optionnel)',
        'expires' => 'Expire le :date',
        'last_used' => 'Dernière utilisation : :date',
    ],

    'token_invalid' => 'Token invalide ou connexion échouée. Veuillez vérifier et réessayer.',

    'expiry_warning' => 'Ce token a expiré le :date. Veuillez le renouveler.',

    'test_result' => [
        'ok' => 'Connexion validée',
        'fail' => 'Token invalide ou service inaccessible',
    ],

    'actions' => [
        'connect' => 'Connecter',
        'replace' => 'Remplacer',
        'test' => 'Tester',
        'docs' => 'Documentation',
        'revoke' => 'Révoquer',
    ],

    'fallback_note' => [
        'label' => 'Configuration globale',
        'message' => 'Si aucun token personnel n’est défini, la configuration globale de l’application sera utilisée.',
    ],
    'category_count' => '{{count}} intégrations',

    'empty' => [
        'title' => 'Aucune intégration trouvée',
        'description' => 'Essayez de modifier le filtre sélectionné.',
    ],
    'all' => 'Toutes',

    /*
    |--------------------------------------------------------------------------
    | Categories
    |--------------------------------------------------------------------------
    */

    'categories' => [
        'sourcing' => 'Sourcing',
        'ai' => 'Intelligence artificielle',
        'scheduling' => 'Planification',
        'communication' => 'Communication',
        'storage' => 'Stockage',
        'analytics' => 'Analytique',
        'other' => 'Autres',
    ],

    /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    */

    'admin' => [

        'page' => [
            'title' => 'Gestion des intégrations',
            'subtitle' => 'Gérez les fournisseurs disponibles pour les utilisateurs.',
        ],

        'counter' => [
            'active' => 'actives',
        ],

        'empty' => [
            'title' => 'Aucune intégration configurée',
            'description' => 'Ajoutez votre première intégration pour commencer.',
        ],

        'table' => [
            'integration' => 'Intégration',
            'provider' => 'Provider',
            'env_key' => 'Clé ENV',
            'oauth' => 'Authentification',
            'status' => 'Statut',
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
            'system' => 'Système',
        ],

        'actions' => [
            'create' => 'Nouvelle intégration',
            'edit' => 'Modifier',
            'delete' => 'Supprimer',
            'activate' => 'Activer',
            'deactivate' => 'Désactiver',
            'close' => 'Fermer',
            'save' => 'Enregistrer',
            'create_submit' => 'Créer',
        ],

        'modal' => [
            'create_title' => 'Créer une intégration',
            'edit_title' => 'Modifier une intégration',
            'create_subtitle' => 'Ajouter un nouveau fournisseur',
            'edit_subtitle' => 'Mise à jour de "{{label}}"',
            'delete' => [
                'title' => 'Supprimer une intégration',
                'description' => 'Êtes-vous sûr de vouloir supprimer cette intégration ?',
                'confirm' => 'Supprimer',
                'cancel' => 'Annuler',
            ],
        ],
        'form' => [
            'icon' => 'Icône',
            'provider_key' => 'Clé provider',
            'display_name' => 'Nom affiché',
            'category' => 'Catégorie',
            'choose' => 'Choisir...',
            'description' => 'Description',
            'token_label' => 'Label du champ token',
            'placeholder' => 'Placeholder',
            'env_key' => "Variable d'env (fallback)",
            'test_url' => 'URL de test',
            'docs_url' => 'URL de documentation',
            'active' => 'Active',
            'active_help' => 'Visible et utilisable par les utilisateurs',

            'sections' => [
                'user_fields' => 'Champs du formulaire utilisateur',
                'technical_config' => 'Configuration technique',
            ],

            'placeholders' => [
                'label' => 'Mon Intégration',
                'description' => "Courte description de l'intégration",
                'token_label' => 'Clé API',
            ],
        ],

    ],
];
