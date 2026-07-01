<?php

return [

    'index' => [
        'title' => 'Sourcing campaigns',
        'subtitle' => 'Historique des collectes de posts et commentaires LinkedIn.',

        'toolbar' => [
            'new' => 'Nouveau sourcing campaign',
        ],

        'empty' => [
            'title' => "Aucun sourcing campaign pour l'instant",
            'description' => 'Lancez votre première collecte de posts LinkedIn.',
            'cta' => 'Nouveau sourcing campaign',
        ],

        'columns' => [
            'brief' => 'BRIEF',
            'targets' => 'CIBLES',
            'posts' => 'POSTS',
            'candidates' => 'COMMENTATEURS',
            'status' => 'STATUT',
            'started' => 'DÉMARRÉ',
            'campaigns' => 'CAMPAGNES',
        ],

        'table' => [
            'no_brief' => '—',
            'url_single' => 'URL',
            'url_plural' => 'URLs',
            'keyword_single' => 'mot-clé',
            'keyword_plural' => 'mots-clés',
            'no_candidates' => '—',
            'view' => 'Voir le détail',
        ],

        'pagination' => [
            'summary_range' => ':from–:to sur :total runs',
            'summary_total' => ':total runs',
            'previous' => 'Page précédente',
            'next' => 'Page suivante',
        ],

        'status' => [
            'pending' => 'En attente',
            'running' => 'En cours',
            'completed' => 'Terminé',
            'failed' => 'Échoué',
            'stalled' => 'Bloqué',
        ],
    ],

    'create' => [
        'breadcrumb' => 'Sourcing Campaigns › Nouveau sourcing campaign',

        'header' => [
            'back' => 'Retour',
            'parent' => 'Sourcing Campaigns',
            'title' => 'Démarrer un nouveau sourcing campaign',
            'subtitle' => 'Saisissez vos mots-clés de recherche, filtrez optionnellement par auteur, et configurez les paramètres de collecte.',
        ],

        'sections' => [
            'search' => 'Recherche',
            'search_desc' => 'Entrez les mots-clés à rechercher dans les posts LinkedIn.',
            'parameters' => 'Paramètres de collecte',
            'parameters_desc' => 'Affinez les limites et les filtres de date pour cette collecte.',
            'brief' => 'Brief associé',
            'brief_desc' => 'Associez optionnellement cette campagne à un brief.',
        ],

        'fields' => [
            'brief' => [
                'label' => 'Brief associé',
                'placeholder' => 'Sélectionner un brief… (optionnel)',
            ],
            'search_queries' => [
                'label' => 'Mots-clés de recherche',
                'placeholder' => 'Tapez un mot-clé et appuyez sur Entrée…',
                'hint' => 'Appuyez sur Entrée ou virgule pour ajouter chaque mot-clé',
            ],
            'author_urls' => [
                'label' => 'Profils / entreprises auteurs',
                'placeholder' => 'Sélectionner des profils ou entreprises… (optionnel)',
                'hint' => 'Restreint les résultats aux posts de ces auteurs',
                'no_options' => 'Aucun résultat',
            ],
            'max_posts' => [
                'label' => 'Posts maximum',
                'hint' => '0 = tous les posts disponibles',
            ],
            'posted_limit_date' => [
                'label' => 'Collecter les posts après',
                'hint' => 'Laisser vide pour tout collecter',
            ],
        ],

        'actions' => [
            'cancel' => 'Annuler',
            'submit' => 'Démarrer le campaign →',
            'submitting' => 'Démarrage…',
        ],

        'summary' => [
            'title' => 'Résumé de la campagne',
            'ready' => 'Prêt à lancer',
            'incomplete' => 'Remplissez les champs requis',
            'tip' => 'La campagne démarrera immédiatement après soumission.',
        ],
    ],

    'show' => [
        'title' => 'Sourcing Campaign #:id',
        'subtitle' => 'Collecteur de posts & commentaires',

        'breadcrumb' => [
            'all' => 'Tous les runs',
            'back' => 'Retour aux sourcing campaigns',
        ],

        'status' => [
            'pending' => 'En attente',
            'running' => 'En cours',
            'completed' => 'Terminé',
            'failed' => 'Échoué',
        ],

        'cards' => [
            'search_queries' => [
                'title' => 'Mots-clés de recherche',
            ],
            'author_urls' => [
                'title' => 'Filtres auteurs',
            ],
            'status' => [
                'title' => 'Statut',
                'label' => 'Statut actuel',
                'scrape_in_progress' => 'Collecte des posts en cours — la page se met à jour automatiquement.',
                'enrich_in_progress' => 'Enrichissement des profils candidats — la page se met à jour automatiquement.',
            ],
            'posts' => [
                'title' => 'Posts collectés',
                'unit_single' => 'post collecté',
                'unit_plural' => 'posts collectés',
            ],
            'enrichment' => [
                'label' => 'Enrichissement candidats',
                'complete' => '✓ Terminé',
                'running' => 'Enrichissement…',
            ],
        ],

        'posts_section' => [
            'title' => 'Posts',
            'empty_pending' => 'Les posts apparaîtront ici dès la fin du run.',
            'empty_done' => 'Aucun post trouvé.',
            'no_comments' => 'Aucun commentaire collecté.',
            'view_post' => 'Voir le post original ↗',
        ],

        'comments_table' => [
            'commenter' => 'Commentateur',
            'comment' => 'Commentaire',
            'candidate' => 'Candidat',
        ],

        'candidat_badge' => [
            'view' => 'Voir',
        ],

        'post_card' => [
            'unknown_author' => 'Auteur inconnu',
        ],
    ],

];
