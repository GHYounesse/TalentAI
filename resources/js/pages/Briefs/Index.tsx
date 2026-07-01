import DeleteModal from '@/components/ui/DeleteModal';
import FilterPanel, { FilterEntry } from '@/components/ui/FilterPanel';
import SkeletonTable from '@/components/ui/SkeletonTable';
import { useI18n } from '@/hooks/useI18n';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/app-layout';
import type { Brief, IndexBriefProps } from '@/types/brief';
import { Head, Link, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ChevronLeft, ChevronRight, Edit2, Eye, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import ReactSelect from 'react-select';

dayjs.extend(relativeTime);
dayjs.locale('fr');

const AVATAR_COLORS = [
    'from-[#6C63FF] to-[#38BDF8]',
    'from-[#34D399] to-[#38BDF8]',
    'from-[#FBBF24] to-[#F87171]',
    'from-[#A78BFA] to-[#6C63FF]',
    'from-[#F87171] to-[#FBBF24]',
];

function BriefAvatar({ title, index }: { title: string; index: number }) {
    const initials = title
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
    return (
        <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[index % AVATAR_COLORS.length]} text-[11px] font-bold text-white`}
        >
            {initials}
        </div>
    );
}

function ContractBadge({ type }: { type: string }) {
    return (
        <span className="border-ds-accent/20 bg-ds-accent/10 text-ds-accent2 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold">
            {type}
        </span>
    );
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

function Pagination({ meta, filters }: { meta: PaginationMeta; filters: FilterEntry[] }) {
    const { t } = useI18n();
    const { current_page, last_page, from, to, total } = meta;
    if (last_page <= 1) return null;

    function goTo(page: number) {
        const cleanFilters = filters
            .filter((f) => (Array.isArray(f.value) ? f.value.length > 0 : f.value && (f.value as string).trim() !== ''))
            .map((f) => ({ field: f.field, value: Array.isArray(f.value) ? f.value.join(',') : f.value }));

        router.get(route('dashboard.briefs.index'), { page, filters: JSON.stringify(cleanFilters) }, { preserveState: true, preserveScroll: false });
    }

    const pages = Array.from({ length: last_page }, (_, i) => i + 1);
    const visible = pages.filter((p) => p === 1 || p === last_page || Math.abs(p - current_page) <= 2);

    const btnBase = 'flex h-7 min-w-[28px] items-center justify-center rounded-lg border px-2 text-[12px] transition';
    const btnIdle = 'border-ds-border text-ds-text2 hover:border-ds-border2 hover:text-ds-text';
    const btnActive = 'border-ds-accent bg-ds-accent text-white';
    const btnDisabled = 'border-ds-border text-ds-text3 cursor-not-allowed opacity-50';

    return (
        <div className="mt-4 flex items-center justify-between text-[13px]">
            <p className="text-ds-text3">
                {from != null && to != null ? t('briefs.index.pagination.range', { from, to, total }) : t('briefs.index.pagination.total', { total })}
            </p>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => goTo(current_page - 1)}
                    disabled={current_page === 1}
                    className={`${btnBase} ${current_page === 1 ? btnDisabled : btnIdle}`}
                    aria-label={t('briefs.index.pagination.previous')}
                >
                    <ChevronLeft size={13} />
                </button>

                {visible.map((p, i) => (
                    <span key={p} className="flex items-center gap-1">
                        {i > 0 && visible[i - 1] !== p - 1 && <span className="text-ds-text3 px-0.5">…</span>}
                        <button
                            onClick={() => goTo(p)}
                            className={`${btnBase} ${p === current_page ? btnActive : btnIdle}`}
                            aria-current={p === current_page ? 'page' : undefined}
                        >
                            {p}
                        </button>
                    </span>
                ))}

                <button
                    onClick={() => goTo(current_page + 1)}
                    disabled={current_page === last_page}
                    className={`${btnBase} ${current_page === last_page ? btnDisabled : btnIdle}`}
                    aria-label={t('briefs.index.pagination.next')}
                >
                    <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}

function FilterChips({
    filters,
    fields,
    onRemove,
}: {
    filters: FilterEntry[];
    fields: { key: string; label: string }[];
    onRemove: (field: string) => void;
}) {
    const active = filters.filter((f) => (Array.isArray(f.value) ? f.value.length > 0 : f.value && (f.value as string).trim() !== ''));
    if (active.length === 0) return null;

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            {active.map((f) => {
                const label = fields.find((field) => field.key === f.field)?.label ?? f.field;
                const displayValue = Array.isArray(f.value) ? f.value.join(', ') : f.value;
                return (
                    <span
                        key={f.field}
                        className="bg-ds-accent/10 text-ds-accent2 border-ds-accent/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium"
                    >
                        {label}: {displayValue}
                        <button onClick={() => onRemove(f.field)} className="hover:text-ds-accent">
                            <X size={12} />
                        </button>
                    </span>
                );
            })}
        </div>
    );
}

function useStatusConfig() {
    const { t } = useI18n();
    return useMemo<Record<string, { label: string; className: string }>>(
        () => ({
            active: {
                label: t('briefs.index.status.active'),
                className: 'bg-badge-active-bg text-badge-active-text border border-badge-active-text/20',
            },
            draft: { label: t('briefs.index.status.draft'), className: 'bg-ds-accent/10 text-ds-accent2 border border-ds-accent/20' },
            sourcing: {
                label: t('briefs.index.status.sourcing'),
                className: 'bg-badge-sourcing-bg text-badge-sourcing-text border border-badge-sourcing-text/20',
            },
            interview: {
                label: t('briefs.index.status.interview'),
                className: 'bg-badge-interview-bg text-badge-interview-text border border-badge-interview-text/20',
            },
        }),
        [t],
    );
}

function BriefStatusBadge({ status }: { status: string }) {
    const STATUS_CONFIG = useStatusConfig();
    const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-ds-bg3 text-ds-text2 border border-ds-border' };
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.className}`}>{cfg.label}</span>;
}
export default function Index({ briefs, filters, params, brief_statuses }: IndexBriefProps) {
    const { t } = useI18n();

    const { can, isSuperAdmin } = usePermission();
    const canCreateBriefs = isSuperAdmin() || can('briefs.create');

    const [statusBrief, setStatusBrief] = useState<Brief | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const [loading, setLoading] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterEntry[]>(Array.isArray(filters) ? filters : []);
    const [pendingId, setPendingId] = useState<number | null>(null);

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkStatus, setBulkStatus] = useState<string>('');
    const [bulkPending, setBulkPending] = useState(false);
    const allOnPageSelected = briefs.data.length > 0 && briefs.data.every((b) => selectedIds.has(b.id));

    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    const FILTER_FIELDS = useMemo(
        () => [
            { key: 'title', label: t('briefs.index.filters.fields.title'), type: 'text' as const },
            { key: 'product_reference', label: 'Product Reference', type: 'text' as const },
            { key: 'mission_code', label: 'Mission Code', type: 'text' as const },
            {
                key: 'sector',
                label: t('briefs.index.filters.fields.sector'),
                type: 'select' as const,
                multi: true,
                options: params.sectors,
            },
            {
                key: 'contract_type',
                label: t('briefs.index.filters.fields.contract_type'),
                type: 'select' as const,
                multi: true,
                options: params.contract_types,
            },
            { key: 'location', label: t('briefs.index.filters.fields.location'), type: 'text' as const },
            { key: 'min_experience_years', label: t('briefs.index.filters.fields.min_experience_years'), type: 'number' as const },
            {
                key: 'education_level',
                label: t('briefs.index.filters.fields.education_level'),
                type: 'select' as const,
                multi: true,
                options: params.education_levels,
            },
            {
                key: 'status',
                label: t('briefs.index.filters.fields.status'),
                type: 'select' as const,
                multi: true,
                options: brief_statuses,
            },
        ],
        [t, params, brief_statuses],
    );

    function handleUpdateStatus() {
        if (!statusBrief) return;
        setUpdatingStatus(true);
        setPendingId(statusBrief.id);
        router.post(
            route('dashboard.briefs.updateStatus', statusBrief.id),
            { status: newStatus },
            {
                onSuccess: () => {
                    setStatusBrief(null);
                },
                onError: () => toast.error(t('briefs.index.flash.status_error')),
                onFinish: () => {
                    setUpdatingStatus(false);
                    setPendingId(null);
                },
            },
        );
    }

    function handleDeleteWithUndo(brief: Brief) {
        setPendingId(brief.id);
        router.delete(route('dashboard.briefs.destroy', brief.id), {
            onSuccess: () => {
                toast.custom(
                    (tst) => (
                        <div className="bg-ds-surface border-ds-border flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg">
                            <span className="text-ds-text text-sm">{t('briefs.index.toast.deleted', { title: brief.title })}</span>
                            <button
                                onClick={() => {
                                    router.post(
                                        route('dashboard.briefs.restore', brief.id),
                                        {},
                                        {
                                            onSuccess: () => toast.success(t('briefs.index.toast.restored')),
                                            onError: () => toast.error(t('briefs.index.toast.restore_error')),
                                        },
                                    );
                                    toast.dismiss(tst.id);
                                }}
                                className="text-ds-accent text-sm font-semibold hover:underline"
                            >
                                {t('briefs.index.toast.undo')}
                            </button>
                        </div>
                    ),
                    { duration: 6000 },
                );
            },
            onError: () => toast.error(t('briefs.index.flash.delete_error')),
            onFinish: () => setPendingId(null),
        });
    }

    function toggleAll() {
        setSelectedIds(allOnPageSelected ? new Set() : new Set(briefs.data.map((b) => b.id)));
    }

    function toggleOne(id: number) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function handleBulkDelete() {
        setBulkPending(true);
        router.delete(route('dashboard.briefs.bulkDestroy'), {
            data: { ids: Array.from(selectedIds) },
            onSuccess: () => {
                toast.success(t('briefs.index.toast.bulk_deleted'));
                setSelectedIds(new Set());
                setShowBulkDeleteModal(false);
            },
            onError: () => toast.error(t('briefs.index.toast.bulk_delete_error')),
            onFinish: () => setBulkPending(false),
        });
    }

    function handleBulkStatus() {
        if (!bulkStatus) return;
        setBulkPending(true);
        router.post(
            route('dashboard.briefs.bulkUpdateStatus'),
            { ids: Array.from(selectedIds), status: bulkStatus },
            {
                onSuccess: () => {
                    toast.success(t('briefs.index.toast.bulk_status_updated'));
                    setSelectedIds(new Set());
                    setBulkStatus('');
                },
                onError: () => toast.error(t('briefs.index.toast.bulk_status_error')),
                onFinish: () => setBulkPending(false),
            },
        );
    }

    function handleSearch(filtersOverride?: FilterEntry[]) {
        const toSearch = filtersOverride ?? activeFilters;
        const cleanFilters = toSearch
            .filter((f) => (Array.isArray(f.value) ? f.value.length > 0 : f.value && (f.value as string).trim() !== ''))
            .map((f) => ({ field: f.field, value: Array.isArray(f.value) ? f.value.join(',') : f.value }));

        router.get(
            route('dashboard.briefs.index'),
            { page: 1, filters: JSON.stringify(cleanFilters) },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
                onSuccess: (page) => {
                    const total = (page.props as { briefs?: { total?: number } }).briefs?.total ?? 0;
                    toast.success(`${total} brief${total !== 1 ? 's' : ''} trouvé${total !== 1 ? 's' : ''}`);
                },
                onError: () => toast.error(t('briefs.index.flash.index_error')),
            },
        );
    }

    return (
        <>
            <Head title={t('briefs.index.title')} />
            <AppLayout>
                <div className="bg-ds-bg min-h-screen px-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="font-heading text-ds-text text-[26px] font-bold">{t('briefs.index.title')}</h1>
                        <p className="text-ds-text2 mt-1 text-[14px]">{t('briefs.index.subtitle')}</p>
                    </div>

                    {/* Toolbar */}
                    <div className="mb-5 flex items-start gap-3">
                        <div className="flex-1">
                            <FilterPanel
                                fields={FILTER_FIELDS}
                                activeFilters={activeFilters}
                                onChange={setActiveFilters}
                                onSearch={handleSearch}
                                loading={loading}
                            />
                        </div>
                        {canCreateBriefs && (
                            <Link
                                href={route('dashboard.briefs.create')}
                                className="bg-ds-accent flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90"
                            >
                                <Plus size={14} />
                                {t('briefs.index.actions.create')}
                            </Link>
                        )}
                    </div>
                    <FilterChips
                        filters={activeFilters}
                        fields={FILTER_FIELDS}
                        onRemove={(field) => {
                            const updated = activeFilters.filter((f) => f.field !== field);
                            setActiveFilters(updated);
                            handleSearch(updated);
                        }}
                    />

                    {/* Skeleton while loading */}
                    {loading && <SkeletonTable cols={8} rows={8} />}

                    {/* Empty state */}
                    {!loading && briefs.data.length === 0 && (
                        <div className="border-ds-border bg-ds-surface flex flex-col items-center justify-center rounded-xl border py-24 text-center">
                            <div className="bg-ds-accent/10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                                <span className="text-2xl">📋</span>
                            </div>
                            <p className="font-heading text-ds-text text-[15px] font-semibold">{t('briefs.index.empty.title')}</p>
                            <p className="text-ds-text2 mt-1 text-[13px]">{t('briefs.index.empty.description')}</p>
                            {canCreateBriefs && (
                                <Link
                                    href={route('dashboard.briefs.create')}
                                    className="bg-ds-accent mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#7C74FF]"
                                >
                                    <Plus size={14} />
                                    {t('briefs.index.actions.create')}
                                </Link>
                            )}
                        </div>
                    )}

                    {selectedIds.size > 0 && (
                        <div className="border-ds-border bg-ds-surface mb-3 flex items-center gap-3 rounded-xl border px-4 py-2.5">
                            <span className="text-ds-text text-[13px] font-medium">
                                {t('briefs.index.bulk.selected_count', { count: selectedIds.size })}
                            </span>

                            <ReactSelect
                                classNamePrefix="rs"
                                className="min-w-[180px]"
                                placeholder={t('briefs.index.bulk.status_placeholder')}
                                options={brief_statuses}
                                value={brief_statuses.find((o) => o.value === bulkStatus) ?? null}
                                onChange={(option) => setBulkStatus(option?.value ?? '')}
                                isSearchable={false}
                            />
                            <button
                                onClick={handleBulkStatus}
                                disabled={!bulkStatus || bulkPending}
                                className="bg-ds-accent rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                            >
                                {t('briefs.index.bulk.apply')}
                            </button>

                            <button
                                onClick={() => setShowBulkDeleteModal(true)}
                                disabled={bulkPending}
                                className="border-ds-red/40 text-ds-red ml-auto rounded-lg border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50"
                            >
                                {t('briefs.index.bulk.delete_selection')}
                            </button>

                            <button onClick={() => setSelectedIds(new Set())} className="text-ds-text3 text-[12px] hover:underline">
                                {t('briefs.index.bulk.cancel_selection')}
                            </button>
                        </div>
                    )}
                    {/* Table */}
                    {!loading && briefs.data.length > 0 && (
                        <div className="border-ds-border bg-ds-surface overflow-hidden rounded-xl border">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-[13px]">
                                    <thead>
                                        <tr className="border-ds-border border-b">
                                            <th className="w-10 px-4 py-3">
                                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} />
                                            </th>
                                            {[
                                                t('briefs.index.columns.position'),
                                                t('briefs.index.columns.sector'),
                                                t('briefs.index.columns.contract'),
                                                t('briefs.index.columns.experience'),
                                                t('briefs.index.columns.location'),
                                                t('briefs.index.columns.status'),
                                                t('briefs.index.columns.created'),
                                                '',
                                            ].map((col, i) => (
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
                                        {briefs.data.map((brief, index) => (
                                            <tr
                                                key={brief.id}
                                                className="border-ds-border hover:bg-ds-bg3/40 border-b transition-colors last:border-0"
                                            >
                                                <td className="px-4 py-3.5">
                                                    <input type="checkbox" checked={selectedIds.has(brief.id)} onChange={() => toggleOne(brief.id)} />
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <BriefAvatar title={brief.title} index={index} />
                                                        <div className="min-w-0">
                                                            <p className="font-heading text-ds-text truncate font-semibold">{brief.title}</p>
                                                            <p className="text-ds-text3 truncate text-[11px]">
                                                                {brief.location} ·{' '}
                                                                {t('briefs.index.row.years_exp', { count: brief.min_experience_years })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-ds-text2 px-4 py-3.5">{brief.sector}</td>
                                                <td className="px-4 py-3.5">
                                                    <ContractBadge type={brief.contract_type} />
                                                </td>
                                                <td className="text-ds-text2 px-4 py-3.5">
                                                    {t('briefs.index.row.years', { count: brief.min_experience_years })}
                                                </td>
                                                <td className="text-ds-text2 px-4 py-3.5">{brief.location}</td>
                                                <td className="px-4 py-3.5">
                                                    <BriefStatusBadge status={brief.status} />
                                                </td>
                                                <td className="text-ds-text3 px-4 py-3.5 text-[12px]">{dayjs(brief.created_at).fromNow()}</td>
                                                <td className="px-4 py-3.5">
                                                    {(() => {
                                                        const isPending = pendingId === brief.id;
                                                        return (
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setStatusBrief(brief);
                                                                        setNewStatus(brief.status);
                                                                    }}
                                                                    disabled={isPending}
                                                                    className="border-ds-border text-ds-text3 hover:border-ds-accent hover:text-ds-accent flex h-7 w-7 items-center justify-center rounded-lg border transition disabled:opacity-40"
                                                                    title={t('briefs.index.actions.update_status')}
                                                                >
                                                                    <RefreshCw size={13} className={isPending ? 'animate-spin' : ''} />
                                                                </button>
                                                                <Link
                                                                    href={route('dashboard.briefs.show', brief.id)}
                                                                    className={`border-ds-border text-ds-text3 hover:border-ds-red/40 hover:text-ds-red flex h-7 w-7 items-center justify-center rounded-lg border transition ${isPending ? 'pointer-events-none opacity-40' : ''}`}
                                                                    title={t('briefs.index.actions.view')}
                                                                >
                                                                    <Eye size={13} />
                                                                </Link>
                                                                <Link
                                                                    href={route('dashboard.briefs.edit', brief.id)}
                                                                    className={`border-ds-border text-ds-text3 hover:border-ds-red/40 hover:text-ds-red flex h-7 w-7 items-center justify-center rounded-lg border transition ${isPending ? 'pointer-events-none opacity-40' : ''}`}
                                                                    title={t('briefs.index.actions.edit')}
                                                                >
                                                                    <Edit2 size={13} />
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleDeleteWithUndo(brief)}
                                                                    disabled={isPending}
                                                                    className={`border-ds-border text-ds-text3 hover:border-ds-red/40 hover:text-ds-red flex h-7 w-7 items-center justify-center rounded-lg border transition ${isPending ? 'pointer-events-none opacity-40' : ''}`}
                                                                    title={t('briefs.index.actions.delete')}
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Pagination ── */}
                            <div className="px-4 pb-4">
                                <Pagination meta={briefs} filters={activeFilters} />
                            </div>
                        </div>
                    )}

                    {showBulkDeleteModal && (
                        <DeleteModal
                            label={t('briefs.index.bulk.delete_label', { count: selectedIds.size })}
                            i18nPrefix="briefs.index.modal"
                            onConfirm={handleBulkDelete}
                            onCancel={() => setShowBulkDeleteModal(false)}
                        />
                    )}
                </div>
                {statusBrief && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-ds-surface border-ds-border animate-in fade-in zoom-in-95 w-full max-w-md rounded-2xl border shadow-2xl duration-200">
                            {/* Header */}
                            <div className="border-ds-border flex items-center justify-between border-b px-6 py-4">
                                <div>
                                    <h2 className="text-ds-text text-lg font-bold">{t('briefs.index.modale.status.title')}</h2>

                                    <p className="text-ds-text3 mt-1 text-sm">{statusBrief.title}</p>
                                </div>

                                <button
                                    onClick={() => setStatusBrief(null)}
                                    className="text-ds-text3 hover:bg-ds-bg3 hover:text-ds-text rounded-lg p-2 transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5">
                                <label className="text-ds-text mb-2 block text-sm font-medium">{t('briefs.index.modale.status.label')}</label>

                                <ReactSelect
                                    classNamePrefix="rs"
                                    options={brief_statuses}
                                    value={brief_statuses.find((option) => option.value === newStatus)}
                                    onChange={(option) => setNewStatus(option?.value ?? '')}
                                    isSearchable={false}
                                />

                                <p className="text-ds-text3 mt-3 text-xs">{t('briefs.index.modale.status.description')}</p>
                            </div>

                            {/* Footer */}
                            <div className="border-ds-border flex justify-end gap-3 border-t px-6 py-4">
                                <button
                                    onClick={() => setStatusBrief(null)}
                                    className="border-ds-border text-ds-text hover:bg-ds-bg3 rounded-lg border px-4 py-2 text-sm font-medium transition"
                                >
                                    {t('briefs.index.modale.status.cancel')}
                                </button>

                                <button
                                    onClick={handleUpdateStatus}
                                    disabled={updatingStatus}
                                    className="bg-ds-accent hover:bg-ds-accent/90 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
                                >
                                    {updatingStatus ? t('briefs.index.modale.status.updating') : t('briefs.index.modale.status.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AppLayout>
        </>
    );
}
