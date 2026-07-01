<?php

return [

    'create' => [
        'breadcrumb' => 'Sourcing › Nouveau candidat',

        'form' => [
            'title' => 'Ajouter un candidat',
            'subtitle' => 'Renseignez les informations du candidat · Il sera mis en regard des briefs actifs',

            'sections' => [
                'identity' => 'Identité',
                'professional' => 'Parcours professionnel',
                'profile' => 'Détails du profil',
            ],
        ],

        'fields' => [
            'full_name' => 'Nom complet',
            'full_name_placeholder' => 'ex. Jane Dupont',
            'email' => 'Adresse e-mail',
            'email_placeholder' => 'ex. jane.dupont@email.com',
            'phone' => 'Numéro de téléphone',
            'phone_placeholder' => 'ex. +33 6 12 34 56 78',
            'current_title' => 'Poste actuel',
            'current_title_placeholder' => 'ex. Développeur Backend Senior',
            'current_company' => 'Entreprise actuelle',
            'current_company_placeholder' => 'ex. Acme Corp',
            'location' => 'Localisation',
            'location_placeholder' => 'ex. Paris, Télétravail…',
            'experience_years' => 'Années d\'expérience',
            'experience_years_placeholder' => 'ex. 5',
            'education_level' => 'Niveau d\'études',
            'education_level_placeholder' => 'ex. Licence, Master…',
            'source' => 'Source',
            'source_placeholder' => 'ex. LinkedIn, Recommandation…',
            'source_url' => 'URL source',
            'source_url_placeholder' => 'https://linkedin.com/in/…',
            'linkedin_url' => 'Profil LinkedIn',
            'linkedin_url_placeholder' => 'https://linkedin.com/in/…',
            'headline' => 'Accroche',
            'headline_placeholder' => 'ex. Développeur Full-Stack · 7 ans d\'exp.',
            'summary' => 'Résumé',
            'summary_placeholder' => 'Aperçu du parcours et des ambitions du candidat…',
            'skills' => 'Compétences',
            'skills_placeholder' => 'ex. Python, React, SQL…',
            'open_to_work' => 'Ouvert aux opportunités',
            'status' => 'Statut',
            'status_placeholder' => 'Sélectionner un statut',
        ],

        'actions' => [
            'back' => 'Retour',
            'create' => 'Ajouter le candidat',
            'creating' => 'Ajout en cours…',
        ],
    ],

    'validation' => [
        'required' => 'Ce champ est obligatoire.',
        'email_invalid' => 'Veuillez saisir une adresse e-mail valide.',
        'url_invalid' => 'Veuillez saisir une URL valide.',
        'min_length' => 'Ce champ doit contenir au moins :min caractères.',
        'max_length' => 'Ce champ ne doit pas dépasser :max caractères.',
        'positive_number' => 'Veuillez saisir un nombre positif valide.',
    ],

    'show' => [
        'breadcrumb' => 'Sourcing › Détails du candidat',
        'subtitle' => 'Profil complet du candidat',

        'sections' => [
            'identity' => 'Identité',
            'professional' => 'Parcours professionnel',
            'profile' => 'Détails du profil',
            'meta' => 'Informations système',
        ],

        'fields' => [
            'full_name' => 'Nom complet',
            'email' => 'Adresse e-mail',
            'phone' => 'Téléphone',
            'current_title' => 'Poste actuel',
            'current_company' => 'Entreprise actuelle',
            'location' => 'Localisation',
            'experience_years' => 'Expérience',
            'years' => 'ans',
            'education_level' => 'Niveau d\'études',
            'source' => 'Source',
            'source_url' => 'URL source',
            'linkedin_url' => 'Profil LinkedIn',
            'headline' => 'Accroche',
            'summary' => 'Résumé',
            'skills' => 'Compétences',
            'open_to_work' => 'Ouvert aux opportunités',
            'status' => 'Statut',
            'created_at' => 'Date d\'ajout',
        ],

        'statuses' => [
            'sourced' => 'Sourcé',
            'contacted' => 'Contacté',
            'interview' => 'Entretien',
            'recommended' => 'Recommandé',
            'offer' => 'Offre',
            'rejected' => 'Rejeté',
        ],

        'actions' => [
            'back' => 'Retour à la liste',
            'edit' => 'Modifier',
            'delete' => 'Supprimer',
        ],
    ],

    'fallback' => [
        'breadcrumb' => 'Sourcing › Erreur',
        'title' => 'Une erreur est survenue',
        'subtitle' => 'Une erreur inattendue s\'est produite',
        'heading' => 'Impossible de charger cette page',
        'description' => 'Une erreur s\'est produite de notre côté. Vous pouvez réessayer ou revenir à la liste.',

        'actions' => [
            'back' => 'Retour à la liste',
            'retry' => 'Réessayer',
        ],
    ],

    'edit' => [
        'breadcrumb' => 'Sourcing › Modifier le candidat',
        'title' => 'Modifier le candidat',
        'subtitle' => 'Mettez à jour les informations du candidat',

        'actions' => [
            'back' => 'Retour à la liste',
            'show' => 'Voir le profil',
            'save' => 'Enregistrer les modifications',
            'saving' => 'Enregistrement…',
            'cancel' => 'Annuler',
            'cancel_confirm' => 'Abandonner les modifications ?',
            'cancel_yes' => 'Oui, abandonner',
            'cancel_no' => 'Continuer l\'édition',
        ],
    ],

    'index' => [
        'breadcrumb' => 'Sourcing / Candidats',
        'title' => 'Gestion des candidats',
        'subtitle' => 'Gérez et suivez l\'ensemble de vos candidats efficacement.',

        'search_placeholder' => 'Rechercher par nom, e-mail ou poste…',

        'actions' => [
            'create' => 'Ajouter un candidat',
            'search' => 'Rechercher',
            'reset' => 'Réinitialiser',
            'view' => 'Voir',
            'edit' => 'Modifier',
            'delete' => 'Supprimer',
        ],

        'columns' => [
            'candidat' => 'Candidat',
            'current_position' => 'Poste actuel',
            'experience' => 'Expérience',
            'location' => 'Localisation',
            'source' => 'Source',
            'source_social_media' => 'Réseaux sociaux',
            'status' => 'Statut',
            'created_at' => 'Ajouté',
            'actions' => 'Actions',
        ],

        'empty' => [
            'title' => 'Aucun candidat trouvé',
            'description' => 'Commencez par ajouter votre premier candidat.',
        ],

        'modal' => [
            'title' => 'Supprimer le candidat',
            'description' => 'Êtes-vous sûr de vouloir supprimer définitivement ce candidat ?',
            'cancel' => 'Annuler',
            'confirm' => 'Oui, supprimer',
            'recruiter_notes' => 'Notes du recruteur',
            'close' => 'Fermer',
        ],

        'filters' => [
            'full_name' => 'Nom complet',
            'headline' => 'Titre professionnel',
            'location' => 'Localisation',
            'recruiter_notes' => 'Notes du recruteur',
            'current_company' => 'Entreprise',
            'current_title' => 'Poste actuel',
            'experience_years' => 'Expérience',
            'education_level' => 'Éducation',
            'sector' => 'Secteur',
            'source' => 'Source',
            'status' => 'Statut',
            'open_to_work' => 'Open to Work',
            'yes' => 'Oui',
            'no' => 'Non',
            'status_options' => [
                'sourced' => 'Sourcé',
                'contacted' => 'Contacté',
                'interview' => 'Entretien',
                'recommended' => 'Recommandé',
                'offer' => 'Offre',
                'rejected' => 'Rejeté',
            ],
        ],

        'flash' => [
            'index_error' => 'Impossible de charger les candidats.',
            'enrich_success' => 'Informations de contact enrichies.',
            'enrich_error' => 'Impossible d\'enrichir ce contact.',
        ],
    ],

];
