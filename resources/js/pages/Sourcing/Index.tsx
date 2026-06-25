import CandidateTable from '@/components/Candidats/CandidatsTable';
import AppLayout from '@/layouts/app-layout';
import { Candidat } from '@/types/candidat';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Briefcase, Clock, RefreshCw, Search, Sparkles, WandSparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Select from 'react-select';

dayjs.extend(relativeTime);
dayjs.locale('fr');

interface Brief {
    id: number;
    title: string;
    search_prompt: string | null;
    current_query: string | null;
    next_start_page: number;
}

interface QueryHistoryEntry {
    id: number;
    query: string;
    created_at: string;
}

interface Props {
    briefs: Brief[];
    filters: { brief_id?: number };
}

interface RunState {
    run_id: number;
    status: 'pending' | 'running' | 'paused' | 'succeeded' | 'failed';
    candidates_imported: number;
    total_items: number | null;
    dataset_offset: number;
    created_at: string | null;
    paused_at: string | null;
}

type Phase = 'idle' | 'ready' | 'launching' | 'streaming' | 'done' | 'failed';

// ---------------------------------------------------------------------------
// Step loader
// ---------------------------------------------------------------------------

const STEPS = [
    { label: 'Connexion LinkedIn', sublabel: 'Initialisation du scraping' },
    { label: 'Analyse des profils', sublabel: 'Recherche en cours sur LinkedIn' },
    { label: 'Import des candidats', sublabel: 'Traitement des données' },
    { label: 'Scoring IA', sublabel: 'Évaluation et classement' },
];

function resolveStep(phase: Phase, runState: RunState | null): number {
    if (phase === 'launching') return 0;
    if (phase === 'streaming') {
        if (!runState || runState.candidates_imported === 0) return 1;
        if (runState.total_items && runState.candidates_imported >= runState.total_items) return 3;
        return 2;
    }
    if (phase === 'done') return 4;
    return 0;
}

function StepLoader({ phase, runState }: { phase: Phase; runState: RunState | null }) {
    const activeStep = resolveStep(phase, runState);
    const done = phase === 'done';

    return (
        <div className="border-ds-border bg-ds-surface mb-6 rounded-2xl border p-6 sm:p-8">
            {/* Top label */}
            <div className="mb-6 flex items-center gap-3">
                {done ? (
                    <>
                        <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-ds-text text-[14px] font-semibold">Sourcing terminé</span>
                    </>
                ) : (
                    <>
                        <svg className="text-ds-accent h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-ds-text text-[14px] font-semibold">Sourcing en cours…</span>
                    </>
                )}
                {runState && (
                    <span className="text-ds-text3 ml-auto text-[12px]">
                        {runState.candidates_imported} candidat{runState.candidates_imported !== 1 ? 's' : ''} importé
                        {runState.candidates_imported !== 1 ? 's' : ''}
                        {runState.total_items ? ` / ${runState.total_items} profils` : ''}
                    </span>
                )}
            </div>

            {/* Steps */}
            <div className="relative flex items-start justify-between">
                {/* Connector line */}
                <div className="bg-ds-border absolute top-4 right-4 left-4 h-px" style={{ zIndex: 0 }}>
                    <div
                        className="bg-ds-accent h-full transition-all duration-700"
                        style={{ width: done ? '100%' : `${Math.min(100, (activeStep / (STEPS.length - 1)) * 100)}%` }}
                    />
                </div>

                {STEPS.map((step, i) => {
                    const isCompleted = done || i < activeStep;
                    const isActive = !done && i === activeStep;

                    return (
                        <div key={i} className="relative z-10 flex flex-1 flex-col items-center gap-2">
                            <div className="relative flex h-8 w-8 items-center justify-center">
                                {isActive && <span className="bg-ds-accent absolute inset-0 animate-ping rounded-full opacity-30" />}
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                                        isCompleted
                                            ? 'border-emerald-500 bg-emerald-500'
                                            : isActive
                                              ? 'border-ds-accent bg-ds-accent'
                                              : 'border-ds-border bg-ds-surface'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    ) : isActive ? (
                                        <svg className="h-3 w-3 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <span className="bg-ds-border h-2 w-2 rounded-full" />
                                    )}
                                </div>
                            </div>

                            <div className="text-center">
                                <p
                                    className={`text-[12px] leading-tight font-semibold ${
                                        isCompleted ? 'text-emerald-600' : isActive ? 'text-ds-accent' : 'text-ds-text3'
                                    }`}
                                >
                                    {step.label}
                                </p>
                                {isActive && <p className="text-ds-text3 mt-0.5 text-[10px] leading-tight">{step.sublabel}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Progress bar */}
            {runState?.total_items && (
                <div className="mt-6">
                    <div className="bg-ds-border h-1.5 w-full overflow-hidden rounded-full">
                        <div
                            className="bg-ds-accent h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, (runState.candidates_imported / runState.total_items) * 100)}%` }}
                        />
                    </div>
                    <p className="text-ds-text3 mt-1.5 text-right text-[11px]">
                        {Math.round((runState.candidates_imported / runState.total_items) * 100)}%
                    </p>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Index({ briefs, filters }: Props) {
    const [briefId, setBriefId] = useState<number | ''>(filters.brief_id ?? '');
    const [phase, setPhase] = useState<Phase>('idle');
    const [candidates, setCandidates] = useState<Candidat[]>([]);
    const [runState, setRunState] = useState<RunState | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [startPage, setStartPage] = useState(1);
    const [takePages, setTakePages] = useState(4);

    // AI-generated Boolean query shown as an editable preview
    const [jobTitleQuery, setJobTitleQuery] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // History modal
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const [mode, setMode] = useState<'broad' | 'targeted'>('targeted');

    const esRef = useRef<EventSource | null>(null);
    const seenIdsRef = useRef<Set<number>>(new Set());

    const briefOptions = briefs.map((b) => ({ value: b.id, label: b.title }));
    const selectedOption = briefOptions.find((o) => o.value === briefId) ?? null;
    const selectedBrief = briefs.find((b) => b.id === briefId) ?? null;

    const isRunning = phase === 'streaming' || phase === 'launching';

    // ---------------------------------------------------------------------------
    // Query generation
    // ---------------------------------------------------------------------------

    async function generateQuery(brief: Brief, overrideMode?: 'broad' | 'targeted') {
        if (!brief.title) return;
        setIsGenerating(true);
        try {
            const { data } = await axios.post<{ query: string }>(route('dashboard.sourcing.generate-query'), {
                brief_id: brief.id,
                search_prompt: brief.search_prompt ?? '',
                mode: overrideMode ?? mode,
            });
            setJobTitleQuery(data.query ?? '');
        } catch {
            // Non-fatal — user can type manually
        } finally {
            setIsGenerating(false);
        }
    }

    async function loadHistory(briefId: number) {
        setIsLoadingHistory(true);
        try {
            const { data } = await axios.get<{ history: QueryHistoryEntry[] }>(route('dashboard.sourcing.query-history'), {
                params: { brief_id: briefId },
            });
            setHistory(data.history ?? []);
        } catch {
            setHistory([]);
        } finally {
            setIsLoadingHistory(false);
        }
    }

    function openHistory() {
        if (!briefId) return;
        setShowHistory(true);
        loadHistory(briefId as number);
    }

    // ---------------------------------------------------------------------------
    // SSE
    // ---------------------------------------------------------------------------

    function openSSE(runId: number) {
        if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
        }

        const url = route('dashboard.sourcing.stream') + '?run_id=' + runId;
        const es = new EventSource(url);
        esRef.current = es;

        let cleanClose = false;

        es.addEventListener('candidate', (e) => {
            const c = JSON.parse(e.data) as Candidat;
            if (!seenIdsRef.current.has(c.id)) {
                seenIdsRef.current.add(c.id);
                setCandidates((prev) => [...prev, c]);
            }
        });

        es.addEventListener('status', (e) => {
            const payload = JSON.parse(e.data) as {
                message: string;
                candidates_imported?: number;
                total_items?: number;
            };

            setRunState((prev) =>
                prev
                    ? {
                          ...prev,
                          candidates_imported: payload.candidates_imported ?? prev.candidates_imported,
                          total_items: payload.total_items ?? prev.total_items,
                      }
                    : prev,
            );
        });

        es.addEventListener('error', (e) => {
            cleanClose = true;
            const msg = (e as MessageEvent).data
                ? (JSON.parse((e as MessageEvent).data) as { message: string }).message
                : 'La connexion au serveur a été interrompue.';
            setErrorMsg(msg);
            setPhase('failed');
            es.close();
            esRef.current = null;
        });

        es.addEventListener('done', (e) => {
            cleanClose = true;
            const payload = JSON.parse(e.data) as { status?: string };
            if (payload.status === 'failed') {
                setPhase('failed');
            } else {
                setPhase('done');
                axios
                    .get<{ next_start_page: number }>(route('dashboard.sourcing.run-status'), { params: { run_id: runId } })
                    .then(({ data }) => setStartPage(data.next_start_page))
                    .catch(() => {});
            }
            es.close();
            esRef.current = null;
        });

        es.onerror = () => {
            if (esRef.current && !cleanClose) {
                setErrorMsg('La connexion SSE a été interrompue.');
                setPhase('failed');
                es.close();
                esRef.current = null;
            }
        };
    }

    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------

    function handleBriefSelect(brief: Brief | null) {
        if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
        }

        const id = brief?.id ?? '';
        setBriefId(id);
        setCandidates([]);
        seenIdsRef.current = new Set();
        setRunState(null);
        setErrorMsg(null);
        setShowHistory(false);
        setHistory([]);
        setPhase(id ? 'ready' : 'idle');

        if (brief) {
            setStartPage(brief.next_start_page ?? 1);
            const q = brief.current_query ?? '';
            const looksLikeQuery =
                q && !q.includes('Instruction:') && !q.startsWith('We need') && !q.startsWith('Title:') && !q.startsWith('Brief title');
            if (looksLikeQuery) {
                setJobTitleQuery(q);
            } else {
                setJobTitleQuery('');
                generateQuery(brief);
            }
        } else {
            setStartPage(1);
            setJobTitleQuery('');
        }
    }

    async function handleLaunch() {
        if (!briefId) return;
        setPhase('launching');
        setErrorMsg(null);
        setCandidates([]);
        seenIdsRef.current = new Set();

        try {
            const { data } = await axios.post<{ run_id: number }>(route('dashboard.sourcing.launch'), {
                brief_id: briefId,
                job_title_query: jobTitleQuery || undefined,
                mode,
                start_page: startPage,
                take_pages: takePages,
                force: true,
            });

            setRunState({
                run_id: data.run_id,
                status: 'running',
                candidates_imported: 0,
                total_items: null,
                dataset_offset: 0,
                created_at: new Date().toISOString(),
                paused_at: null,
            });

            setPhase('streaming');
            openSSE(data.run_id);
        } catch (err: unknown) {
            const msg =
                axios.isAxiosError(err) && err.response?.data?.error ? (err.response.data.error as string) : 'Erreur lors du lancement du sourcing.';
            setErrorMsg(msg);
            setPhase('failed');
        }
    }

    function handleRerun() {
        setPhase('ready');
        setCandidates([]);
        seenIdsRef.current = new Set();
        setRunState(null);
        setErrorMsg(null);
    }

    useEffect(() => {
        return () => {
            esRef.current?.close();
        };
    }, []);

    // On initial load with brief_id in URL, pre-select and load/generate query
    useEffect(() => {
        if (filters.brief_id) {
            setBriefId(filters.brief_id);
            setPhase('ready');
            const brief = briefs.find((b) => b.id === filters.brief_id);
            if (brief) {
                setStartPage(brief.next_start_page ?? 1);
                const q = brief.current_query ?? '';
                const looksLikeQuery =
                    q && !q.includes('Instruction:') && !q.startsWith('We need') && !q.startsWith('Title:') && !q.startsWith('Brief title');
                if (looksLikeQuery) {
                    setJobTitleQuery(q);
                } else {
                    generateQuery(brief);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <>
            <Head title="Sourcing" />
            <AppLayout>
                <div className="bg-ds-bg min-h-full px-4 py-6 sm:px-6 sm:py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="font-heading text-ds-text text-[24px] font-bold sm:text-[26px]">Sourcing</h1>
                        <p className="text-ds-text2 mt-1 text-[13px] sm:text-[14px]">Configurez votre recherche et lancez le sourcing de candidats</p>
                    </div>

                    {/* No brief selected */}
                    {phase === 'idle' && (
                        <>
                            <div className="mb-8 max-w-md">
                                <label className="text-ds-text3 mb-1.5 block text-[12px] font-semibold tracking-[0.8px] uppercase">
                                    Brief de recrutement
                                </label>
                                <Select
                                    classNamePrefix="rs"
                                    options={briefOptions}
                                    value={selectedOption}
                                    onChange={(opt) => {
                                        const brief = opt ? (briefs.find((b) => b.id === opt.value) ?? null) : null;
                                        handleBriefSelect(brief);
                                    }}
                                    placeholder="Choisir un brief…"
                                    isClearable
                                    noOptionsMessage={() => 'Aucun brief disponible'}
                                />
                            </div>

                            <div className="border-ds-border bg-ds-surface flex flex-col items-center justify-center rounded-xl border px-4 py-16 text-center sm:py-24">
                                <div className="bg-ds-accent/10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                                    <Briefcase className="text-ds-accent" size={24} />
                                </div>
                                <p className="font-heading text-ds-text text-[15px] font-semibold">Aucun brief sélectionné</p>
                                <p className="text-ds-text2 mt-1 text-[13px]">Choisissez un brief pour accéder aux options de recherche</p>
                            </div>
                        </>
                    )}

                    {/* Config panel + launch */}
                    {phase !== 'idle' && (
                        <div className="border-ds-border bg-ds-surface mb-6 rounded-2xl border p-5 sm:p-6">
                            {/* Brief selector */}
                            <div className="mb-5">
                                <label className="text-ds-text3 mb-1.5 block text-[12px] font-semibold tracking-[0.8px] uppercase">
                                    Brief de recrutement
                                </label>
                                <Select
                                    classNamePrefix="rs"
                                    options={briefOptions}
                                    value={selectedOption}
                                    onChange={(opt) => {
                                        const brief = opt ? (briefs.find((b) => b.id === opt.value) ?? null) : null;
                                        handleBriefSelect(brief);
                                    }}
                                    placeholder="Choisir un brief…"
                                    isClearable
                                    isDisabled={isRunning}
                                    noOptionsMessage={() => 'Aucun brief disponible'}
                                />
                            </div>

                            <div className="mb-5">
                                <p className="text-ds-text3 mb-1.5 block text-[12px] font-semibold tracking-[0.8px] uppercase">Mode de recherche</p>
                                <div className="border-ds-border inline-flex overflow-hidden rounded-lg border">
                                    {(['broad', 'targeted'] as const).map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => {
                                                setMode(m);
                                                if (selectedBrief) generateQuery(selectedBrief, m);
                                            }}
                                            disabled={isRunning}
                                            className={`px-4 py-2 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                                mode === m ? 'bg-ds-accent text-white' : 'bg-ds-surface text-ds-text2 hover:bg-ds-border'
                                            }`}
                                        >
                                            {m === 'broad' ? 'Large' : 'Ciblé'}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-ds-text3 mt-1 text-[11px]">
                                    {mode === 'broad'
                                        ? 'Recherche large via headline et profil (max 5 exclusions)'
                                        : 'Recherche ciblée sur le titre de poste actuel'}
                                </p>
                            </div>

                            {/* AI-generated query preview */}
                            <div className="mb-5">
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label className="text-ds-text3 text-[12px] font-semibold tracking-[0.8px] uppercase">
                                        Requête LinkedIn générée
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={openHistory}
                                            disabled={isRunning || !selectedBrief}
                                            className="text-ds-text3 flex items-center gap-1 text-[11px] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <Clock size={11} />
                                            Historique
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => selectedBrief && generateQuery(selectedBrief)}
                                            disabled={isRunning || isGenerating || !selectedBrief}
                                            className="text-ds-accent flex items-center gap-1 text-[11px] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {isGenerating ? (
                                                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                    />
                                                </svg>
                                            ) : (
                                                <WandSparkles size={11} />
                                            )}
                                            {isGenerating ? 'Génération…' : 'Regénérer'}
                                        </button>
                                    </div>
                                </div>

                                {isGenerating ? (
                                    <div className="border-ds-border bg-ds-bg flex h-10 items-center gap-2 rounded-lg border px-3">
                                        <Sparkles size={13} className="text-ds-accent animate-pulse" />
                                        <span className="text-ds-text3 text-[13px]">Génération de la requête…</span>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={jobTitleQuery}
                                        onChange={(e) => setJobTitleQuery(e.target.value)}
                                        disabled={isRunning}
                                        maxLength={300}
                                        placeholder={`"${selectedBrief?.title ?? 'titre'}" NOT (responsable OR directeur OR…)`}
                                        className="border-ds-border bg-ds-bg text-ds-text placeholder:text-ds-text3 w-full rounded-lg border px-3 py-2 font-mono text-[12px] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                )}

                                <p className="text-ds-text3 mt-1 text-[11px]">
                                    Syntaxe LinkedIn Boolean. Vous pouvez modifier avant de lancer.{' '}
                                    {jobTitleQuery.length > 0 && (
                                        <span className={jobTitleQuery.length > 280 ? 'text-red-500' : ''}>
                                            {jobTitleQuery.length}/300 caractères
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Pagination */}
                            <div className="mb-5">
                                <p className="text-ds-text3 mb-2 text-[12px] font-semibold tracking-[0.8px] uppercase">Pagination LinkedIn</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-ds-text3 text-[11px]">Page de départ</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={startPage}
                                            onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                                            disabled={isRunning}
                                            className="border-ds-border bg-ds-bg text-ds-text w-20 rounded-lg border px-3 py-2 text-[13px] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-ds-text3 text-[11px]">Nombre de pages</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={takePages}
                                            onChange={(e) => setTakePages(Math.max(1, parseInt(e.target.value) || 1))}
                                            disabled={isRunning}
                                            className="border-ds-border bg-ds-bg text-ds-text w-20 rounded-lg border px-3 py-2 text-[13px] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <p className="text-ds-text3 mt-4 text-[11px]">
                                        ≈ {takePages * 25} profils · pages {startPage}–{startPage + takePages - 1}
                                    </p>
                                </div>
                            </div>

                            {/* Launch / rerun */}
                            <div className="flex items-center gap-3">
                                {(phase === 'ready' || phase === 'failed') && (
                                    <button
                                        onClick={handleLaunch}
                                        disabled={!briefId || isGenerating}
                                        className="bg-ds-accent flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Search size={14} />
                                        Lancer le sourcing
                                    </button>
                                )}

                                {phase === 'done' && (
                                    <button
                                        onClick={handleRerun}
                                        className="border-ds-border text-ds-text hover:bg-ds-border flex items-center gap-2 rounded-lg border px-5 py-2.5 text-[13px] font-semibold transition-colors"
                                    >
                                        <RefreshCw size={14} />
                                        Nouvelle recherche
                                    </button>
                                )}

                                {isRunning && (
                                    <div className="text-ds-text3 flex items-center gap-2 text-[13px]">
                                        <svg className="text-ds-accent h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Sourcing en cours…
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Animated step loader */}
                    {(isRunning || phase === 'done') && <StepLoader phase={phase} runState={runState} />}

                    {/* Error */}
                    {phase === 'failed' && errorMsg && (
                        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                            <span>{errorMsg}</span>
                            <button onClick={handleRerun} className="flex items-center gap-1 text-[12px] underline">
                                <RefreshCw size={12} />
                                Réessayer
                            </button>
                        </div>
                    )}

                    {/* Empty result */}
                    {phase === 'done' && candidates.length === 0 && (
                        <div className="border-ds-border bg-ds-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
                            <p className="text-ds-text2 text-[13px]">Aucun candidat trouvé pour ce brief</p>
                            <button onClick={handleRerun} className="text-ds-accent mt-3 text-[12px] underline">
                                Modifier les options et relancer
                            </button>
                        </div>
                    )}

                    {/* Candidates table */}
                    {candidates.length > 0 && (
                        <div className="border-ds-border bg-ds-surface overflow-hidden rounded-xl border">
                            <div className="overflow-x-auto">
                                <CandidateTable data={candidates} onDelete={() => {}} briefId={briefId || undefined} />
                            </div>
                        </div>
                    )}
                </div>
            </AppLayout>

            {/* Query history modal */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-ds-surface border-ds-border w-full max-w-lg rounded-2xl border shadow-xl">
                        <div className="border-ds-border flex items-center justify-between border-b px-5 py-4">
                            <div>
                                <h3 className="font-heading text-ds-text text-[14px] font-semibold">Historique des requêtes</h3>
                                <p className="text-ds-text3 mt-0.5 text-[12px]">Cliquez sur une requête pour la réutiliser</p>
                            </div>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-ds-text3 hover:text-ds-text flex h-7 w-7 items-center justify-center rounded-lg transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto p-3">
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center py-8">
                                    <svg className="text-ds-accent h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                            ) : history.length === 0 ? (
                                <p className="text-ds-text3 py-8 text-center text-[13px]">Aucune requête générée pour ce brief</p>
                            ) : (
                                <div className="space-y-2">
                                    {history.map((entry) => (
                                        <button
                                            key={entry.id}
                                            type="button"
                                            onClick={() => {
                                                setJobTitleQuery(entry.query);
                                                setShowHistory(false);
                                            }}
                                            className="border-ds-border hover:border-ds-accent/40 hover:bg-ds-accent/5 w-full rounded-lg border p-3 text-left transition"
                                        >
                                            <p className="text-ds-text font-mono text-[12px] leading-relaxed">{entry.query}</p>
                                            <p className="text-ds-text3 mt-1.5 text-[10px]">{dayjs(entry.created_at).fromNow()}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
