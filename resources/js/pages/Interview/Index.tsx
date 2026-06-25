import FilterPanel, { FilterEntry } from '@/components/ui/FilterPanel';
import { PLATFORMS, STATUSES } from '@/constants/interviews';
import { useI18n } from '@/hooks/useI18n';
import AppLayout from '@/layouts/app-layout';
import { IndexInterviewsProps } from '@/types/interviews';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Mic, SearchX } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import InterviewIndexRow from './components/InterviewIndexRow';

/* ── Skeleton row ────────────────────────────────────────────────────── */
function SkeletonRow() {
    return (
        <tr className="border-ds-border border-b last:border-0">
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="bg-ds-surface2 h-8 w-8 animate-pulse rounded-full" />
                    <div className="bg-ds-surface2 h-3.5 w-28 animate-pulse rounded-md" />
                </div>
            </td>
            <td className="px-4 py-3.5">
                <div className="bg-ds-surface2 h-3 w-40 animate-pulse rounded-md" />
            </td>
            <td className="px-4 py-3.5">
                <div className="bg-ds-surface2 h-3 w-20 animate-pulse rounded-md" />
            </td>
            <td className="px-4 py-3.5">
                <div className="bg-ds-surface2 h-3 w-14 animate-pulse rounded-md" />
            </td>
            <td className="px-4 py-3.5">
                <div className="bg-ds-surface2 h-3 w-12 animate-pulse rounded-md" />
            </td>
            <td className="px-4 py-3.5">
                <div className="bg-ds-surface2 h-6 w-24 animate-pulse rounded-full" />
            </td>
            <td className="px-4 py-3.5 text-right">
                <div className="bg-ds-surface2 ml-auto h-7 w-20 animate-pulse rounded-lg" />
            </td>
        </tr>
    );
}

/* ── Pagination ──────────────────────────────────────────────────────── */
function Pagination({ current, last, onNavigate }: { current: number; last: number; onNavigate: (p: number) => void }) {
    const { t } = useI18n();

    const pages = useMemo(() => {
        const result: (number | '…')[] = [];
        if (last <= 7) {
            for (let i = 1; i <= last; i++) result.push(i);
        } else {
            result.push(1);
            if (current > 3) result.push('…');
            for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) result.push(i);
            if (current < last - 2) result.push('…');
            result.push(last);
        }
        return result;
    }, [current, last]);

    const btnBase = 'flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-[12px] font-medium transition border';

    return (
        <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-ds-text3 text-[12px]">{t('interviews.list.pagination.summary', { current, last })}</p>

            <div className="flex items-center gap-1.5">
                <button
                    disabled={current === 1}
                    onClick={() => onNavigate(current - 1)}
                    className={`${btnBase} border-ds-border text-ds-text2 hover:bg-ds-surface disabled:opacity-40`}
                >
                    <ChevronLeft size={13} />
                </button>

                {pages.map((p, i) =>
                    p === '…' ? (
                        <span key={`ellipsis-${i}`} className="text-ds-text3 px-1 text-[12px]">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onNavigate(p as number)}
                            className={`${btnBase} ${
                                p === current
                                    ? 'border-ds-accent bg-ds-accent/10 text-ds-accent font-semibold'
                                    : 'border-ds-border text-ds-text2 hover:bg-ds-surface'
                            }`}
                        >
                            {p}
                        </button>
                    ),
                )}

                <button
                    disabled={current === last}
                    onClick={() => onNavigate(current + 1)}
                    className={`${btnBase} border-ds-border text-ds-text2 hover:bg-ds-surface disabled:opacity-40`}
                >
                    <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}

/* ── Table header cell ───────────────────────────────────────────────── */
function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
    return (
        <th
            className={`text-ds-text3 border-ds-border border-b px-4 py-2.5 text-[11px] font-semibold tracking-wider uppercase ${right ? 'text-right' : 'text-left'}`}
        >
            {children}
        </th>
    );
}

/* ── Page ────────────────────────────────────────────────────────────── */
type Props = IndexInterviewsProps;

export default function Index({ interviews, filters = [] }: Props) {
    const { t } = useI18n();
    const { data, current_page, last_page } = interviews;

    const [activeFilters, setActiveFilters] = useState<FilterEntry[]>(filters);
    const [loading, setLoading] = useState(false);

    const FILTER_FIELDS = [
        { key: 'candidate', label: 'Candidate', type: 'text' as const },
        { key: 'brief', label: 'Brief', type: 'text' as const },
        { key: 'recruiter_notes', label: 'Recruiter Notes', type: 'text' as const },
        {
            key: 'status',
            label: t('interviews.list.filters.status'),
            type: 'select' as const,
            options: STATUSES.filter((s) => s !== 'none').map((s) => ({
                value: s,
                label: t(`interviews.list.status.${s}`),
            })),
        },
        {
            key: 'platform',
            label: t('interviews.list.filters.platform'),
            type: 'select' as const,
            options: PLATFORMS.map((p) => ({
                value: p,
                label: t(`interviews.list.platforms.${p}`),
            })),
        },
    ];

    const hasFilters = activeFilters.some((f) => f.value && String(f.value).trim() !== '');

    const clearFilters = useCallback(() => {
        setActiveFilters([]);
        router.get('/dashboard/interviews', { page: 1 });
    }, []);

    function handleSearch(filtersOverride?: FilterEntry[]) {
        const toSearch = filtersOverride ?? activeFilters;
        const cleanFilters = toSearch.filter((f) => f.value && String(f.value).trim() !== '').map((f) => ({ field: f.field, value: f.value }));

        router.get(
            '/dashboard/interviews',
            { filters: JSON.stringify(cleanFilters), page: 1 },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
                onError: () => toast.error('Erreur lors du filtrage'),
            },
        );
    }

    const navigate = useCallback(
        (page: number) => {
            router.get('/dashboard/interviews', { page, filters: JSON.stringify(activeFilters) }, { preserveScroll: true });
        },
        [activeFilters],
    );

    const filtered = useMemo(() => {
        const search = activeFilters.find((f) => f.field === 'search')?.value ?? '';
        const status = activeFilters.find((f) => f.field === 'status')?.value ?? '';
        const platform = activeFilters.find((f) => f.field === 'platform')?.value ?? '';
        const recruiterNotes = activeFilters.find((f) => f.field === 'recruiter_notes')?.value ?? '';

        return data.filter((i) => {
            const matchSearch =
                !search ||
                i.candidate_name.toLowerCase().includes(String(search).toLowerCase()) ||
                i.brief_title.toLowerCase().includes(String(search).toLowerCase());
            const matchStatus = !status || i.transcription_status === status;
            const matchPlatform = !platform || i.platform === platform;
            const matchRecruiterNotes = !recruiterNotes || i.recruiter_notes?.toLowerCase().includes(String(recruiterNotes).toLowerCase());
            return matchSearch && matchStatus && matchPlatform && matchRecruiterNotes;
        });
    }, [data, activeFilters]);

    const isEmpty = !loading && filtered.length === 0;

    return (
        <>
            <Head title={t('interviews.list.title')} />

            <AppLayout>
                <div className="bg-ds-bg min-h-full px-6 py-8">
                    {/* HEADER */}
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="font-heading text-ds-text text-[26px] font-bold">{t('interviews.list.title')}</h1>
                            <p className="text-ds-text2 mt-1 text-[14px]">{t('interviews.list.subtitle')}</p>
                        </div>

                        <Link
                            href="/dashboard/interviews/create"
                            className="bg-ds-accent rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#7C74FF]"
                        >
                            {t('interviews.list.new')}
                        </Link>
                    </div>

                    {/* FILTERS */}
                    <div className="mb-4">
                        <FilterPanel
                            fields={FILTER_FIELDS}
                            activeFilters={activeFilters}
                            onChange={setActiveFilters}
                            onSearch={handleSearch}
                            loading={loading}
                        />
                    </div>

                    {/* TABLE */}
                    <div className="border-ds-border bg-ds-surface overflow-hidden rounded-2xl border">
                        <table className="w-full border-collapse">
                            <thead className="bg-ds-bg/50">
                                <tr>
                                    <Th>{t('interviews.list.columns.candidate')}</Th>
                                    <Th>{t('interviews.list.columns.brief')}</Th>
                                    <Th>{t('interviews.list.columns.date')}</Th>
                                    <Th>{t('interviews.list.columns.platform')}</Th>
                                    <Th>{t('interviews.list.columns.duration')}</Th>
                                    <Th>{t('interviews.list.columns.status')}</Th>
                                    <Th right>{t('interviews.list.columns.actions')}</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading
                                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                                    : isEmpty
                                      ? null
                                      : filtered.map((interview) => <InterviewIndexRow key={interview.id} interview={interview} />)}
                            </tbody>
                        </table>

                        {/* Empty state inside table card */}
                        {isEmpty && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="bg-ds-bg mb-3 flex h-14 w-14 items-center justify-center rounded-full">
                                    {hasFilters ? <SearchX size={24} className="text-ds-text3" /> : <Mic size={24} className="text-ds-text3" />}
                                </div>
                                <p className="text-ds-text text-[14px] font-semibold">
                                    {hasFilters ? t('interviews.list.empty.no_results') : t('interviews.list.empty.title')}
                                </p>
                                {!hasFilters && <p className="text-ds-text2 mt-1 text-[13px]">{t('interviews.list.empty.description')}</p>}
                                {hasFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-ds-accent mt-3 text-[13px] underline underline-offset-2 transition hover:opacity-75"
                                    >
                                        {t('interviews.list.filters.clear')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* PAGINATION */}
                    {last_page > 1 && !loading && <Pagination current={current_page} last={last_page} onNavigate={navigate} />}
                </div>
            </AppLayout>
        </>
    );
}
