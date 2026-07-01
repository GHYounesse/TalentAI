import FilterPanel, { FilterEntry } from '@/components/ui/FilterPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/hooks/useI18n';
import AppLayout from '@/layouts/app-layout';
import { safeUrl } from '@/lib/utils';
import { Head, router, usePage } from '@inertiajs/react';
import { Download, FileSearch, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Brief {
    id: number;
    title: string;
    required_skills: string;
}

interface Analysis {
    id: number;
    score_global: number | null;
    ai_summary: string | null;
    ai_summary_en: string | null;
    ai_tags: string[] | null;
    cv_file_path: string;
    candidate: { full_name: string } | null;
    brief: Brief | null;
    extracted_text: { technical_skills: string[] };
}

interface PageFilters {
    search?: string;
    brief_id?: string;
}

interface PageProps {
    analyses: Analysis[];
    briefs: Brief[];
    filters: PageFilters;
}

const AVATAR_GRADIENTS = [
    'from-[#6C63FF] to-[#38BDF8]',
    'from-[#22D3EE] to-[#34D399]',
    'from-[#F59E0B] to-[#F87171]',
    'from-[#EC4899] to-[#818CF8]',
    'from-[#38BDF8] to-[#6C63FF]',
    'from-[#34D399] to-[#22D3EE]',
];

const RANK_COLORS = ['text-[#34D399]', 'text-[#818CF8]', 'text-[#22D3EE]'];

function rankColor(index: number) {
    return RANK_COLORS[index] ?? 'text-ds-text3';
}

function getScoreColor(score: number) {
    if (score >= 80) return 'text-[#34D399]';
    if (score >= 60) return 'text-[#F59E0B]';
    return 'text-[#F87171]';
}

function initials(name: string) {
    return name
        ?.split(' ')
        ?.slice(0, 2)
        ?.map((w: string) => w[0])
        ?.join('')
        ?.toUpperCase();
}

const SUMMARY_LIMIT = 120;

export default function Index() {
    const { analyses, briefs, filters } = usePage().props as unknown as PageProps;
    const { t } = useI18n();
    const [selected, setSelected] = useState<Analysis | null>(analyses?.[0] ?? null);
    const [lang, setLang] = useState('fr');
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterEntry[]>(Array.isArray(filters) ? filters : []);

    const FILTER_FIELDS = [
        { key: 'full_name', label: t('candidats.index.filters.full_name'), type: 'text' as const },
        { key: 'score', label: t('briefs.classement.filters.score'), type: 'number' as const },
        { key: 'extracted_text.technical_skills', label: t('briefs.classement.filters.skills'), type: 'text' as const },
        {
            key: 'brief',
            label: t('briefs.classement.filters.brief'),
            type: 'select' as const,
            options: briefs.map((b) => ({ value: String(b.id), label: b.title })),
        },
    ];

    function handleSearch(filtersOverride?: FilterEntry[]) {
        const toSearch = filtersOverride ?? activeFilters;
        const cleanFilters = toSearch
            .filter((f) => (Array.isArray(f.value) ? f.value.length > 0 : f.value && String(f.value).trim() !== ''))
            .map((f) => ({ field: f.field, value: Array.isArray(f.value) ? f.value.join(',') : f.value }));

        router.get(
            route('dashboard.cv-analysis.index'),
            { filters: JSON.stringify(cleanFilters) },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
                onSuccess: (page) => {
                    const count = (page.props as { analyses?: unknown[] }).analyses?.length ?? 0;
                    toast.success(`${count} analyse${count !== 1 ? 's' : ''} trouvée${count !== 1 ? 's' : ''}`);
                },
                onError: () => toast.error('Erreur lors de la recherche'),
            },
        );
    }

    function handleSelect(item: Analysis) {
        setSelected(item);
        setExpanded(false);
    }

    const selectedIndex = analyses?.findIndex((a) => a.id === selected?.id) ?? -1;

    const parsedTags = useMemo(() => {
        if (!selected?.ai_tags) return [];
        if (Array.isArray(selected.ai_tags)) return selected.ai_tags;
        return [];
    }, [selected]);

    const aiSummary = lang === 'fr' ? (selected?.ai_summary ?? null) : (selected?.ai_summary_en ?? null);
    const isTruncatable = aiSummary !== null && aiSummary.length > SUMMARY_LIMIT;
    const displayedSummary = aiSummary === null ? null : !expanded && isTruncatable ? aiSummary.slice(0, SUMMARY_LIMIT).trimEnd() + '…' : aiSummary;

    return (
        <>
            <Head title="CV Analyses" />
            <AppLayout>
                <div className="bg-ds-bg text-ds-text min-h-screen p-6">
                    {/* HEADER */}
                    <div className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-ds-text3 text-xs">Recruitment › CV Analysis</p>
                            <h1 className="mt-1 text-3xl font-bold">Analyses CV IA</h1>
                            {analyses?.length > 0 && (
                                <p className="text-ds-text2 mt-1.5 text-sm">
                                    {analyses.length} analyse{analyses.length > 1 ? 's' : ''} · Triées par score global
                                </p>
                            )}
                            <div className="py-3">
                                <FilterPanel
                                    fields={FILTER_FIELDS}
                                    activeFilters={activeFilters}
                                    onChange={setActiveFilters}
                                    onSearch={handleSearch}
                                    loading={loading}
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => router.get(route('dashboard.cv-analysis.create'))}
                            className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#6C63FF] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            <Plus size={16} />
                            Nouvelle Analyse
                        </button>
                    </div>

                    {/* Skeleton while loading */}
                    {loading && (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="border-ds-border bg-ds-surface rounded-2xl border p-5">
                                    <div className="mb-3 flex items-center gap-3">
                                        <Skeleton className="bg-ds-bg3 h-9 w-9 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="bg-ds-bg3 h-3 w-3/4" />
                                            <Skeleton className="bg-ds-bg3 h-2.5 w-1/2" />
                                        </div>
                                        <Skeleton className="bg-ds-bg3 h-8 w-14 rounded-full" />
                                    </div>
                                    <Skeleton className="bg-ds-bg3 h-2 w-full rounded-full" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* EMPTY */}
                    {!loading && (!analyses || analyses.length === 0) && (
                        <div className="border-ds-border bg-ds-surface flex flex-col items-center justify-center rounded-3xl border py-28 text-center">
                            <FileSearch size={60} className="text-ds-text3 mb-4" />
                            <h2 className="text-xl font-bold">Aucun résultat</h2>
                            <p className="text-ds-text2 mt-2 text-sm">Aucun candidat trouvé.</p>
                        </div>
                    )}

                    {/* CONTENT */}
                    {!loading && analyses?.length > 0 && (
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                            {/* ── LIST ── */}
                            <div className="space-y-3 lg:col-span-2">
                                {analyses.map((item: Analysis, index: number) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-150 ${
                                            selected?.id === item.id
                                                ? 'border-[#6C63FF]/60 bg-[#6C63FF]/10 shadow-[0_0_0_1px_rgba(108,99,255,0.3)]'
                                                : 'border-ds-border bg-ds-surface hover:border-ds-border2 hover:bg-ds-bg3'
                                        }`}
                                    >
                                        {/* rank badge */}
                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                                                index === 0
                                                    ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                                                    : index === 1
                                                      ? 'text-ds-text2 bg-white/8'
                                                      : index === 2
                                                        ? 'bg-[#cd7f32]/15 text-[#cd7f32]'
                                                        : 'bg-ds-bg3 text-ds-text3'
                                            }`}
                                        >
                                            {index + 1}
                                        </div>

                                        {/* avatar */}
                                        <div
                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${
                                                AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                                            }`}
                                        >
                                            {initials(item.candidate?.full_name ?? 'U')}
                                        </div>

                                        {/* info */}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-ds-text text-[15px] font-semibold">{item.candidate?.full_name}</p>
                                            <p className="text-ds-text2 mt-0.5 text-xs">{item.brief?.title}</p>
                                            {parsedTags.length > 0 && selected?.id === item.id
                                                ? null
                                                : item.ai_tags &&
                                                  item.ai_tags.length > 0 && (
                                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                                          {item.ai_tags.slice(0, 4).map((tag: string) => (
                                                              <span
                                                                  key={tag}
                                                                  className="border-ds-border bg-ds-bg3 text-ds-text2 rounded-md border px-2 py-0.5 text-[11px]"
                                                              >
                                                                  {tag}
                                                              </span>
                                                          ))}
                                                      </div>
                                                  )}
                                            {(!item.ai_tags || item.ai_tags.length === 0) && item.extracted_text?.technical_skills?.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {item.extracted_text.technical_skills.slice(0, 4).map((s: string) => (
                                                        <span
                                                            key={s}
                                                            className="border-ds-border bg-ds-bg3 text-ds-text2 rounded-md border px-2 py-0.5 text-[11px]"
                                                        >
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* score */}
                                        <div className="shrink-0 text-right">
                                            <span
                                                className={`text-xl leading-none font-bold ${rankColor(index)}`}
                                                style={{ fontFamily: 'var(--font-heading)' }}
                                            >
                                                {item.score_global ?? 0}
                                            </span>
                                            <p className="text-ds-text3 mt-0.5 text-[11px]">/100</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── DETAIL PANEL ── */}
                            {selected && (
                                <div className="flex flex-col gap-4">
                                    {/* Card 1: score + meta */}
                                    <div className="border-ds-border bg-ds-surface rounded-2xl border p-5">
                                        <div className="border-ds-border border-b pb-4 text-center">
                                            <div
                                                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white ${
                                                    AVATAR_GRADIENTS[selectedIndex % AVATAR_GRADIENTS.length]
                                                }`}
                                            >
                                                {initials(selected.candidate?.full_name ?? '')}
                                            </div>

                                            <h2 className="text-ds-text mt-2.5 text-base font-bold">{selected.candidate?.full_name}</h2>

                                            <p className="text-ds-text2 mt-0.5 text-xs">{selected.brief?.title}</p>

                                            {(selected.score_global ?? 0) >= 70 && (
                                                <div className="mt-2.5 flex justify-center">
                                                    <span className="rounded-full border border-[#34D399]/40 bg-[#34D399]/20 px-3 py-1 text-xs font-semibold text-[#34D399]">
                                                        Top match
                                                    </span>
                                                </div>
                                            )}

                                            <p
                                                className={`mt-3 leading-none font-extrabold ${getScoreColor(selected.score_global ?? 0)}`}
                                                style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem' }}
                                            >
                                                {selected.score_global ?? 0}
                                            </p>
                                            <p className="text-ds-text3 mt-1 text-xs">/100 · Score IA global</p>
                                        </div>

                                        {/* skills tags */}
                                        {parsedTags.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-1.5">
                                                {parsedTags.map((tag: string) => (
                                                    <span
                                                        key={tag}
                                                        className="border-ds-border bg-ds-bg3 text-ds-text2 rounded-md border px-2.5 py-1 text-xs"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card 2: Analyse IA */}
                                    <div className="border-ds-border bg-ds-surface rounded-2xl border p-5">
                                        <h3 className="text-ds-text text-base font-bold">Analyse IA</h3>
                                        {displayedSummary === null ? (
                                            <p className="text-ds-text3 mt-2 text-sm">—</p>
                                        ) : (
                                            <>
                                                <p className="text-ds-text2 mt-2 text-sm leading-relaxed">{displayedSummary}</p>
                                                {isTruncatable && (
                                                    <button
                                                        onClick={() => setExpanded((v) => !v)}
                                                        className="text-ds-accent mt-1.5 text-xs font-medium hover:underline"
                                                    >
                                                        {expanded ? 'Réduire' : 'Lire plus'}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        <button
                                            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                                            className="mt-4 block text-xs text-indigo-400 hover:underline"
                                        >
                                            {lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
                                        </button>
                                    </div>

                                    {/* actions */}
                                    <a
                                        href={safeUrl(selected.cv_file_path)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-ds-accent flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                                    >
                                        <Download size={14} />
                                        Voir CV
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </AppLayout>
        </>
    );
}
