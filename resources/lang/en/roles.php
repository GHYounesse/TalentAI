<?php

return [

    'index' => [
        'title' => 'Roles',
        'subtitle' => 'Manage role permissions for your organisation.',
        'nav' => [
            'users' => 'Users',
        ],
        'table' => [
            'role' => 'Role',
            'users' => 'Users',
            'permissions' => 'Permissions',
            'user_count' => [
                'one' => '1 user',
                'other' => '{{count}} users',
            ],
            'more' => '+{{count}} more',
            'all_permissions' => 'All permissions',
            'no_permissions' => 'No permissions',
            'super_admin_note' => 'Gate bypass — all permissions',
            'actions' => [
                'edit' => 'Edit permissions',
            ],
        ],
        'flash' => [
            // Success
            'updated' => 'Permissions for ":role" updated.',

            // Errors
            'index_error' => 'Unable to load the roles list.',
            'update_error' => 'Unable to update permissions.',
        ],

    ],

    'edit_modal' => [
        'title' => 'Edit permissions',
        'actions' => [
            'cancel' => 'Cancel',
            'submit' => 'Save permissions',
            'submitting' => 'Saving…',
        ],
    ],

    'roles' => [
        'super_admin' => 'Super Admin',
        'admin' => 'Admin',
        'recruiter' => 'Recruiter',
        'hiring_manager' => 'Hiring Manager',
        'viewer' => 'Viewer',
    ],

    'modules' => [
        'briefs' => 'Briefs',
        'candidates' => 'Candidates',
        'users' => 'Users',
        'roles' => 'Roles',
        'sourcing' => 'Sourcing',
        'interviews' => 'Interviews',
        'reports' => 'Reports',
        'cv-analysis' => 'CV Analysis',
        'integrations' => 'Integrations',
        'settings' => 'Settings',
        'classement' => 'Ranking',
        'activity_logs' => 'Activity Logs',
        'parameters' => 'Parameters',
    ],

    'actions' => [
        'view' => 'View',
        'create' => 'Create',
        'edit' => 'Edit',
        'upload' => 'Upload',
        'delete' => 'Delete',
        'approve' => 'Approve',
        'export' => 'Export',
        'manage' => 'Manage',
        'connect' => 'Connect',
        'decide' => 'Decide',
    ],

    'create_modal' => [
        'title' => 'New role',
        'fields' => [
            'name' => 'Role name',
            'name_placeholder' => 'e.g. hr_manager',
        ],
        'actions' => [
            'cancel' => 'Cancel',
            'submit' => 'Create role',
            'submitting' => 'Creating…',
        ],
        'flash' => [
            'created' => 'Role ":name" created.',
            'create_error' => 'Unable to create role.',
        ],
    ],

    'role_users_modal' => [
        'title' => 'Users with role',
        'empty' => 'No users assigned to this role.',
        'actions' => [
            'remove' => 'Remove from role',
            'removing' => 'Removing…',
        ],
    ],

];
