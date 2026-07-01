import AiAnalysisPanel from '@/components/Candidats/AiAnalysisPanel';
import DeleteModal from '@/components/ui/DeleteModal';
import FilterPanel, { FilterEntry } from '@/components/ui/FilterPanel';
import SkeletonTable from '@/components/ui/SkeletonTable';
import { useI18n } from '@/hooks/useI18n';
import AppLayout from '@/layouts/app-layout';
import { safeUrl } from '@/lib/utils';
import type { Candidat, IndexCandidatProps } from '@/types/candidat';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, ExternalLink, Pencil, Plus, RefreshCw, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    sourced: { label: 'Sourcé', className: 'bg-ds-bg3 text-ds-text2 border border-ds-border' },
    contacted: { label: 'Contacté', className: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20' },
    interview: { label: 'Entretien', className: 'bg-[#818CF8]/10 text-[#818CF8] border border-[#818CF8]/20' },
    recommended: { label: 'Recommandé', className: 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/25' },
    offer: { label: 'Offre', className: 'bg-ds-accent/10 text-ds-accent2 border border-ds-accent/20' },
    rejected: { label: 'Rejeté', className: 'bg-ds-red/10 text-ds-red border border-ds-red/20' },
};

const SOURCE_CONFIG: Record<string, { className: string }> = {
    linkedin: { className: 'bg-[#6C63FF]/15 text-[#818CF8] border border-[#6C63FF]/25' },
    indeed: { className: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25' },
    default: { className: 'bg-ds-accent/10 text-ds-accent2 border border-ds-accent/20' },
};

function sourceStyle(source: string) {
    const key = source.toLowerCase();
    return SOURCE_CONFIG[key]?.className ?? SOURCE_CONFIG.default.className;
}

function scoreColor(score: number) {
    if (score >= 85) return 'text-[#34D399]';
    if (score >= 70) return 'text-[#818CF8]';
    if (score >= 55) return 'text-[#22D3EE]';
    return 'text-ds-text3';
}

const AVATAR_COLORS = [
    'from-[#6C63FF] to-[#38BDF8]',
    'from-[#34D399] to-[#38BDF8]',
    'from-[#FBBF24] to-[#F87171]',
    'from-[#A78BFA] to-[#6C63FF]',
    'from-[#F87171] to-[#FBBF24]',
    'from-[#EC4899] to-[#818CF8]',
];

function CandidatAvatar({ name, index, photoUrl }: { name: string; index: number; photoUrl?: string | null }) {
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    if (photoUrl) {
        return (
            <div className="relative h-10 w-10 shrink-0">
                <img
                    src={photoUrl}
                    alt={name}
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => {
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                            e.currentTarget.remove();
                            const div = document.createElement('div');
                            div.className = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[index % AVATAR_COLORS.length]} text-[12px] font-bold text-white`;
                            div.textContent = initials;
                            parent.appendChild(div);
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[index % AVATAR_COLORS.length]} text-[12px] font-bold text-white`}
        >
            {initials}
        </div>
    );
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

function Pagination({ meta, search }: { meta: PaginationMeta; search: string }) {
    const { current_page, last_page, from, to, total } = meta;
    if (last_page <= 1) return null;

    function goTo(page: number) {
        router.get(route('dashboard.candidats.index'), { page, ...(search ? { search } : {}) }, { preserveState: true, preserveScroll: false });
    }

    const pages = Array.from({ length: last_page }, (_, i) => i + 1);
    const visible = pages.filter((p) => p === 1 || p === last_page || Math.abs(p - current_page) <= 2);

    const btnBase = 'flex h-7 min-w-[28px] items-center justify-center rounded-lg border px-2 text-[12px] transition';
    const btnIdle = 'border-ds-border text-ds-text2 hover:border-ds-border2 hover:text-ds-text';
    const btnActive = 'border-ds-accent bg-ds-accent text-white';
    const btnDisabled = 'border-ds-border text-ds-text3 cursor-not-allowed opacity-50';

    return (
        <div className="mt-4 flex items-center justify-between text-[13px]">
            <p className="text-ds-text3">{from != null && to != null ? `${from}–${to} sur ${total} candidats` : `${total} candidats`}</p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => goTo(current_page - 1)}
                    disabled={current_page === 1}
                    className={`${btnBase} ${current_page === 1 ? btnDisabled : btnIdle}`}
                >
                    <ChevronLeft size={13} />
                </button>
                {visible.map((p, i) => (
                    <span key={p} className="flex items-center gap-1">
                        {i > 0 && visible[i - 1] !== p - 1 && <span className="text-ds-text3 px-0.5">…</span>}
                        <button onClick={() => goTo(p)} className={`${btnBase} ${p === current_page ? btnActive : btnIdle}`}>
                            {p}
                        </button>
                    </span>
                ))}
                <button
                    onClick={() => goTo(current_page + 1)}
                    disabled={current_page === last_page}
                    className={`${btnBase} ${current_page === last_page ? btnDisabled : btnIdle}`}
                >
                    <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}

const DEFAULT_STATUSES = [
    { value: 'sourced', label: 'Sourcé' },
    { value: 'contacted', label: 'Contacté' },
    { value: 'interview', label: 'Entretien' },
    { value: 'recommended', label: 'Recommandé' },
    { value: 'offer', label: 'Offre' },
    { value: 'rejected', label: 'Rejeté' },
];

export default function Index({ candidats, filters, briefs, params }: IndexCandidatProps) {
    const { t } = useI18n();
    const statusOptions = params.status_candidat && params.status_candidat.length > 0 ? params.status_candidat : DEFAULT_STATUSES;
    const statusLabel = (value: string) => statusOptions.find((o) => o.value === value)?.label ?? STATUS_CONFIG[value]?.label ?? value;

    const [search] = useState(filters.search ?? '');
    const [deletingCandidat, setDeletingCandidat] = useState<Candidat | null>(null);
    const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
    const [pendingStatuses, setPendingStatuses] = useState<Record<number, string>>({});
    const [analysisCandidat, setAnalysisCandidat] = useState<Candidat | null>(null);
    const [analysisMap, setAnalysisMap] = useState<Record<number, string>>({});
    const [generatingId, setGeneratingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterEntry[]>(Array.isArray(filters) ? filters : []);
    type SortKey = 'sourcing_score' | 'score_cv' | 'score_interview';
    const [sortKey, setSortKey] = useState<SortKey | null>('sourcing_score');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [rescoringId, setRescoringId] = useState<number | null>(null);

    async function handleSparkle(candidat: Candidat) {
        const existingAnalysis = analysisMap[candidat.id] ?? candidat.ai_analysis;
        if (existingAnalysis) {
            setAnalysisCandidat({ ...candidat, ai_analysis: existingAnalysis });
            return;
        }
        if (!candidat.brief_id) return;
        setGeneratingId(candidat.id);
        try {
            const { data } = await axios.post<{ ai_analysis: string }>(route('dashboard.sourcing.generate-analysis'), {
                candidat_id: candidat.id,
                brief_id: candidat.brief_id,
            });
            setAnalysisMap((prev) => ({ ...prev, [candidat.id]: data.ai_analysis }));
            setAnalysisCandidat({ ...candidat, ai_analysis: data.ai_analysis });
        } catch {
            toast.error('Erreur lors de la génération de la synthèse.');
        } finally {
            setGeneratingId(null);
        }
    }

    async function handleRescore(candidat: Candidat) {
        if (!candidat.brief_id) return;
        setRescoringId(candidat.id);
        try {
            const { data } = await axios.post<{ score: number }>(route('dashboard.sourcing.rescore'), {
                candidat_id: candidat.id,
                brief_id: candidat.brief_id,
            });
            toast.success(`Score recalculé : ${data.score}`);
            router.reload({ only: ['candidats'] });
        } catch {
            toast.error('Erreur lors du recalcul du score.');
        } finally {
            setRescoringId(null);
        }
    }

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    }

    const sortedData = useMemo(() => {
        if (!sortKey) return candidats.data;
        return [...candidats.data].sort((a, b) => {
            const valA = sortKey === 'score_interview' ? (a.ai_score ?? null) : (a[sortKey] ?? null);
            const valB = sortKey === 'score_interview' ? (b.ai_score ?? null) : (b[sortKey] ?? null);
            if (valA === null && valB === null) return 0;
            if (valA === null) return 1;
            if (valB === null) return -1;
            return sortDir === 'desc' ? valB - valA : valA - valB;
        });
    }, [candidats.data, sortKey, sortDir]);

    const FILTER_FIELDS = [
        {
            key: 'brief_id',
            label: 'Brief',
            type: 'select' as const,
            multi: true,
            options: briefs.map((b) => ({ value: String(b.id), label: b.title })),
        },
        { key: 'full_name', label: t('candidats.index.filters.full_name'), type: 'text' as const },
        { key: 'headline', label: t('candidats.index.filters.headline'), type: 'text' as const },
        { key: 'location', label: t('candidats.index.filters.location'), type: 'text' as const },
        { key: 'current_company', label: t('candidats.index.filters.current_company'), type: 'text' as const },
        { key: 'current_title', label: t('candidats.index.filters.current_title'), type: 'text' as const },
        { key: 'experience_years', label: t('candidats.index.filters.experience_years'), type: 'number' as const },
        { key: 'education_level', label: t('candidats.index.filters.education_level'), type: 'text' as const },
        { key: 'recruiter_notes', label: t('candidats.index.filters.recruiter_notes'), type: 'text' as const },
        {
            key: 'sector',
            label: t('candidats.index.filters.sector'),
            type: 'select' as const,
            multi: true,
            options: [
                { value: 'commerce', label: t('briefs.index.filters.sector_options.commerce') },
                { value: 'tech', label: t('briefs.index.filters.sector_options.tech') },
                { value: 'finance', label: t('briefs.index.filters.sector_options.finance') },
                { value: 'rh', label: t('briefs.index.filters.sector_options.rh') },
                { value: 'marketing', label: t('briefs.index.filters.sector_options.marketing') },
                { value: 'operations', label: t('briefs.index.filters.sector_options.operations') },
                { value: 'juridique', label: t('briefs.index.filters.sector_options.juridique') },
                { value: 'sante', label: t('briefs.index.filters.sector_options.sante') },
            ],
        },
        {
            key: 'source',
            label: t('candidats.index.filters.source'),
            type: 'select' as const,
            multi: true,
            options: [
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'indeed', label: 'Indeed' },
                { value: 'apify', label: 'Web' },
                { value: 'cv', label: 'CV' },
            ],
        },
        {
            key: 'status',
            label: t('candidats.index.filters.status'),
            type: 'select' as const,
            multi: true,
            options: [
                { value: 'sourced', label: t('briefs.index.filters.status_options.sourced') },
                { value: 'contacted', label: t('candidats.index.filters.status_options.contacted') },
                { value: 'interview', label: t('candidats.index.filters.status_options.interview') },
                { value: 'recommended', label: t('candidats.index.filters.status_options.recommended') },
                { value: 'offer', label: t('candidats.index.filters.status_options.offer') },
                { value: 'rejected', label: t('candidats.index.filters.status_options.rejected') },
            ],
        },
        {
            key: 'open_to_work',
            label: t('candidats.index.filters.open_to_work'),
            type: 'select' as const,
            options: [
                { value: 'true', label: t('candidats.index.filters.yes') },
                { value: 'false', label: t('candidats.index.filters.no') },
            ],
        },
    ];

    function handleDelete() {
        if (!deletingCandidat) return;
        router.delete(route('dashboard.candidats.destroy', deletingCandidat.id), {
            onSuccess: () => setDeletingCandidat(null),
        });
    }

    const enrichCandidate = (id: number) => {
        router.post(
            route('dashboard.candidats.enrich-contact', id),
            {},
            {
                onSuccess: () => toast.success(t('candidats.index.flash.enrich_success')),
                onError: () => toast.error(t('candidats.index.flash.enrich_error')),
            },
        );
    };

    function handleSearch(filtersOverride?: FilterEntry[]) {
        const toSearch = filtersOverride ?? activeFilters;
        const cleanFilters = toSearch
            .filter((f) => (Array.isArray(f.value) ? f.value.length > 0 : f.value && (f.value as string).trim() !== ''))
            .map((f) => ({ field: f.field, value: Array.isArray(f.value) ? f.value.join(',') : f.value }));
        router.get(
            route('dashboard.candidats.index'),
            { filters: JSON.stringify(cleanFilters) },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
                onSuccess: (page) => {
                    const total = (page.props as { candidats?: { total?: number } }).candidats?.total ?? 0;
                    toast.success(`${total} candidat${total !== 1 ? 's' : ''} trouvé${total !== 1 ? 's' : ''}`);
                },
                onError: () => toast.error(t('candidats.index.flash.index_error')),
            },
        );
    }

    function confirmStatusChange(candidat: Candidat) {
        const newStatus = pendingStatuses[candidat.id] ?? candidat.status;
        setEditingStatusId(null);
        router.patch(route('dashboard.candidats.update-status', candidat.id), { status: newStatus }, { preserveScroll: true, preserveState: true });
    }

    const totalLabel = `${candidats.total} profil${candidats.total !== 1 ? 's' : ''} actif${candidats.total !== 1 ? 's' : ''} · Toutes sources confondues`;

    function SortIcon({ col }: { col: SortKey }) {
        if (sortKey !== col) return <ChevronDown size={11} className="text-ds-text3 opacity-40" />;
        return sortDir === 'desc' ? <ChevronDown size={11} className="text-ds-accent" /> : <ChevronUp size={11} className="text-ds-accent" />;
    }

    const SORTABLE_COLS: { label: string; key: SortKey }[] = [
        { label: 'SCORE SOURCING', key: 'sourcing_score' },
        { label: 'SCORE CV', key: 'score_cv' },
        { label: 'SCORE ENTRETIEN', key: 'score_interview' },
    ];

    return (
        <>
            <Head title={t('candidats.index.title')} />
            <AppLayout>
                <div className="bg-ds-bg min-h-full px-6 py-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-ds-text text-3xl font-bold">{t('candidats.index.title')}</h1>
                        <p className="text-ds-text2 mt-1 text-sm">{totalLabel}</p>
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
                        <Link
                            href={route('dashboard.candidats.create')}
                            className="bg-ds-accent flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90"
                        >
                            <Plus size={14} />
                            {t('candidats.index.actions.create')}
                        </Link>
                    </div>

                    {/* Skeleton while loading */}
                    {loading && <SkeletonTable cols={7} rows={8} />}

                    {/* Empty state */}
                    {!loading && candidats.data.length === 0 && (
                        <div className="border-ds-border bg-ds-surface flex flex-col items-center justify-center rounded-2xl border py-24 text-center">
                            <p className="text-ds-text text-[15px] font-semibold">{t('candidats.index.empty.title')}</p>
                            <p className="text-ds-text2 mt-1 text-[13px]">{t('candidats.index.empty.description')}</p>
                            <Link
                                href={route('dashboard.candidats.create')}
                                className="bg-ds-accent mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                            >
                                <Plus size={14} />
                                {t('candidats.index.actions.create')}
                            </Link>
                        </div>
                    )}

                    {/* Table */}
                    {!loading && candidats.data.length > 0 && (
                        <div className="border-ds-border bg-ds-surface overflow-hidden rounded-2xl border">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px] border-collapse text-[13px]">
                                    <thead>
                                        <tr className="border-ds-border border-b">
                                            {['CANDIDAT', 'POSTE ACTUEL', 'POSTE VISÉ', 'SOURCE'].map((col, i) => (
                                                <th
                                                    key={i}
                                                    className="text-ds-text3 px-5 py-3.5 text-left text-[10px] font-semibold tracking-[0.8px] uppercase"
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                            {SORTABLE_COLS.map(({ label, key }) => (
                                                <th
                                                    key={key}
                                                    onClick={() => handleSort(key)}
                                                    className="text-ds-text3 hover:text-ds-text cursor-pointer px-5 py-3.5 text-left text-[10px] font-semibold tracking-[0.8px] uppercase transition-colors select-none"
                                                >
                                                    <span className="flex items-center gap-1">
                                                        {label}
                                                        <SortIcon col={key} />
                                                    </span>
                                                </th>
                                            ))}
                                            {['STATUT', ''].map((col, i) => (
                                                <th
                                                    key={i}
                                                    className="text-ds-text3 px-5 py-3.5 text-left text-[10px] font-semibold tracking-[0.8px] uppercase"
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedData.map((candidat, index) => (
                                            <tr
                                                key={candidat.id}
                                                className="border-ds-border hover:bg-ds-bg3/40 border-b transition-colors last:border-0"
                                            >
                                                {/* CANDIDAT */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <CandidatAvatar name={candidat.full_name} index={index} photoUrl={candidat.profile_photo} />
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-ds-text max-w-[150px] truncate font-semibold">
                                                                    {candidat.full_name}
                                                                </p>
                                                                {candidat.linkedin_url && (
                                                                    <a
                                                                        href={safeUrl(candidat.linkedin_url)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="text-ds-text3 shrink-0 transition hover:text-[#818CF8]"
                                                                        title="Voir profil LinkedIn"
                                                                    >
                                                                        <ExternalLink size={12} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <p className="text-ds-text3 max-w-[150px] truncate text-[11px]">
                                                                {[
                                                                    candidat.location,
                                                                    candidat.experience_years != null ? `${candidat.experience_years} ans` : null,
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join(' · ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* POSTE ACTUEL */}
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <p className="text-ds-text max-w-[160px] truncate text-[12px] font-medium">
                                                            {candidat.current_title ?? '—'}
                                                        </p>
                                                        {candidat.current_company && (
                                                            <p className="text-ds-text3 max-w-[160px] truncate text-[11px]">
                                                                {candidat.current_company}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* POSTE VISÉ */}
                                                <td className="px-5 py-4">
                                                    <p className="text-ds-text2 max-w-[140px] truncate">{candidat.brief_title ?? '—'}</p>
                                                </td>

                                                {/* SOURCE */}
                                                <td className="px-5 py-4">
                                                    {candidat.source?.startsWith('sourcing_campaign') ? (
                                                        <div className="flex flex-col gap-1">
                                                            {candidat.source_context?.post_author ? (
                                                                <span className="inline-flex max-w-[160px] items-center truncate rounded-full border border-[#6C63FF]/25 bg-[#6C63FF]/10 px-2.5 py-1 text-[11px] font-semibold text-[#6C63FF]">
                                                                    <span className="truncate">{candidat.source_context.post_author}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded-full border border-[#6C63FF]/25 bg-[#6C63FF]/10 px-2.5 py-1 text-[11px] font-semibold text-[#6C63FF]">
                                                                    {t('candidats.index.columns.source_social_media')}
                                                                </span>
                                                            )}
                                                            {candidat.source_context?.post_url && (
                                                                <a
                                                                    href={safeUrl(candidat.source_context.post_url)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-ds-text3 inline-flex items-center gap-1 text-[11px] transition hover:text-[#6C63FF]"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        width="9"
                                                                        height="9"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        className="shrink-0"
                                                                    >
                                                                        <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                    </svg>
                                                                    Voir le post
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : candidat.source ? (
                                                        <span
                                                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${sourceStyle(candidat.source)}`}
                                                        >
                                                            {candidat.source}
                                                        </span>
                                                    ) : (
                                                        <span className="text-ds-text3">—</span>
                                                    )}
                                                </td>

                                                {/* SCORE SOURCING */}
                                                <td className="px-5 py-4">
                                                    {candidat.sourcing_score != null ? (
                                                        <span className={`text-[13px] font-bold ${scoreColor(candidat.sourcing_score)}`}>
                                                            {candidat.sourcing_score}
                                                        </span>
                                                    ) : (
                                                        <span className="text-ds-text3">—</span>
                                                    )}
                                                </td>

                                                {/* SCORE CV */}
                                                <td className="px-5 py-4">
                                                    {candidat.score_cv != null ? (
                                                        <span className={`text-[13px] font-bold ${scoreColor(candidat.score_cv)}`}>
                                                            {candidat.score_cv}
                                                        </span>
                                                    ) : (
                                                        <span className="text-ds-text3">—</span>
                                                    )}
                                                </td>

                                                {/* SCORE ENTRETIEN */}
                                                <td className="px-5 py-4">
                                                    {candidat.ai_score != null ? (
                                                        <span className={`text-[13px] font-bold ${scoreColor(candidat.ai_score)}`}>
                                                            {candidat.ai_score}
                                                        </span>
                                                    ) : (
                                                        <span className="text-ds-text3">—</span>
                                                    )}
                                                </td>

                                                {/* STATUT */}
                                                <td className="min-w-[160px] px-5 py-4">
                                                    {editingStatusId === candidat.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <select
                                                                autoFocus
                                                                value={pendingStatuses[candidat.id] ?? candidat.status}
                                                                onChange={(e) =>
                                                                    setPendingStatuses((prev) => ({ ...prev, [candidat.id]: e.target.value }))
                                                                }
                                                                className="border-ds-border bg-ds-bg text-ds-text focus:border-ds-accent rounded-lg border px-2 py-1 text-[11px] outline-none"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') confirmStatusChange(candidat);
                                                                    if (e.key === 'Escape') setEditingStatusId(null);
                                                                }}
                                                            >
                                                                {statusOptions.map((opt) => (
                                                                    <option key={opt.value} value={opt.value}>
                                                                        {opt.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={() => confirmStatusChange(candidat)}
                                                                className="text-[#34D399] transition hover:opacity-80"
                                                            >
                                                                <Check size={13} />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingStatusId(null)}
                                                                className="text-ds-text3 transition hover:opacity-80"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            {(() => {
                                                                const cfg = STATUS_CONFIG[candidat.status];
                                                                return (
                                                                    <span
                                                                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cfg?.className ?? 'bg-ds-bg3 text-ds-text2 border-ds-border'}`}
                                                                    >
                                                                        {statusLabel(candidat.status)}
                                                                    </span>
                                                                );
                                                            })()}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPendingStatuses((prev) => ({ ...prev, [candidat.id]: candidat.status }));
                                                                    setEditingStatusId(candidat.id);
                                                                }}
                                                                className="text-ds-text3 hover:text-ds-text2 transition"
                                                            >
                                                                <Pencil size={11} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* ACTIONS */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={route('dashboard.candidats.show', candidat.id)}
                                                            className="border-ds-border text-ds-text2 hover:border-ds-border2 hover:text-ds-text rounded-xl border px-3 py-1.5 text-[12px] transition"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={1.5}
                                                                stroke="currentColor"
                                                                className="size-4"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                                                />
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                                                />
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            onClick={() => enrichCandidate(candidat.id)}
                                                            className="border-ds-border text-ds-text2 hover:border-ds-border2 hover:text-ds-text rounded-xl border px-3 py-1.5 text-[12px] transition"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={1.5}
                                                                stroke="currentColor"
                                                                className="size-4"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                                                                />
                                                            </svg>
                                                        </button>
                                                        <Link
                                                            href={route('dashboard.candidats.historique', candidat.id)}
                                                            title="Historique des entretiens"
                                                            className="border-ds-border text-ds-text3 hover:border-ds-accent/40 hover:text-ds-accent flex h-7 w-7 items-center justify-center rounded-xl border transition"
                                                        >
                                                            <Clock size={12} />
                                                        </Link>
                                                        {candidat.brief_id && (
                                                            <button
                                                                onClick={() => handleSparkle(candidat)}
                                                                disabled={generatingId === candidat.id}
                                                                title={
                                                                    (analysisMap[candidat.id] ?? candidat.ai_analysis)
                                                                        ? 'Voir la synthèse IA'
                                                                        : 'Générer la synthèse IA'
                                                                }
                                                                className={`border-ds-border flex h-7 w-7 items-center justify-center rounded-xl border transition disabled:opacity-40 ${
                                                                    (analysisMap[candidat.id] ?? candidat.ai_analysis)
                                                                        ? 'text-ds-accent border-ds-accent/30'
                                                                        : 'text-ds-text3 hover:border-ds-accent/40 hover:text-ds-accent'
                                                                }`}
                                                            >
                                                                {generatingId === candidat.id ? (
                                                                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                                                        <circle
                                                                            className="opacity-25"
                                                                            cx="12"
                                                                            cy="12"
                                                                            r="10"
                                                                            stroke="currentColor"
                                                                            strokeWidth="4"
                                                                        />
                                                                        <path
                                                                            className="opacity-75"
                                                                            fill="currentColor"
                                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                                        />
                                                                    </svg>
                                                                ) : (
                                                                    <Sparkles size={12} />
                                                                )}
                                                            </button>
                                                        )}
                                                        {candidat.brief_id && (
                                                            <button
                                                                onClick={() => handleRescore(candidat)}
                                                                disabled={rescoringId === candidat.id}
                                                                title="Recalculer le score"
                                                                className="border-ds-border text-ds-text3 hover:border-ds-accent/40 hover:text-ds-accent flex h-7 w-7 items-center justify-center rounded-xl border transition disabled:opacity-40"
                                                            >
                                                                <RefreshCw size={12} className={rescoringId === candidat.id ? 'animate-spin' : ''} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="px-5 pb-4">
                                <Pagination meta={candidats} search={search} />
                            </div>
                        </div>
                    )}
                </div>

                {deletingCandidat && (
                    <DeleteModal
                        label={deletingCandidat.full_name}
                        i18nPrefix="candidats.index.modal"
                        onConfirm={handleDelete}
                        onCancel={() => setDeletingCandidat(null)}
                    />
                )}

                {analysisCandidat && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                        <div className="bg-ds-surface border-ds-border w-full max-w-xl overflow-hidden rounded-2xl border shadow-xl">
                            <div className="border-ds-border flex items-center justify-between border-b px-5 py-4">
                                <div>
                                    <h3 className="font-heading text-ds-text text-[14px] font-semibold">{analysisCandidat.full_name}</h3>
                                    <p className="text-ds-text3 mt-0.5 text-[12px]">
                                        {analysisCandidat.current_title ?? analysisCandidat.brief_title ?? '—'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAnalysisCandidat(null)}
                                    className="text-ds-text3 hover:text-ds-text flex h-7 w-7 items-center justify-center rounded-lg transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="max-h-[70vh] overflow-y-auto p-4">
                                <AiAnalysisPanel aiAnalysis={analysisMap[analysisCandidat.id] ?? analysisCandidat.ai_analysis} />
                            </div>
                        </div>
                    </div>
                )}
            </AppLayout>
        </>
    );
}
