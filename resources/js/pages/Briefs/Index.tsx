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

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    active: { label: 'Actif', className: 'bg-badge-active-bg text-badge-active-text border border-badge-active-text/20' },
    draft: { label: 'Brouillon', className: 'bg-ds-accent/10 text-ds-accent2 border border-ds-accent/20' },
    sourcing: { label: 'En sourcing', className: 'bg-badge-sourcing-bg text-badge-sourcing-text border border-badge-sourcing-text/20' },
    interview: { label: 'Entretiens', className: 'bg-badge-interview-bg text-badge-interview-text border border-badge-interview-text/20' },
};

function BriefStatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-ds-bg3 text-ds-text2 border border-ds-border' };
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.className}`}>{cfg.label}</span>;
}

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
            <p className="text-ds-text3">{from != null && to != null ? `${from}–${to} sur ${total} briefs` : `${total} briefs`}</p>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => goTo(current_page - 1)}
                    disabled={current_page === 1}
                    className={`${btnBase} ${current_page === 1 ? btnDisabled : btnIdle}`}
                    aria-label="Page précédente"
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
                    aria-label="Page suivante"
                >
                    <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}

export default function Index({ briefs, filters, params, brief_statuses }: IndexBriefProps) {
    const { t } = useI18n();

    const { can, isSuperAdmin } = usePermission();
    const canCreateBriefs = isSuperAdmin() || can('briefs.create');

    const [statusBrief, setStatusBrief] = useState<Brief | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const [deletingBrief, setDeletingBrief] = useState<Brief | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterEntry[]>(Array.isArray(filters) ? filters : []);

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
        router.post(
            route('dashboard.briefs.updateStatus', statusBrief.id),
            { status: newStatus },
            {
                onSuccess: () => {
                    setStatusBrief(null);
                },
                onError: () => toast.error(t('briefs.index.flash.status_error')),
                onFinish: () => setUpdatingStatus(false),
            },
        );
    }

    function handleDelete() {
        if (!deletingBrief) return;
        router.delete(route('dashboard.briefs.destroy', deletingBrief.id), {
            onSuccess: () => setDeletingBrief(null),
            onError: () => toast.error(t('briefs.index.flash.delete_error')),
        });
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

                    {/* Table */}
                    {!loading && briefs.data.length > 0 && (
                        <div className="border-ds-border bg-ds-surface overflow-hidden rounded-xl border">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-[13px]">
                                    <thead>
                                        <tr className="border-ds-border border-b">
                                            {['POSTE VISÉ', 'SECTEUR', 'CONTRAT', 'EXPÉRIENCE', 'LOCALISATION', 'STATUT', 'CRÉÉ', ''].map((col) => (
                                                <th
                                                    key={col}
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
                                                    <div className="flex items-center gap-3">
                                                        <BriefAvatar title={brief.title} index={index} />
                                                        <div className="min-w-0">
                                                            <p className="font-heading text-ds-text truncate font-semibold">{brief.title}</p>
                                                            <p className="text-ds-text3 truncate text-[11px]">
                                                                {brief.location} · {brief.min_experience_years} ans exp.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-ds-text2 px-4 py-3.5">{brief.sector}</td>
                                                <td className="px-4 py-3.5">
                                                    <ContractBadge type={brief.contract_type} />
                                                </td>
                                                <td className="text-ds-text2 px-4 py-3.5">{brief.min_experience_years} ans</td>
                                                <td className="text-ds-text2 px-4 py-3.5">{brief.location}</td>
                                                <td className="px-4 py-3.5">
                                                    <BriefStatusBadge status={brief.status} />
                                                </td>
                                                <td className="text-ds-text3 px-4 py-3.5 text-[12px]">{dayjs(brief.created_at).fromNow()}</td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setStatusBrief(brief);
                                                                setNewStatus(brief.status);
                                                            }}
                                                            className="border-ds-border text-ds-text3 hover:border-ds-accent hover:text-ds-accent flex h-7 w-7 items-center justify-center rounded-lg border transition"
                                                            title="Modifier statut"
                                                        >
                                                            <RefreshCw size={13} />
                                                        </button>
                                                        <Link
                                                            href={route('dashboard.briefs.show', brief.id)}
                                                            className="border-ds-border text-ds-text3 hover:border-ds-border2 hover:text-ds-text flex h-7 w-7 items-center justify-center rounded-lg border transition"
                                                            title={t('briefs.index.actions.view')}
                                                        >
                                                            <Eye size={13} />
                                                        </Link>
                                                        <Link
                                                            href={route('dashboard.briefs.edit', brief.id)}
                                                            className="border-ds-border text-ds-text3 hover:border-ds-amber/40 hover:text-ds-amber flex h-7 w-7 items-center justify-center rounded-lg border transition"
                                                            title={t('briefs.index.actions.edit')}
                                                        >
                                                            <Edit2 size={13} />
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeletingBrief(brief)}
                                                            className="border-ds-border text-ds-text3 hover:border-ds-red/40 hover:text-ds-red flex h-7 w-7 items-center justify-center rounded-lg border transition"
                                                            title={t('briefs.index.actions.delete')}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
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

                    {deletingBrief && (
                        <DeleteModal
                            label={deletingBrief.title}
                            i18nPrefix="briefs.index.modal"
                            onConfirm={handleDelete}
                            onCancel={() => setDeletingBrief(null)}
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
