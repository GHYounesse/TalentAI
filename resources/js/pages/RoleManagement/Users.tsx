import DeleteModal from '@/components/ui/DeleteModal';
import FilterPanel, { FilterEntry } from '@/components/ui/FilterPanel';
import SkeletonTable from '@/components/ui/SkeletonTable';
import { useI18n } from '@/hooks/useI18n';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/app-layout';
import { PageProps, User } from '@/types/users';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit2, Plus, Search, Shield, Trash2, UserCheck, Users, UserX } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CreateUserModal } from './components/CreateUserModal';
import { EditRolesModal } from './components/EditRolesModal';
import { UserAvatar } from './components/UserAvatar';
import { ROLE_COLORS } from './constants';

function decodePaginationLabel(html: string): string {
    return html
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]*>/g, '');
}

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function UsersIndex() {
    const { users, roles, auth, filters } = usePage<PageProps>().props;
    const { t } = useI18n();
    const { can } = usePermission();

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const initFilters: FilterEntry[] = [];
    if (filters?.search) initFilters.push({ field: 'name', value: filters.search });
    if (filters?.email) initFilters.push({ field: 'email', value: filters.email });
    if (filters?.role) initFilters.push({ field: 'role', value: filters.role });
    const [activeFilters, setActiveFilters] = useState<FilterEntry[]>(initFilters);
    const [loading, setLoading] = useState(false);

    const FILTER_FIELDS = [
        { key: 'name', label: t('users.index.table.user'), type: 'text' as const },
        { key: 'email', label: 'Email', type: 'text' as const },
        {
            key: 'role',
            label: t('users.index.table.roles'),
            type: 'select' as const,
            options: roles.map((r) => ({ value: r.name, label: t(`users.roles.${r.name}`, { fallback: r.name }) })),
        },
    ];

    function handleSearch() {
        const name = activeFilters.find((f) => f.field === 'name')?.value ?? '';
        const email = activeFilters.find((f) => f.field === 'email')?.value ?? '';
        const role = activeFilters.find((f) => f.field === 'role')?.value ?? '';
        router.get(
            route('dashboard.users.index'),
            {
                ...(name ? { search: String(name) } : {}),
                ...(email ? { email: String(email) } : {}),
                ...(role ? { role: String(role) } : {}),
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
                onSuccess: (page) => {
                    const total = (page.props as { users?: { total?: number } }).users?.total ?? 0;
                    const msg = total === 1 ? t('users.index.subtitle_one') : t('users.index.subtitle_other', { count: total });
                    toast.success(msg);
                },
                onError: () => toast.error(t('users.index.search.no_results')),
            },
        );
    }

    function clearFilters() {
        setActiveFilters([]);
        router.get(route('dashboard.users.index'), {}, { preserveState: true, preserveScroll: true, replace: true });
    }

    const hasActiveFilters = activeFilters.some((f) => (Array.isArray(f.value) ? f.value.length > 0 : f.value !== ''));

    const toggleUserStatus = (user: User) => {
        const routeName = user.is_active ? 'dashboard.users.deactivate' : 'dashboard.users.activate';
        router.patch(route(routeName, user.id), {}, { preserveScroll: true });
    };

    const deleteUser = () => {
        if (!deletingUser) return;
        router.delete(route('dashboard.users.delete', deletingUser.id), {
            preserveScroll: true,
            onFinish: () => setDeletingUser(null),
        });
    };

    const subtitle = users.total === 1 ? t('users.index.subtitle_one') : t('users.index.subtitle_other', { count: users.total });

    const TABLE_COLS = [
        t('users.index.table.user'),
        t('users.index.table.roles'),
        t('users.index.table.last_login'),
        t('users.index.table.joined'),
        '',
    ];

    return (
        <>
            <Head title={t('users.index.title')} />
            <AppLayout>
                <div className="bg-ds-bg min-h-full px-4 py-4 sm:px-6 sm:py-8">
                    {/* Header */}
                    <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
                        <div className="min-w-0">
                            <h1 className="font-heading text-ds-text truncate text-[20px] font-bold sm:text-[26px]">{t('users.index.title')}</h1>
                            <p className="text-ds-text2 mt-0.5 truncate text-[12px] sm:mt-1 sm:text-[14px]">{subtitle}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <a
                                href={route('dashboard.roles.index')}
                                className="border-ds-border text-ds-text2 hover:bg-ds-surface hover:text-ds-text flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition sm:px-4 sm:py-2.5 sm:text-[13px]"
                            >
                                <Shield size={13} />
                                <span className="hidden sm:inline">{t('users.index.nav.roles')}</span>
                            </a>
                            {can('users.create') && (
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="bg-ds-accent flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-[#7C74FF] sm:px-4 sm:py-2.5 sm:text-[13px]"
                                >
                                    <Plus size={13} />
                                    <span className="hidden sm:inline">{t('users.index.actions.create')}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Filter panel ─────────────────────────────── */}
                    <div className="mb-4">
                        <FilterPanel
                            fields={FILTER_FIELDS}
                            activeFilters={activeFilters}
                            onChange={setActiveFilters}
                            onSearch={handleSearch}
                            loading={loading}
                        />
                    </div>

                    {/* Empty state — no users exist at all */}
                    {users.data.length === 0 && !hasActiveFilters && (
                        <div className="border-ds-border bg-ds-surface flex flex-col items-center justify-center rounded-xl border py-24 text-center">
                            <div className="bg-ds-accent/10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                                <Users className="text-ds-text2 h-8 w-8" />
                            </div>
                            <p className="font-heading text-ds-text text-[15px] font-semibold">{t('users.index.empty.title')}</p>
                            <p className="text-ds-text2 mt-1 text-[13px]">{t('users.index.empty.description')}</p>
                            {can('users.create') && (
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="bg-ds-accent mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#7C74FF]"
                                >
                                    <Plus size={14} />
                                    {t('users.index.actions.create')}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Skeleton while searching */}
                    {loading && <SkeletonTable cols={TABLE_COLS.length} rows={users.per_page ?? 10} />}

                    {/* Empty state — filters returned no results */}
                    {!loading && users.data.length === 0 && hasActiveFilters && (
                        <div className="border-ds-border bg-ds-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
                            <Search size={28} className="text-ds-text3 mb-3" />
                            <p className="font-heading text-ds-text text-[15px] font-semibold">{t('users.index.search.no_results')}</p>
                            <p className="text-ds-text2 mt-1 text-[13px]">{t('users.index.search.no_results_hint')}</p>
                            <button onClick={() => clearFilters()} className="text-ds-accent mt-4 text-[13px] font-medium hover:underline">
                                {t('users.index.search.clear')}
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    {!loading && users.data.length > 0 && (
                        <>
                            {/* ── Mobile card list ── */}
                            <div className="space-y-2 sm:hidden">
                                {users.data.map((user, index) => (
                                    <div
                                        key={user.id}
                                        className={`border-ds-border bg-ds-surface rounded-xl border p-3.5 ${!user.is_active ? 'opacity-50' : ''}`}
                                    >
                                        <div className="mb-2.5 flex items-center gap-3">
                                            <UserAvatar name={user.full_name ?? user.name} index={index} />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-heading text-ds-text flex items-center gap-1.5 truncate text-[13px] font-semibold">
                                                    {user.full_name ?? user.name}
                                                    {!user.is_active && (
                                                        <span className="bg-ds-red/10 text-ds-red rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
                                                            {t('users.index.table.inactive')}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-ds-text3 truncate text-[11px]">{user.email}</p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1">
                                                {can('users.edit') && (
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        className="border-ds-border text-ds-text3 flex h-7 w-7 items-center justify-center rounded-lg border transition"
                                                        title={t('users.index.table.actions.edit')}
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                )}
                                                {can('users.edit') && user.id !== auth.user.id && (
                                                    <button
                                                        onClick={() => toggleUserStatus(user)}
                                                        className={`border-ds-border flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                                            user.is_active ? 'text-ds-text3' : 'text-ds-text3'
                                                        }`}
                                                    >
                                                        {user.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                                                    </button>
                                                )}
                                                {can('users.delete') && user.id !== auth.user.id && (
                                                    <button
                                                        onClick={() => setDeletingUser(user)}
                                                        className="border-ds-border text-ds-text3 flex h-7 w-7 items-center justify-center rounded-lg border transition"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.length === 0 ? (
                                                <span className="text-ds-text3 text-xs">{t('users.index.table.no_roles')}</span>
                                            ) : (
                                                user.roles.map((r) => (
                                                    <span
                                                        key={r}
                                                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_COLORS[r] ?? ROLE_COLORS.viewer}`}
                                                    >
                                                        {t(`users.roles.${r}`, { fallback: r })}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {users.last_page > 1 && (
                                    <div className="border-ds-border flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                                        <p className="text-ds-text3 text-[12px]">
                                            {t('users.index.pagination.summary', {
                                                current: users.current_page,
                                                last: users.last_page,
                                                total: users.total,
                                            })}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {users.links.map((link, i) => (
                                                <button
                                                    key={i}
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                                    className={`flex h-7 min-w-[28px] items-center justify-center rounded-lg border px-2 text-[12px] transition ${
                                                        link.active
                                                            ? 'border-ds-accent bg-ds-accent text-white'
                                                            : 'border-ds-border text-ds-text2 disabled:cursor-not-allowed disabled:opacity-40'
                                                    }`}
                                                >
                                                    {decodePaginationLabel(link.label)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Desktop table ── */}
                            <div className="border-ds-border bg-ds-surface hidden overflow-hidden rounded-xl border sm:block">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px] border-collapse text-[13px]">
                                        <thead>
                                            <tr className="border-ds-border border-b">
                                                {TABLE_COLS.map((col, i) => (
                                                    <th
                                                        key={i}
                                                        className="text-ds-text3 px-4 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.data.map((user, index) => (
                                                <tr
                                                    key={user.id}
                                                    className={`border-ds-border hover:bg-ds-bg3/40 border-b transition-colors last:border-0 ${
                                                        !user.is_active ? 'opacity-50' : ''
                                                    }`}
                                                >
                                                    {/* User */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <UserAvatar name={user.full_name ?? user.name} index={index} />
                                                            <div className="min-w-0">
                                                                <p className="font-heading text-ds-text flex items-center gap-2 truncate font-semibold">
                                                                    {user.full_name ?? user.name}
                                                                    {!user.is_active && (
                                                                        <span className="bg-ds-red/10 text-ds-red rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                                                                            {t('users.index.table.inactive')}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-ds-text3 truncate text-[11px]">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Roles */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.roles.length === 0 ? (
                                                                <span className="text-ds-text3 text-xs">{t('users.index.table.no_roles')}</span>
                                                            ) : (
                                                                user.roles.map((r) => (
                                                                    <span
                                                                        key={r}
                                                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ROLE_COLORS[r] ?? ROLE_COLORS.viewer}`}
                                                                    >
                                                                        {t(`users.roles.${r}`, { fallback: r })}
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Last login */}
                                                    <td className="text-ds-text3 px-4 py-3.5 text-[12px]">{formatDate(user.last_login_at)}</td>

                                                    {/* Joined */}
                                                    <td className="text-ds-text3 px-4 py-3.5 text-[12px]">{formatDate(user.created_at)}</td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {can('users.edit') && (
                                                                <button
                                                                    onClick={() => setEditingUser(user)}
                                                                    className="border-ds-border text-ds-text3 hover:border-ds-amber/40 hover:text-ds-amber flex h-7 w-7 items-center justify-center rounded-lg border transition"
                                                                    title={t('users.index.table.actions.edit')}
                                                                >
                                                                    <Edit2 size={13} />
                                                                </button>
                                                            )}

                                                            {can('users.edit') && user.id !== auth.user.id && (
                                                                <button
                                                                    onClick={() => toggleUserStatus(user)}
                                                                    className={`border-ds-border flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                                                        user.is_active
                                                                            ? 'text-ds-text3 hover:border-ds-red/40 hover:text-ds-red'
                                                                            : 'text-ds-text3 hover:border-emerald-400/40 hover:text-emerald-500'
                                                                    }`}
                                                                    title={
                                                                        user.is_active
                                                                            ? t('users.index.table.actions.deactivate')
                                                                            : t('users.index.table.actions.activate')
                                                                    }
                                                                >
                                                                    {user.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                                                                </button>
                                                            )}

                                                            {can('users.delete') && user.id !== auth.user.id && (
                                                                <button
                                                                    onClick={() => setDeletingUser(user)}
                                                                    className="border-ds-border text-ds-text3 hover:border-ds-red/40 hover:text-ds-red flex h-7 w-7 items-center justify-center rounded-lg border transition"
                                                                    title={t('users.index.table.actions.delete')}
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {users.last_page > 1 && (
                                    <div className="border-ds-border flex items-center justify-between border-t px-4 py-3">
                                        <p className="text-ds-text3 text-[13px]">
                                            {t('users.index.pagination.summary', {
                                                current: users.current_page,
                                                last: users.last_page,
                                                total: users.total,
                                            })}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {users.links.map((link, i) => (
                                                <button
                                                    key={i}
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                                    className={`flex h-7 min-w-[28px] items-center justify-center rounded-lg border px-2 text-[12px] transition ${
                                                        link.active
                                                            ? 'border-ds-accent bg-ds-accent text-white'
                                                            : 'border-ds-border text-ds-text2 hover:border-ds-border2 hover:text-ds-text disabled:cursor-not-allowed disabled:opacity-40'
                                                    }`}
                                                >
                                                    {decodePaginationLabel(link.label)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Modals */}
                {editingUser && <EditRolesModal user={editingUser} roles={roles} onClose={() => setEditingUser(null)} />}
                {showCreate && <CreateUserModal roles={roles} onClose={() => setShowCreate(false)} />}
                {deletingUser && (
                    <DeleteModal
                        label={deletingUser.full_name ?? deletingUser.name}
                        i18nPrefix="users.index.delete_modal"
                        onConfirm={deleteUser}
                        onCancel={() => setDeletingUser(null)}
                    />
                )}
            </AppLayout>
        </>
    );
}
