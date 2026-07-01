<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleManagementController extends Controller
{
    /**
     * Display all roles with their permissions and user counts.
     *
     * @return Response Inertia page — RoleManagement/Index — or Fallback on failure
     */
    public function rolesIndex(Request $request): Response
    {
        $this->authorize('roles.view');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $roleName = $request->string('role')->trim()->toString();
            $permissions = array_values(array_filter($request->array('permissions')));

            $roles = Role::withCount('users')
                ->with(['permissions:name', 'users' => fn ($q) => $q->select('users.id', 'name', 'email', 'deactivated_at')])
                ->when($roleName, fn ($q) => $q->where('name', $roleName))
                ->when($permissions, function ($q) use ($permissions) {
                    foreach ($permissions as $perm) {
                        $q->whereHas('permissions', fn ($pq) => $pq->where('name', $perm));
                    }
                })
                ->get()
                ->map(fn ($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'users_count' => $role->users_count,
                    'users' => $role->users->map(fn ($u) => [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'is_active' => ! $u->isDeactivated(),
                    ]),
                    'permissions' => $role->permissions->pluck('name'),
                ]);

            $logger->log(
                'roles.index',
                'Consultation de la liste des rôles.',
                [],
                [Role::class]
            );

            return Inertia::render('RoleManagement/Index', [
                'roles' => $roles,
                'allPermissions' => Permission::all()->pluck('name')->groupBy(
                    fn ($perm) => explode('.', $perm)[0]
                ),
                'filters' => ['role' => $roleName, 'permissions' => $permissions],
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'roles.index.error',
                'Erreur lors de la récupération de la liste des rôles : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [Role::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de charger la liste des rôles.',
            ]);
        }
    }

    /**
     * Update the permissions assigned to a given role.
     *
     * @param  Request  $request  Must contain a `permissions` array of valid permission names
     * @param  Role  $role  Route-model-bound Role instance to update
     * @return RedirectResponse Redirects back with a success flash, or aborts on forbidden roles
     */
    public function rolesUpdate(Request $request, Role $role): RedirectResponse
    {
        $this->authorize('roles.manage');

        abort_if($role->name === 'super_admin', 403);

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $request->validate([
                'permissions' => ['array'],
                'permissions.*' => ['string', Rule::exists('permissions', 'name')],
            ]);

            $before = $role->permissions->pluck('name')->sort()->values()->toArray();

            $role->syncPermissions($request->input('permissions', []));

            $after = $role->fresh('permissions')->permissions->pluck('name')->sort()->values()->toArray();

            $logger->log(
                'roles.update',
                "Mise à jour des permissions du rôle « {$role->name} ».",
                [
                    'role' => $role->name,
                    'before' => $before,
                    'after' => $after,
                ],
                [Role::class]
            );

            return back()->with('success', "Permissions for \"{$role->name}\" updated.");
        } catch (\Throwable $e) {
            $logger->log(
                'roles.update.error',
                "Erreur lors de la mise à jour des permissions du rôle « {$role->name} » : ".$e->getMessage(),
                ['role' => $role->name, 'exception' => $e->getMessage()],
                [Role::class]
            );

            return back()->with('error', 'Impossible de mettre à jour les permissions.');
        }
    }

    /**
     * Render the edit-role page for a given role.
     *
     * @return Response Inertia page — RoleManagement/EditRole
     */
    public function rolesEdit(Role $role): Response
    {
        $this->authorize('roles.manage');
        abort_if($role->name === 'super_admin', 403);

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $logger->log('roles.edit.view', "Consultation de la page d'édition du rôle « {$role->name} ».", ['role' => $role->name], [Role::class]);

            return Inertia::render('RoleManagement/EditRole', [
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'users_count' => $role->users()->count(),
                    'permissions' => $role->permissions->pluck('name'),
                ],
                'allPermissions' => Permission::all()->pluck('name')->groupBy(
                    fn ($perm) => explode('.', $perm)[0]
                ),
            ]);
        } catch (\Throwable $e) {
            $logger->log('roles.edit.error', "Erreur lors du chargement de l'édition du rôle : ".$e->getMessage(), ['exception' => $e->getMessage()], [Role::class]);

            return Inertia::render('RoleManagement/EditRole', ['error' => 'Unable to load role.']);
        }
    }

    /**
     * Create a new role with optional initial permissions.
     *
     * @return RedirectResponse Back with success or error flash
     */
    public function rolesStore(Request $request): RedirectResponse
    {
        $this->authorize('roles.manage');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $data = $request->validate([
                'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')],
                'permissions' => ['array'],
                'permissions.*' => ['string', Rule::exists('permissions', 'name')],
            ]);

            $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);
            $role->syncPermissions($data['permissions'] ?? []);

            $logger->log('roles.store', "Création du rôle « {$role->name} ».", ['role' => $role->name], [Role::class]);

            return back()->with('success', "Role \"{$role->name}\" created.");
        } catch (\Throwable $e) {
            $logger->log('roles.store.error', 'Erreur lors de la création du rôle : '.$e->getMessage(), ['exception' => $e->getMessage()], [Role::class]);

            return back()->with('error', 'Unable to create role.');
        }
    }

    /**
     * Remove a user from a role.
     *
     * @return RedirectResponse Back with success or error flash
     */
    public function rolesRemoveUser(Role $role, User $user): RedirectResponse
    {
        $this->authorize('roles.manage');
        abort_if($role->name === 'super_admin', 403);

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $user->removeRole($role);

            $logger->log('roles.remove-user', "Retrait du rôle « {$role->name} » de l'utilisateur « {$user->name} ».", ['role' => $role->name, 'user_id' => $user->id], [Role::class]);

            return back()->with('success', "Role removed from {$user->name}.");
        } catch (\Throwable $e) {
            $logger->log('roles.remove-user.error', 'Erreur lors du retrait du rôle : '.$e->getMessage(), ['exception' => $e->getMessage()], [Role::class]);

            return back()->with('error', 'Unable to remove role from user.');
        }
    }

    /**
     * Display a paginated list of all users along with their roles.
     *
     * @param  Request  $request  Supports query params: `search` (string), `email` (string)
     * @return Response Inertia page — RoleManagement/Users — or Fallback on failure
     */
    public function usersIndex(Request $request): Response
    {
        $this->authorize('users.view');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $search = $request->string('search')->trim()->toString();
            $email = $request->string('email')->trim()->toString();
            $role = $request->string('role')->trim()->toString();

            $users = User::with('roles:name')
                ->select(['id', 'name',  'email', 'last_login_at', 'created_at', 'deleted_at', 'deactivated_at'])
                ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
                ->when($email, fn ($q) => $q->where('email', 'like', "%{$email}%"))
                ->when($role, fn ($q) => $q->whereHas('roles', fn ($r) => $r->where('name', $role)))
                ->latest()
                ->paginate(100)
                ->withQueryString()
                ->through(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('name'),
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at,
                    'is_active' => ! $user->isDeactivated(),
                ]);

            $logger->log('users.index', 'Consultation de la liste des utilisateurs.', [], [User::class]);

            return Inertia::render('RoleManagement/Users', [
                'users' => $users,
                'roles' => Role::all(['id', 'name']),
                'filters' => [
                    'search' => $search,
                    'email' => $email,
                    'role' => $role,
                ],
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'users.index.error',
                'Erreur lors de la récupération de la liste des utilisateurs : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [User::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de charger la liste des utilisateurs.',
            ]);
        }
    }

    /**
     * Replace the roles assigned to a given user.
     *
     * @param  Request  $request  Must contain a non-empty `roles` array of valid role names
     * @param  User  $user  Route-model-bound User instance to update
     * @return RedirectResponse Redirects back with a success flash, or aborts if unauthorized role assignment is attempted
     */
    public function usersUpdateRole(Request $request, User $user): RedirectResponse
    {
        $this->authorize('users.edit');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $request->validate([
                'roles' => ['required', 'array', 'min:1'],
                'roles.*' => ['string', Rule::exists('roles', 'name')],
            ]);

            if (
                in_array('super_admin', $request->roles) &&
                ! auth()->user()->hasRole('super_admin')
            ) {
                abort(403, 'Only a super admin can assign the super_admin role.');
            }

            $before = $user->roles->pluck('name')->sort()->values()->toArray();

            $user->syncRoles($request->input('roles'));

            $after = $request->input('roles');

            $logger->log(
                'users.update-role',
                "Mise à jour des rôles de l'utilisateur « {$user->name} » (ID : {$user->id}).",
                [
                    'user_id' => $user->id,
                    'before' => $before,
                    'after' => $after,
                ],
                [User::class]
            );

            return back()->with('success', "Roles for {$user->name} updated.");
        } catch (\Throwable $e) {
            $logger->log(
                'users.update-role.error',
                "Erreur lors de la mise à jour des rôles de l'utilisateur « {$user->name} » (ID : {$user->id}) : ".$e->getMessage(),
                ['user_id' => $user->id, 'exception' => $e->getMessage()],
                [User::class]
            );

            return back()->with('error', 'Impossible de mettre à jour les rôles.');
        }
    }

    /**
     * Validate and create a new user, then assign the requested roles.
     *
     * @param  Request  $request  Must contain `name`, `email`, `password`, and a non-empty `roles` array
     * @return RedirectResponse Redirects back with a success flash on creation
     */
    public function usersCreate(Request $request): RedirectResponse
    {
        $this->authorize('users.create');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $data = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', Rule::unique('users', 'email')],
                'password' => ['required', 'string', 'min:8'],
                'roles' => ['required', 'array', 'min:1'],
                'roles.*' => ['string', Rule::exists('roles', 'name')],
            ]);

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            $user->syncRoles($data['roles']);

            $logger->log(
                'users.create',
                "Création de l'utilisateur « {$user->name} » (ID : {$user->id}).",
                [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'roles' => $data['roles'],
                ],
                [User::class]
            );

            return back()->with('success', "User {$user->name} created successfully.");
        } catch (\Throwable $e) {
            $logger->log(
                'users.create.error',
                "Erreur lors de la création de l'utilisateur : ".$e->getMessage(),
                ['exception' => $e->getMessage()],
                [User::class]
            );

            return back()->with('error', "Impossible de créer l'utilisateur.");
        }
    }

    /**
     * Permanently delete a user from storage.
     *
     * @param  User  $user  Route-model-bound User instance to delete
     * @return RedirectResponse Redirects back with a success flash, or aborts if the authenticated user targets themselves
     */
    public function usersDelete(User $user): RedirectResponse
    {
        $this->authorize('users.delete');

        abort_if($user->id === auth()->id(), 403, 'You cannot delete your own account.');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $userId = $user->id;
            $userName = $user->name;

            $user->delete();

            $logger->log(
                'users.delete',
                "Suppression de l'utilisateur « {$userName} » (ID : {$userId}).",
                ['user_id' => $userId, 'name' => $userName],
                [User::class]
            );

            return back()->with('success', 'User deleted.');
        } catch (\Throwable $e) {
            $logger->log(
                'users.delete.error',
                "Erreur lors de la suppression de l'utilisateur (ID : {$user->id}) : ".$e->getMessage(),
                ['user_id' => $user->id, 'exception' => $e->getMessage()],
                [User::class]
            );

            return back()->with('error', "Impossible de supprimer l'utilisateur.");
        }
    }

    /**
     * Soft-delete (deactivate) a user without permanently removing them.
     *
     * @param  User  $user  Route-model-bound User instance to deactivate
     * @return RedirectResponse Redirects back with a success flash, or aborts if the authenticated user targets themselves
     */
    public function usersDeactivate(User $user): RedirectResponse
    {
        $this->authorize('users.edit');

        abort_if($user->id === auth()->id(), 403, 'You cannot deactivate your own account.');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $user->deactivate();

            $logger->log(
                'users.deactivate',
                "Désactivation de l'utilisateur « {$user->name} » (ID : {$user->id}).",
                ['user_id' => $user->id, 'name' => $user->name],
                [User::class]
            );

            return back()->with('success', "User {$user->name} deactivated.");
        } catch (\Throwable $e) {
            $logger->log(
                'users.deactivate.error',
                "Erreur lors de la désactivation de l'utilisateur (ID : {$user->id}) : ".$e->getMessage(),
                ['user_id' => $user->id, 'exception' => $e->getMessage()],
                [User::class]
            );

            return back()->with('error', "Impossible de désactiver l'utilisateur.");
        }
    }

    /**
     * Restore a previously soft-deleted (deactivated) user.
     *
     * @param  int  $user  Primary key of the soft-deleted User to restore
     * @return RedirectResponse Redirects back with a success flash on restore
     */
    public function usersActivate(int $user): RedirectResponse
    {
        $this->authorize('users.edit');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $userModel = User::withTrashed()->findOrFail($user);

            $userModel->activate();

            $logger->log(
                'users.activate',
                "Réactivation de l'utilisateur « {$userModel->name} » (ID : {$userModel->id}).",
                ['user_id' => $userModel->id, 'name' => $userModel->name],
                [User::class]
            );

            return back()->with('success', "User {$userModel->name} activated.");
        } catch (\Throwable $e) {
            $logger->log(
                'users.activate.error',
                "Erreur lors de la réactivation de l'utilisateur (ID : {$user}) : ".$e->getMessage(),
                ['user_id' => $user, 'exception' => $e->getMessage()],
                [User::class]
            );

            return back()->with('error', "Impossible de réactiver l'utilisateur.");
        }
    }
}
