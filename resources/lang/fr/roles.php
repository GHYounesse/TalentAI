<?php

return [

    'index' => [
        'title' => 'Rôles',
        'subtitle' => 'Gérez les permissions de chaque rôle au sein de votre organisation.',
        'nav' => [
            'users' => 'Utilisateurs',
        ],
        'table' => [
            'role' => 'Rôle',
            'users' => 'Utilisateurs',
            'permissions' => 'Permissions',
            'user_count' => [
                'one' => '1 utilisateur',
                'other' => '{{count}} utilisateurs',
            ],
            'more' => '+{{count}} autres',
            'all_permissions' => 'Toutes les permissions',
            'no_permissions' => 'Aucune permission',

            'super_admin_note' => 'Accès total — toutes les permissions',
            'actions' => [
                'edit' => 'Modifier les permissions',
            ],
        ],
        'flash' => [
            // Succès
            'updated' => 'Permissions du rôle ":role" mises à jour.',

            // Erreurs
            'index_error' => 'Impossible de charger la liste des rôles.',
            'update_error' => 'Impossible de mettre à jour les permissions.',
        ],
    ],

    'edit_modal' => [
        'title' => 'Modifier les permissions',
        'actions' => [
            'cancel' => 'Annuler',
            'submit' => 'Enregistrer',
            'submitting' => 'Enregistrement…',
        ],
    ],

    'roles' => [
        'super_admin' => 'Super Admin',
        'admin' => 'Admin',
        'recruiter' => 'Recruteur',
        'hiring_manager' => 'Responsable RH',
        'viewer' => 'Lecteur',
    ],

    'modules' => [
        'briefs' => 'Briefs',
        'candidates' => 'Candidats',
        'users' => 'Utilisateurs',
        'roles' => 'Rôles',
        'sourcing' => 'Sourcing',
        'interviews' => 'Entretiens',
        'reports' => 'Rapports',
        'cv-analysis' => 'Analyse des CV',
        'integrations' => 'Intégrations',
        'settings' => 'Paramètres',
        'classement' => 'Classement',
        'activity_logs' => 'Journal des activités',
        'parameters' => 'Paramètres',
    ],

    'actions' => [
        'view' => 'Voir',
        'create' => 'Créer',
        'edit' => 'Modifier',
        'upload' => 'Téléverser',
        'delete' => 'Supprimer',
        'approve' => 'Approuver',
        'export' => 'Exporter',
        'manage' => 'Gérer',
        'connect' => 'Connecter',
        'decide' => 'Décider',
    ],

    'create_modal' => [
        'title' => 'Nouveau rôle',
        'fields' => [
            'name' => 'Nom du rôle',
            'name_placeholder' => 'ex. responsable_rh',
        ],
        'actions' => [
            'cancel' => 'Annuler',
            'submit' => 'Créer un rôle',
            'submitting' => 'Création…',
        ],
        'flash' => [
            'created' => 'Rôle « :name » créé.',
            'create_error' => 'Impossible de créer le rôle.',
        ],
    ],

    'role_users_modal' => [
        'title' => 'Utilisateurs avec ce rôle',
        'empty' => 'Aucun utilisateur assigné à ce rôle.',
        'actions' => [
            'remove' => 'Retirer le rôle',
            'removing' => 'Retrait…',
        ],
    ],

];
