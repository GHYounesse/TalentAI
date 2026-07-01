<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Dashboard
            'dashboard.view',

            // Briefs
            'briefs.view',
            'briefs.create',
            'briefs.edit',
            'briefs.delete',
            'briefs.approve',

            // Sourcing
            'sourcing.view',
            'sourcing.create',
            'sourcing.edit',
            'sourcing.delete',

            // Candidates
            'candidates.view',
            'candidates.create',
            'candidates.edit',
            'candidates.delete',
            'candidates.export',
            'historique.view',

            // Interviews
            'interviews.view',
            'interviews.decide',
            'interviews.edit',
            'interviews.create',
            'interviews.upload',
            'interviews.delete',
            'interviews.approve',

            // Reports
            'reports.view',
            'reports.export',
            // CV Analysis
            'cv-analysis.view',
            'cv-analysis.upload',
            'cv-analysis.create',

            // Integrations
            'integrations.view',
            'integrations.manage',
            'integrations.connect',

            // Classement
            'classement.view',
            'classement.manage',

            // Users & Roles (admin UI)
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'roles.view',
            'roles.manage',

            // Settings
            'settings.view',
            'settings.manage',

            // Activity Logs
            'activity_logs.view',

            // Parameters
            'parameters.view',
            'parameters.create',
            'parameters.edit',
            'parameters.delete',

            'sourcing-campaigns.view',
            'sourcing-campaigns.show',
            'sourcing-campaigns.create',

        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        // Super Admin — gets all permissions via gate bypass (HasRoles trait)
        $superAdmin = Role::firstOrCreate([
            'name' => 'super_admin',
            'guard_name' => 'web',
        ]);
        $superAdmin->syncPermissions(Permission::where('guard_name', 'web')->get());

        // Admin — manages users, settings, all content
        $admin = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);
        $admin->syncPermissions([
            'dashboard.view',
            'briefs.view',
            'briefs.create',
            'briefs.edit',
            'briefs.delete',
            'briefs.approve',
            'sourcing.view',
            'sourcing.create',
            'sourcing.edit',
            'sourcing.delete',
            'candidates.view',
            'candidates.create',
            'candidates.edit',
            'candidates.delete',
            'candidates.export',
            'historique.view',
            'interviews.view',
            'interviews.decide',
            'interviews.create',
            'interviews.upload',
            'reports.view',
            'reports.export',
            'integrations.view',
            'integrations.manage',
            'classement.view',
            'classement.manage',
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'briefs.view',
            'briefs.create',
            'briefs.edit',
            'briefs.delete',
            'briefs.approve',
            'sourcing.view',
            'sourcing.create',
            'sourcing.edit',
            'sourcing.delete',
            'candidates.view',
            'candidates.create',
            'candidates.edit',
            'candidates.delete',
            'candidates.export',
            'interviews.view',
            'interviews.create',
            'interviews.edit',
            'interviews.delete',
            'interviews.approve',
            'reports.view',
            'reports.export',
            'integrations.view',
            'integrations.manage',
            'integrations.connect',
            'classement.view',
            'classement.manage',
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'roles.view',
            'cv-analysis.view',
            'cv-analysis.upload',
            'cv-analysis.create',
            'activity_logs.view',
            'settings.view',
            'settings.manage',
            'sourcing-campaigns.view',
            'sourcing-campaigns.show',
            'sourcing-campaigns.create',
        ]);

        // Recruiter — full CRUD on core recruitment flow
        $recruiter = Role::firstOrCreate([
            'name' => 'recruiter',
            'guard_name' => 'web',
        ]);
        $recruiter->syncPermissions([
            'dashboard.view',
            'briefs.view',
            'briefs.create',
            'briefs.edit',
            'sourcing.view',
            'sourcing.create',
            'sourcing.edit',
            'sourcing.delete',
            'candidates.view',
            'candidates.create',
            'candidates.edit',
            'candidates.delete',
            'candidates.export',
            'interviews.view',
            'historique.view',
            'interviews.decide',
            'interviews.create',
            'interviews.upload',
            'briefs.view',
            'briefs.create',
            'briefs.edit',
            'sourcing.view',
            'sourcing.create',
            'sourcing.edit',
            'sourcing.delete',
            'candidates.view',
            'candidates.create',
            'candidates.edit',
            'candidates.delete',
            'candidates.export',
            'reports.view',
            'classement.view',
            'classement.manage',
            'sourcing-campaigns.view',
            'sourcing-campaigns.show',
            'sourcing-campaigns.create',
        ]);

        // Hiring Manager — view & approve, limited edit
        $hiringManager = Role::firstOrCreate([
            'name' => 'hiring_manager',
            'guard_name' => 'web',
        ]);
        $hiringManager->syncPermissions([
            'dashboard.view',
            'briefs.view',
            'briefs.approve',
            'sourcing.view',
            'candidates.view',
            'candidates.export',
            'interviews.view',
            'reports.view',
            'reports.export',
            'candidates.view',
            'candidates.export',
            'interviews.view',
            'interviews.approve',
            'reports.view',
            'reports.export',
            'classement.view',
            'sourcing-campaigns.view',
            'sourcing-campaigns.show',

        ]);

        // Viewer — read-only
        $viewer = Role::firstOrCreate([
            'name' => 'viewer',
            'guard_name' => 'web',
        ]);
        $viewer->syncPermissions([
            'dashboard.view',
            'briefs.view',
            'sourcing.view',
            'candidates.view',
            'interviews.view',
            'reports.view',
            'classement.view',
            'sourcing-campaigns.view',
            'sourcing-campaigns.show',
        ]);
    }
}
