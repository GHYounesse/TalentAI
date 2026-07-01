<?php

return [

    'create_briefs' => [
        'breadcrumb' => 'Sourcing › Nouveau brief',

        'create' => [
            'title' => 'Créer un brief de recrutement',
            'subtitle' => 'Renseignez les critères · L\'IA les utilisera pour analyser les candidats',

            'sections' => [
                'position' => 'Informations du poste',
                'candidate' => 'Critères candidat',
                'description' => 'Description',
                'scoring' => 'Poids scoring IA',
            ],
        ],

        'fields' => [
            'mission_code' => 'Code de mission',
            'mission_code_placeholder' => 'ex. DEV-001',
            'product_reference' => 'Référence du produit',
            'product_reference_placeholder' => 'ex. PROD-001',
            'title' => 'Intitulé du poste',
            'title_placeholder' => 'ex. Développeur Full-Stack Senior',
            'sector' => 'Secteur',
            'sector_placeholder' => 'ex. Technologie, Finance…',
            'contract_type' => 'Type de contrat',
            'contract_type_placeholder' => 'Sélectionner un type de contrat',
            'location' => 'Localisation',
            'location_placeholder' => 'ex. Paris, Télétravail…',
            'salary_range' => 'Fourchette salariale',
            'salary_range_placeholder' => 'ex. 40 000 - 55 000 €',
            'min_experience_years' => 'Expérience minimale (années)',
            'min_experience_years_placeholder' => 'ex. 3',
            'education_level' => 'Niveau d\'études',
            'education_level_placeholder' => 'ex. Licence, Master…',
            'required_skills' => 'Compétences requises',
            'required_skills_placeholder' => 'ex. Python, SQL…',
            'languages' => 'Langues requises',
            'languages_placeholder' => 'e.g. Anglais, Arabe…',
            'age_range' => 'Tranche d\'âge souhaitée',
            'age_range_placeholder' => 'ex. 25 - 35',
            'gender_pref' => 'Préférence de genre',
            'gender_pref_placeholder' => 'Sans préférence',
            'mission_description' => 'Mission principale',
            'mission_description_placeholder' => 'Décrivez les responsabilités principales et les livrables attendus…',
            'soft_skills' => 'Soft skills',
            'soft_skills_placeholder' => 'ex. Leadership, Travail d\'équipe, Adaptabilité…',
        ],

        'scoring' => [
            'total' => 'Total',
            'experience' => 'Expérience',
            'education' => 'Formation',
            'sector' => 'Secteur',
            'soft_skills' => 'Soft skills',
            'location' => 'Localisation',
        ],

        'actions' => [
            'save_draft' => 'Brouillon',
            'create' => 'Créer brief',
            'creating' => 'Création…',
            'back' => 'Retour',
        ],
    ],

    'validation' => [
        'required' => 'Ce champ est obligatoire.',
        'min_length' => 'Ce champ doit contenir au moins :min caractères.',
        'max_length' => 'Ce champ ne doit pas dépasser :max caractères.',
        'positive_number' => 'Veuillez saisir un nombre positif valide.',
        'max_value' => 'La valeur ne doit pas dépasser :max.',
        'salary_format' => 'Format invalide. Exemple : 40 000 - 55 000 € ou 40 000.',
        'age_format' => 'Format invalide. Exemple : 25 - 35 ou 30.',
        'weight_range' => 'Chaque poids doit être compris entre 0 et 100.',
        'weight_total' => 'La somme des poids doit être égale à 100 (actuellement :total).',
    ],
    'show_brief' => [
        'breadcrumb' => 'Sourcing › Détails brief',
        'subtitle' => 'Détails complets du brief de recrutement',

        'sections' => [
            'position' => 'Informations du poste',
            'candidate' => 'Critères candidat',
            'description' => 'Description',
            'scoring' => 'Scoring IA',
            'meta' => 'Informations système',
        ],

        'fields' => [
            'mission_code' => 'Code de mission',
            'product_reference' => 'Référence du produit',
            'title' => 'Intitulé du poste',
            'sector' => 'Secteur',
            'contract_type' => 'Type de contrat',
            'location' => 'Localisation',
            'salary_range' => 'Salaire',
            'status' => 'Statut',
            'min_experience_years' => 'Expérience',
            'years' => 'ans',
            'education_level' => 'Niveau d\'études',
            'age_range' => 'Âge',
            'gender_pref' => 'Genre',
            'required_skills' => 'Compétences requises',
            'soft_skills' => 'Soft skills',
            'created_by' => 'Créé par :',
            'created_at' => 'Date :',
            'languages' => 'Langues',
        ],

        'statuses' => [
            'active' => 'Actif',
            'draft' => 'Brouillon',
        ],

        'scoring' => [
            'experience' => 'Expérience',
            'education' => 'Formation',
            'sector' => 'Secteur',
            'soft_skills' => 'Soft skills',
            'location' => 'Localisation',
        ],

        'actions' => [
            'back' => 'Retour à la liste',

            'edit' => 'Modifier',
            'delete' => 'Supprimer',
            'delete_confirm' => 'Êtes-vous sûr de vouloir supprimer ce brief ?',
            'delete_yes' => 'Oui, supprimer',
            'delete_no' => 'Annuler',
            'delete_confirming' => 'Êtes-vous sûr ?',
            'activate' => 'Activer & Lancer le sourcing',
        ],
    ],
    'fallback' => [
        'breadcrumb' => 'Sourcing › Erreur',
        'title' => 'Une erreur est survenue',
        'subtitle' => 'Une erreur inattendue s\'est produite',
        'heading' => 'Impossible de charger cette page',
        'description' => 'Une erreur s\'est produite de notre côté. Vous pouvez réessayer ou retourner à la liste.',

        'actions' => [
            'back' => 'Retour à la liste',
            'retry' => 'Réessayer',
        ],
    ],
    'edit_brief' => [
        'breadcrumb' => 'Sourcing › Modifier brief',
        'title' => 'Modifier le brief de recrutement',
        'subtitle' => 'Mettez à jour les critères · Les modifications affecteront le scoring futur',

        'sections' => [
            'position' => 'Informations du poste',
            'candidate' => 'Critères candidat',
            'description' => 'Description',
            'scoring' => 'Poids scoring IA',
        ],

        'actions' => [
            'back' => 'Retour à la liste',
            'show' => 'Voir le brief',
            'save' => 'Enregistrer les modifications',
            'saving' => 'Enregistrement…',
            'save_draft' => 'Enregistrer en brouillon',
            'cancel' => 'Annuler',
            'cancel_confirm' => 'Abandonner les modifications ?',
            'cancel_yes' => 'Oui, abandonner',
            'cancel_no' => 'Continuer l\'édition',
        ],
    ],

    'classement' => [
        'filters' => [
            'score' => 'Score',
            'skills' => 'Compétences',
            'brief' => 'Brief',
        ],
    ],

    'index' => [
        'breadcrumb' => 'Recrutement / Briefs',
        'title' => 'Gestion des briefs',
        'subtitle' => 'Gérez et suivez efficacement tous vos briefs de recrutement.',

        'search_placeholder' => 'Rechercher un brief par titre…',

        'actions' => [
            'create' => 'Créer un brief',
            'search' => 'Rechercher',
            'filters' => 'Filtres',
            'apply' => 'Appliquer',
            'reset' => 'Réinitialiser',
            'view' => 'Voir',
            'edit' => 'Modifier',
            'delete' => 'Supprimer',
            'update_status' => 'Modifier statut',
        ],

        'filters' => [
            'modal_title' => 'Filtres avancés',
            'modal_subtitle' => 'Sélectionnez les filtres à afficher',
            'active_title' => 'Filtres actifs',
            'active_subtitle' => 'Configurez vos filtres de recherche',
            'selected_count' => 'filtre(s) sélectionné(s)',
            'select_placeholder' => 'Sélectionner...',
            'search_btn' => 'Rechercher',
            'fields' => [
                'title' => 'Poste',
                'sector' => 'Secteur',
                'contract_type' => 'Contrat',
                'location' => 'Localisation',
                'min_experience_years' => 'Expérience',
                'education_level' => 'Éducation',
                'status' => 'Statut',
            ],
            'sector_options' => [
                'commerce' => 'Commerce & Vente',
                'tech' => 'Tech & Digital',
                'finance' => 'Finance & Audit',
                'rh' => 'RH & Formation',
                'marketing' => 'Marketing',
                'operations' => 'Opérations & Logistique',
                'juridique' => 'Juridique',
                'sante' => 'Santé',
            ],
            'contract_options' => [
                'CDI' => 'CDI',
                'CDD' => 'CDD',
                'freelance' => 'Freelance',
                'stage' => 'Stage',
            ],
            'education_options' => [
                'bac' => 'Bac',
                'bac2' => 'Bac+2',
                'bac3' => 'Bac+3 (Licence)',
                'bac5' => 'Bac+5 (Master)',
                'bac5_grande_ecole' => 'Bac+5 Grande École',
                'doctorat' => 'Doctorat',
            ],
            'status_options' => [
                'draft' => 'Brouillon',
                'active' => 'Actif',
                'sourcing' => 'En sourcing',
                'interviews' => 'Entretiens',
                'closed' => 'Clôturé',
            ],
        ],

        'columns' => [
            'title' => 'Titre',
            'sector' => 'Secteur',
            'contract' => 'Contrat',
            'status' => 'Statut',
            'gender_pref' => 'Préf. genre',
            'education' => 'Niveau d\'études',
            'created_at' => 'Créé le',
            'actions' => 'Actions',
            'position' => 'Poste visé',
            'experience' => 'Expérience',
            'location' => 'Localisation',
            'created' => 'Créé',
        ],
        'pagination' => [
            'range' => '{{from}}–{{to}} sur {{total}} briefs',
            'total' => '{{total}} briefs',
            'previous' => 'Page précédente',
            'next' => 'Page suivante',
        ],

        'bulk' => [
            'selected_count' => '{{count}} sélectionné(s)',
            'status_placeholder' => 'Changer le statut...',
            'apply' => 'Appliquer',
            'delete_selection' => 'Supprimer la sélection',
            'cancel_selection' => 'Annuler',
            'delete_label' => '{{count}} brief(s)',
        ],
        'toast' => [
            'deleted' => '« {{title}} » supprimé.',
            'undo' => 'Annuler',
            'restored' => 'Brief restauré.',
            'restore_error' => 'Impossible de restaurer ce brief.',
            'bulk_deleted' => 'Briefs supprimés.',
            'bulk_delete_error' => 'Erreur lors de la suppression groupée.',
            'bulk_status_updated' => 'Statuts mis à jour.',
            'bulk_status_error' => 'Erreur lors de la mise à jour groupée.',
        ],

        'row' => [
            'years_exp' => '{{count}} ans exp.',
            'years' => '{{count}} ans',
        ],

        'status' => [
            'active' => 'Actif',
            'draft' => 'Brouillon',
            'sourcing' => 'En sourcing',
            'interview' => 'Entretiens',
        ],

        'gender' => [
            'male' => 'Homme',
            'female' => 'Femme',
            'any' => 'Indifférent',
        ],

        'empty' => [
            'title' => 'Aucun brief trouvé',
            'description' => 'Commencez par créer votre premier brief de recrutement.',
        ],

        'modal' => [
            'title' => 'Supprimer le brief',
            'description' => 'Êtes-vous sûr de vouloir supprimer définitivement ce brief ?',
            'cancel' => 'Annuler',
            'confirm' => 'Oui, supprimer',
        ],
        'modale' => [
            'status' => [
                'title' => 'Mettre à jour le statut du brief',
                'description' => 'Sélectionnez le nouveau statut pour ce brief.',
                'updating' => 'Mise à jour…',
                'confirm' => 'Mettre à jour le statut',
                'cancel' => 'Annuler',
                'label' => 'Nouveau statut',
            ],
        ],
        'flash' => [
            'status_error' => 'Erreur lors de la mise à jour du statut',
            'index_error' => 'Erreur lors de la recherche des briefs',
            'delete_error' => 'Erreur lors de la suppression du brief',
        ],
    ],
    'import_modal' => [
        'title' => 'Nouveau brief de mission',
        'subtitle' => 'Importez une fiche de poste pour pré-remplir automatiquement le formulaire, ou saisissez manuellement.',
        'import_file' => 'Importer un fichier',
        'import_file_sub' => 'PDF, Word',
        'manual' => 'Saisie manuelle',
        'manual_sub' => 'Formulaire vide',
        'drop_active' => 'Déposez le fichier ici…',
        'drop_idle' => 'Glissez votre fichier ici ou parcourez',
        'drop_formats' => 'PDF, DOC, DOCX — max 5 Mo',
        'file_hint' => 'Cliquez sur Analyser ou déposez un autre fichier',
        'extracting' => 'Extraction en cours…',
        'extracting_sub' => 'Mistral AI analyse votre document',
        'extracting_slow' => 'C\'est plus long que prévu, encore quelques secondes…',
        'error_retry' => 'Réessayer avec un autre fichier',
        'back' => '← Retour',
        'skip_manual' => 'Passer, saisir manuellement',
        'analyse' => 'Analyser →',
    ],

    'extraction_preview' => [
        'title' => 'Résultat de l\'extraction',
        'detected' => '{count} champ détecté — vérifiez avant d\'appliquer.',
        'detected_plural' => '{count} champs détectés — vérifiez avant d\'appliquer.',
        'to_verify' => 'à vérifier',
        'not_detected' => 'Non détecté — à saisir manuellement',
        'discard' => 'Ignorer, saisir manuellement',
        'confirm' => 'Appliquer au formulaire →',
        'fields' => [
            'title' => 'Intitulé du poste',
            'sector' => 'Secteur',
            'contract_type' => 'Type de contrat',
            'location' => 'Lieu',
            'salary_range' => 'Salaire',
            'min_experience_years' => 'Expérience',
            'education_level' => 'Niveau d\'études',
            'seniority_level' => 'Séniorité',
            'languages' => 'Langues',
            'gender_pref' => 'Genre',
            'age_range' => 'Tranche d\'âge',
            'target_companies' => 'Entreprises cibles',
            'mission_description' => 'Description du poste',
            'required_skills' => 'Compétences requises',
            'soft_skills' => 'Soft skills',
        ],
    ],

];
