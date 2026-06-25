import AiAnalysisPanel from '@/components/Candidats/AiAnalysisPanel';
import FilterPanel, { FilterEntry } from '@/components/ui/FilterPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/hooks/useI18n';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Award, Download, LayoutGrid, LayoutList, Phone, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Brief {
    id: number;
    title: string;
}

interface ScoreBreakdown {
    experience?: number;
    education?: number;
    sector?: number;
    soft_skills?: number;
    location?: number;
    required_skills?: number;
    [key: string]: number | undefined;
}

interface Candidate {
    id: number;
    name: string;
    role: string | null;
    company: string | null;
    location: string | null;
    experience_years: number | null;
    linkedin_url: string | null;
    skills: string[];
    ai_analysis: string | null;
    score: number;
    score_breakdown: ScoreBreakdown | null;
    profile_photo: string | null;
}

interface Props {
    briefs: Brief[];
    selectedBriefId: number | null;
    candidates: Candidate[];
    filters?: { field: string; value: string }[] | null;
}

const BREAKDOWN_META: Record<string, { label: string; bar: string; text: string }> = {
    experience: { label: 'Expérience', bar: 'bg-[#34D399]', text: 'text-[#34D399]' },
    education: { label: 'Formation', bar: 'bg-[#818CF8]', text: 'text-[#818CF8]' },
    sector: { label: 'Secteur', bar: 'bg-[#22D3EE]', text: 'text-[#22D3EE]' },
    soft_skills: { label: 'Leadership', bar: 'bg-[#F59E0B]', text: 'text-[#F59E0B]' },
    location: { label: 'Localisation', bar: 'bg-ds-text3', text: 'text-ds-text2' },
    required_skills: { label: 'Compétences', bar: 'bg-[#F87171]', text: 'text-[#F87171]' },
};

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

function initials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

interface AvatarProps {
    candidate: Candidate;
    index: number;
    size?: 'sm' | 'md' | 'lg';
}

function Avatar({ candidate, index, size = 'md' }: AvatarProps) {
    const sizeClass = size === 'sm' ? 'h-9 w-9 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-11 w-11 text-sm';

    if (candidate.profile_photo) {
        return (
            <img
                src={candidate.profile_photo}
                alt={candidate.name}
                className={`${sizeClass} shrink-0 rounded-full object-cover`}
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
            />
        );
    }

    return (
        <div
            className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${
                AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
            }`}
        >
            {initials(candidate.name)}
        </div>
    );
}

interface DetailPanelProps {
    selected: Candidate;
    selectedIndex: number;
    onClose?: () => void;
}

function DetailPanel({ selected, selectedIndex, onClose }: DetailPanelProps) {
    const breakdown = selected.score_breakdown ? Object.entries(selected.score_breakdown).filter(([, v]) => v !== undefined && v !== null) : [];

    return (
        <div className="flex flex-col gap-4">
            {/* Card 1: score + breakdown + actions */}
            <div className="border-ds-border bg-ds-surface rounded-2xl border p-5">
                {onClose && (
                    <div className="mb-3 flex justify-end">
                        <button onClick={onClose} className="text-ds-text3 hover:text-ds-text rounded-lg p-1 transition">
                            <X size={16} />
                        </button>
                    </div>
                )}
                <div className="border-ds-border border-b pb-4 text-center">
                    <div className="flex justify-center">
                        <Avatar candidate={selected} index={selectedIndex} size="lg" />
                    </div>

                    <h2 className="text-ds-text mt-2.5 text-base font-bold">{selected.name}</h2>

                    <p className="text-ds-text2 mt-0.5 text-center text-xs">{[selected.role, selected.company].filter(Boolean).join(' · ')}</p>

                    <div className="mt-2.5 flex justify-center gap-2">
                        {selected.linkedin_url && (
                            <a
                                href={selected.linkedin_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-[#5b9bd5]/40 bg-[#5b9bd5]/15 px-3 py-1 text-xs font-medium text-[#5b9bd5]"
                            >
                                LinkedIn
                            </a>
                        )}
                        {selectedIndex === 0 && (
                            <span className="rounded-full border border-[#34D399]/40 bg-[#34D399]/20 px-3 py-1 text-xs font-semibold text-[#34D399]">
                                Top match
                            </span>
                        )}
                    </div>

                    <p
                        className={`mt-3 leading-none font-extrabold ${rankColor(selectedIndex)}`}
                        style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem' }}
                    >
                        {selected.score}
                    </p>
                    <p className="text-ds-text3 mt-1 text-xs">/100 · Score IA global</p>
                </div>

                {/* breakdown bars */}
                {breakdown.length > 0 && (
                    <div className="mt-4 space-y-2.5">
                        {breakdown.map(([key, value = 0]) => {
                            const meta = BREAKDOWN_META[key] ?? {
                                label: key,
                                bar: 'bg-ds-accent',
                                text: 'text-ds-accent',
                            };
                            return (
                                <div key={key} className="flex items-center gap-3">
                                    <span className="text-ds-text2 w-24 shrink-0 text-xs">{meta.label}</span>
                                    <div className="bg-ds-bg3 h-2 flex-1 overflow-hidden rounded-full">
                                        <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${Math.round(value)}%` }} />
                                    </div>
                                    <span className={`w-8 shrink-0 text-right text-sm font-bold ${meta.text}`}>{Math.round(value)}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Card 2: Synthèse IA */}
            <AiAnalysisPanel aiAnalysis={selected.ai_analysis} />

            {/* Skills */}
            {selected.skills.length > 0 && (
                <div className="border-ds-border bg-ds-surface rounded-2xl border p-5">
                    <p className="text-ds-text3 mb-2 text-[10px] font-semibold tracking-[0.7px] uppercase">Compétences</p>
                    <div className="flex flex-wrap gap-1.5">
                        {selected.skills.map((s) => (
                            <span key={s} className="border-ds-border bg-ds-bg3 text-ds-text2 rounded-md border px-2.5 py-1 text-xs">
                                {s}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <button className="bg-ds-accent flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                <Phone size={14} />
                Planifier entretien
            </button>
            <button className="border-ds-border text-ds-text2 hover:bg-ds-bg3 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm transition">
                <Download size={14} />
                Télécharger fiche
            </button>
        </div>
    );
}

export default function ClassementIndex({ briefs, selectedBriefId, candidates, filters }: Props) {
    const { t } = useI18n();
    const [selected, setSelected] = useState<Candidate | null>(candidates[0] ?? null);
    const [loading, setLoading] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterEntry[]>(Array.isArray(filters) ? filters : []);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [listPanelOpen, setListPanelOpen] = useState(false);

    const currentBrief = briefs.find((b) => b.id === selectedBriefId) ?? null;

    const FILTER_FIELDS = [
        { key: 'full_name', label: t('candidats.index.filters.full_name'), type: 'text' as const },
        { key: 'score', label: t('briefs.classement.filters.score'), type: 'number' as const },
        { key: 'skills', label: t('briefs.classement.filters.skills'), type: 'text' as const },
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
            route('dashboard.classement'),
            {
                brief_id: cleanFilters.find((f) => f.field === 'brief')?.value || selectedBriefId,
                filters: JSON.stringify(cleanFilters),
            },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
                onSuccess: (page) => {
                    const count = (page.props as { candidates?: unknown[] }).candidates?.length ?? 0;
                    toast.success(`${count} candidat${count !== 1 ? 's' : ''} trouvé${count !== 1 ? 's' : ''}`);
                },
                onError: () => toast.error('Erreur lors de la recherche'),
            },
        );
    }

    function handleSelect(c: Candidate) {
        setSelected(c);
        if (viewMode === 'list') {
            setListPanelOpen(true);
        }
    }

    function handleClosePanel() {
        setListPanelOpen(false);
    }

    const selectedIndex = candidates.findIndex((c) => c.id === selected?.id);

    return (
        <>
            <Head title="Classements IA" />
            <AppLayout>
                <div className="bg-ds-bg text-ds-text min-h-screen p-6">
                    {/* HEADER */}
                    <div className="mb-5">
                        <p className="text-ds-text3 text-xs">Candidats &rsaquo; Classement IA</p>

                        <div className="mt-1 flex items-center justify-between gap-4">
                            <h1 className="text-ds-text text-3xl font-bold">
                                {currentBrief ? `Classement IA · ${currentBrief.title}` : 'Classements IA'}
                            </h1>

                            {/* View toggle */}
                            <div className="border-ds-border bg-ds-surface flex shrink-0 items-center gap-1 rounded-xl border p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`rounded-lg p-1.5 transition ${
                                        viewMode === 'list' ? 'bg-ds-accent/20 text-ds-accent' : 'text-ds-text3 hover:text-ds-text2'
                                    }`}
                                    title="Vue liste"
                                >
                                    <LayoutList size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`rounded-lg p-1.5 transition ${
                                        viewMode === 'grid' ? 'bg-ds-accent/20 text-ds-accent' : 'text-ds-text3 hover:text-ds-text2'
                                    }`}
                                    title="Vue grille"
                                >
                                    <LayoutGrid size={16} />
                                </button>
                            </div>
                        </div>

                        {candidates.length > 0 && (
                            <p className="text-ds-text2 mt-1.5 text-sm">
                                {candidates.length} candidat{candidates.length > 1 ? 's' : ''} analysé
                                {candidates.length > 1 ? 's' : ''} · Triés par score de correspondance global
                            </p>
                        )}

                        {/* FILTERS */}
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

                    {/* EMPTY STATE */}
                    {!loading && candidates.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-28 text-center">
                            <Award size={52} className="text-ds-text3 mb-4" />
                            <h2 className="text-ds-text text-lg font-semibold">Aucun candidat classé</h2>
                            <p className="text-ds-text2 mt-1 max-w-xs text-sm">
                                {currentBrief
                                    ? "Lancez un sourcing pour ce brief afin d'obtenir un classement IA."
                                    : 'Sélectionnez un brief pour voir le classement IA des candidats.'}
                            </p>
                        </div>
                    )}

                    {/* ── GRID VIEW ── */}
                    {!loading && candidates.length > 0 && viewMode === 'grid' && (
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                            {/* candidate list */}
                            <div className="space-y-3 lg:col-span-2">
                                {candidates.map((c, index) => (
                                    <div
                                        key={c.id}
                                        onClick={() => handleSelect(c)}
                                        className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-150 ${
                                            selected?.id === c.id
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

                                        <Avatar candidate={c} index={index} size="md" />

                                        {/* info */}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-ds-text text-[15px] font-semibold">{c.name}</p>
                                            <p className="text-ds-text2 mt-0.5 text-xs">
                                                {[c.role, c.company, c.experience_years ? `${c.experience_years} ans` : null]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </p>
                                            {c.skills.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {c.skills.slice(0, 4).map((s) => (
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
                                                {c.score}
                                            </span>
                                            <p className="text-ds-text3 mt-0.5 text-[11px]">/100</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* detail panel */}
                            {selected && (
                                <div>
                                    <DetailPanel selected={selected} selectedIndex={selectedIndex} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── LIST VIEW ── */}
                    {!loading && candidates.length > 0 && viewMode === 'list' && (
                        <div className={`flex gap-5 ${listPanelOpen ? 'items-start' : ''}`}>
                            {/* table */}
                            <div
                                className={`${listPanelOpen ? 'min-w-0 flex-1' : 'w-full'} border-ds-border bg-ds-surface overflow-x-auto rounded-2xl border`}
                            >
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-ds-border border-b">
                                            <th className="text-ds-text3 px-4 py-3 text-left text-[11px] font-semibold tracking-wider uppercase">
                                                #
                                            </th>
                                            <th className="text-ds-text3 px-4 py-3 text-left text-[11px] font-semibold tracking-wider uppercase">
                                                Candidat
                                            </th>
                                            <th className="text-ds-text3 px-4 py-3 text-left text-[11px] font-semibold tracking-wider uppercase">
                                                Poste
                                            </th>
                                            <th className="text-ds-text3 px-4 py-3 text-left text-[11px] font-semibold tracking-wider uppercase">
                                                Compétences
                                            </th>
                                            <th className="text-ds-text3 px-4 py-3 text-left text-[11px] font-semibold tracking-wider uppercase">
                                                Localisation
                                            </th>
                                            <th className="text-ds-text3 px-4 py-3 text-right text-[11px] font-semibold tracking-wider uppercase">
                                                Score
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {candidates.map((c, index) => (
                                            <tr
                                                key={c.id}
                                                onClick={() => handleSelect(c)}
                                                className={`border-ds-border cursor-pointer border-b transition-colors last:border-0 ${
                                                    selected?.id === c.id && listPanelOpen ? 'bg-[#6C63FF]/10' : 'hover:bg-ds-bg3'
                                                }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <div
                                                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
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
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar candidate={c} index={index} size="sm" />
                                                        <div className="min-w-0">
                                                            <p className="text-ds-text truncate font-semibold">{c.name}</p>
                                                            {c.company && <p className="text-ds-text3 truncate text-xs">{c.company}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-ds-text2 px-4 py-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs">{c.role ?? '—'}</p>
                                                        {c.experience_years && <p className="text-ds-text3 text-xs">{c.experience_years} ans</p>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {c.skills.slice(0, 3).map((s) => (
                                                            <span
                                                                key={s}
                                                                className="border-ds-border bg-ds-bg3 text-ds-text2 rounded border px-1.5 py-0.5 text-[10px]"
                                                            >
                                                                {s}
                                                            </span>
                                                        ))}
                                                        {c.skills.length > 3 && (
                                                            <span className="text-ds-text3 text-[10px]">+{c.skills.length - 3}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-ds-text2 px-4 py-3 text-xs">{c.location ?? '—'}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span
                                                        className={`text-base font-bold ${rankColor(index)}`}
                                                        style={{ fontFamily: 'var(--font-heading)' }}
                                                    >
                                                        {c.score}
                                                    </span>
                                                    <p className="text-ds-text3 text-[10px]">/100</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* side panel — slides in when a row is clicked */}
                            {listPanelOpen && selected && (
                                <div className="w-80 shrink-0">
                                    <DetailPanel selected={selected} selectedIndex={selectedIndex} onClose={handleClosePanel} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </AppLayout>
        </>
    );
}
