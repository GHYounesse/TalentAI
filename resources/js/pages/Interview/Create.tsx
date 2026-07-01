import { ACCEPTED, ACCEPTED_EXT, PLATFORMS, selectStyles } from '@/constants/interviews';
import { useI18n } from '@/hooks/useI18n';
import AppLayout from '@/layouts/app-layout';
import { CreateInterviewProps, Option, Status } from '@/types/interviews';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Loader2, Mic, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import { InterviewField } from './components/InterviewField';

/* ── Waveform decoration ─────────────────────────────────────────────── */
const WAVE_HEIGHTS = [4, 8, 14, 10, 18, 12, 20, 16, 10, 22, 14, 18, 8, 16, 20, 12, 6, 14, 10, 18];

function Waveform() {
    return (
        <div className="flex h-6 items-end gap-[3px]">
            {WAVE_HEIGHTS.map((h, i) => (
                <div key={i} className="bg-ds-accent/60 w-[3px] rounded-full" style={{ height: `${h}px` }} />
            ))}
        </div>
    );
}

/* ── Analysis step stepper ───────────────────────────────────────────── */
type AnalysisStep = 'upload' | 'queue' | 'transcribe' | 'analyse' | 'done';

const STEP_KEYS: AnalysisStep[] = ['upload', 'queue', 'transcribe', 'analyse', 'done'];

function stepFromStatus(status: Status, analysisStatus: string): AnalysisStep {
    if (status === 'uploading') return 'upload';
    if (status === 'pending') return 'queue';
    if (status === 'processing') return analysisStatus === 'processing' ? 'analyse' : 'transcribe';
    if (status === 'done') return 'done';
    return 'upload';
}

function AnalysisStepper({ status, analysisStatus, t }: { status: Status; analysisStatus: string; t: (key: string) => string }) {
    const currentStep = stepFromStatus(status, analysisStatus);
    const currentIdx = STEP_KEYS.indexOf(currentStep);
    const progress = Math.round((currentIdx / (STEP_KEYS.length - 1)) * 100);

    return (
        <div className="border-ds-border bg-ds-bg rounded-xl border px-4 py-4">
            <p className="font-heading text-ds-text3 mb-3 text-[11px] font-semibold tracking-wider uppercase">
                {t('interviews.index.stepper.heading')}
            </p>
            <div className="flex flex-col gap-2.5">
                {STEP_KEYS.map((key, idx) => {
                    const isDone = idx < currentIdx;
                    const isActive = idx === currentIdx;

                    return (
                        <div key={key} className="flex items-center gap-3">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                                {isDone ? (
                                    <CheckCircle2 size={15} className="text-badge-active-text" />
                                ) : isActive ? (
                                    <Loader2 size={15} className="text-ds-accent animate-spin" />
                                ) : (
                                    <div className="border-ds-border h-3.5 w-3.5 rounded-full border-2" />
                                )}
                            </div>
                            <span
                                className={`text-[13px] transition-colors ${
                                    isDone ? 'text-ds-text3 line-through' : isActive ? 'text-ds-text font-semibold' : 'text-ds-text3'
                                }`}
                            >
                                {t(`interviews.index.stepper.${key}` as string)}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="bg-ds-bg3 mt-3 h-1.5 w-full overflow-hidden rounded-full">
                <div className="bg-ds-accent h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}

/* ── Recent interview row ────────────────────────────────────────────── */
const AVATAR_COLORS = ['bg-ds-accent', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500'];

function RecentRow({ interview }: { interview: CreateInterviewProps['interviews'][number] }) {
    const isDone = interview.transcription_status === 'done' && interview.analysis_status === 'done';
    const isProcessing = ['processing', 'pending'].includes(interview.transcription_status);

    const initials = interview.candidate_name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    const avatarColor = AVATAR_COLORS[interview.id % AVATAR_COLORS.length];

    return (
        <div
            onClick={() => (isDone || interview.transcription_status === 'done') && router.visit(`/dashboard/interviews/${interview.id}`)}
            className={`border-ds-border bg-ds-bg flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all ${isDone || interview.transcription_status === 'done' ? 'hover:border-ds-border2 hover:bg-ds-surface/50 cursor-pointer' : ''}`}
        >
            {/* Avatar */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${avatarColor}`}>
                <span className="text-[12px] font-bold text-white">{initials}</span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className="font-heading text-ds-text truncate text-[13px] font-semibold">{interview.candidate_name}</p>
                <p className="text-ds-text3 text-[11px]">
                    {interview.duration_minutes ? `${interview.duration_minutes} min · ` : ''}
                    {interview.platform} · {interview.scheduled_at}
                </p>
                {isProcessing ? (
                    <div className="mt-2">
                        <p className="text-ds-text3 mb-1 text-[11px]">Transcription en cours…</p>
                        <div className="bg-ds-border h-1 w-full overflow-hidden rounded-full">
                            <div className="h-full w-4/5 animate-pulse rounded-full bg-amber-400" />
                        </div>
                    </div>
                ) : isDone ? (
                    <div className="mt-1.5">
                        <Waveform />
                    </div>
                ) : null}
            </div>

            {/* Badge */}
            {isDone ? (
                <span className="bg-badge-active-bg text-badge-active-text border-badge-active-text/20 inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap">
                    ✓ Rapport prêt
                </span>
            ) : isProcessing ? (
                <span className="inline-flex shrink-0 items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-amber-400">
                    En cours
                </span>
            ) : null}
        </div>
    );
}

/* ── Main component ──────────────────────────────────────────────────── */
export default function CreateInterview({ candidates, briefs, interviews }: CreateInterviewProps) {
    const { t } = useI18n();

    const [selectedCandidate, setSelectedCandidate] = useState('');
    const [selectedBrief, setSelectedBrief] = useState('');
    const [platform, setPlatform] = useState<string>('zoom');
    const [recruiterNotes, setRecruiterNotes] = useState('');
    const [expectations, setExpectations] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<Status>('idle');
    const [analysisStatus, setAnalysisStatus] = useState<string>('pending');
    const [dragOver, setDragOver] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Stop polling if the component unmounts mid-poll (e.g. user navigates away)
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);
    const isWorking = ['uploading', 'pending', 'processing'].includes(status);
    const canSubmit = !!file && !!selectedCandidate && !!selectedBrief && !isWorking;

    const startPolling = useCallback(
        (id: number) => {
            pollRef.current = setInterval(async () => {
                try {
                    const res = await fetch(`/dashboard/interviews/${id}/status`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();

                    setAnalysisStatus(data.analysis_status ?? 'pending');

                    if (data.status === 'done' && data.analysis_status === 'done') {
                        clearInterval(pollRef.current!);
                        setStatus('done');
                        toast.success(t('interviews.index.toast.success'));
                        router.reload({ only: ['interviews'] });
                    } else if (data.status === 'failed') {
                        clearInterval(pollRef.current!);
                        setStatus('failed');
                        toast.error(t('interviews.index.toast.failed'));
                    } else if (data.status === 'processing' || (data.status === 'done' && data.analysis_status === 'processing')) {
                        setStatus('processing');
                    }
                } catch {
                    clearInterval(pollRef.current!);
                    setStatus('failed');
                    toast.error(t('interviews.index.toast.connection_lost'));
                }
            }, 3000);
        },
        [t],
    );

    const handleSubmit = useCallback(() => {
        if (!canSubmit) return;
        setStatus('uploading');
        setAnalysisStatus('pending');

        router.post(
            '/dashboard/interviews/upload',
            { audio: file, candidate_id: selectedCandidate, brief_id: selectedBrief, platform, expectations, recruiter_notes: recruiterNotes },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    const props = page.props as { flash?: { interview_id?: number } };
                    const id = props.flash?.interview_id;
                    if (id) {
                        setStatus('pending');
                        startPolling(id);
                    } else {
                        setStatus('failed');
                        toast.error(t('interviews.index.toast.no_job_id'));
                    }
                },
                onError: (errors) => {
                    setStatus('failed');
                    toast.error(errors.audio ?? errors.message ?? t('interviews.index.toast.upload_failed'));
                },
            },
        );
    }, [canSubmit, file, selectedCandidate, selectedBrief, platform, expectations, startPolling, t]);

    const pickFile = (f: File | null | undefined) => {
        if (!f) return;
        if (!ACCEPTED.includes(f.type)) {
            toast.error(t('interviews.index.toast.unsupported_format'));
            return;
        }
        if (f.size > 500 * 1024 * 1024) {
            toast.error(t('interviews.index.toast.file_too_large'));
            return;
        }
        setFile(f);
        setStatus('idle');
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (!isWorking) pickFile(e.dataTransfer.files?.[0]);
    };

    const reset = () => {
        clearInterval(pollRef.current!);
        setFile(null);
        setStatus('idle');
        setAnalysisStatus('pending');
        setSelectedCandidate('');
        setSelectedBrief('');
        setPlatform('zoom');
        setExpectations('');
        if (inputRef.current) inputRef.current.value = '';
    };

    const platformOptions = PLATFORMS.map((p) => ({
        value: p,
        label: p === 'zoom' ? 'Zoom' : p === 'meet' ? 'Google Meet' : p === 'teams' ? 'Microsoft Teams' : 'Présentiel',
    }));

    return (
        <>
            <Head title={t('interviews.index.title')} />
            <AppLayout>
                <div className="bg-ds-bg min-h-full px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <p className="text-ds-text3 mb-1 text-[12px] tracking-wider uppercase">{t('interviews.index.breadcrumb')}</p>
                        <h1 className="font-heading text-ds-text text-[28px] font-bold">{t('interviews.index.title')}</h1>
                        <p className="text-ds-text2 mt-1 text-[14px]">{t('interviews.index.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
                        {/* ── Left: Import form ── */}
                        <div className="border-ds-border bg-ds-surface rounded-2xl border p-6">
                            <p className="font-heading text-ds-text mb-5 text-[15px] font-semibold">{t('interviews.index.form.title')}</p>

                            <div className="flex flex-col gap-4">
                                <InterviewField label={t('interviews.index.form.candidate_label')}>
                                    <Select<Option>
                                        value={
                                            candidates.map((c) => ({ value: c.id, label: c.full_name })).find((o) => o.value === selectedCandidate) ??
                                            null
                                        }
                                        onChange={(opt) => setSelectedCandidate(opt?.value ?? '')}
                                        placeholder={t('interviews.index.form.candidate_placeholder')}
                                        options={candidates.map((c) => ({ value: c.id, label: c.full_name }))}
                                        isDisabled={isWorking}
                                        styles={selectStyles}
                                    />
                                </InterviewField>

                                <InterviewField label={t('interviews.index.form.platform_label')}>
                                    <Select
                                        value={platformOptions.find((o) => o.value === platform) ?? null}
                                        onChange={(opt) => setPlatform(opt?.value ?? 'zoom')}
                                        options={platformOptions}
                                        isDisabled={isWorking}
                                        styles={selectStyles}
                                    />
                                </InterviewField>

                                <InterviewField label={t('interviews.index.form.brief_label')}>
                                    <Select<Option>
                                        value={briefs.map((b) => ({ value: b.id, label: b.title })).find((o) => o.value === selectedBrief) ?? null}
                                        onChange={(opt) => setSelectedBrief(opt?.value ?? '')}
                                        placeholder={t('interviews.index.form.brief_placeholder')}
                                        options={briefs.map((b) => ({ value: b.id, label: b.title }))}
                                        isDisabled={isWorking}
                                        styles={selectStyles}
                                    />
                                </InterviewField>

                                <InterviewField label={t('interviews.index.form.recruiter_notes_label')}>
                                    <textarea
                                        rows={6}
                                        cols={50}
                                        value={recruiterNotes}
                                        onChange={(e) => setRecruiterNotes(e.target.value)}
                                        placeholder={t('interviews.index.form.recruiter_notes_placeholder')}
                                        className="bg-ds-bg placeholder:text-ds-text3 focus:ring-ds-accent w-full rounded-lg border p-4 px-3 py-2 text-[13px] focus:ring-2 focus:outline-none"
                                        disabled={isWorking}
                                    />
                                </InterviewField>

                                {/* Drop zone */}
                                <div
                                    onClick={() => !isWorking && inputRef.current?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (!isWorking) setDragOver(true);
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={!isWorking ? onDrop : undefined}
                                    className={[
                                        'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-all select-none',
                                        isWorking
                                            ? 'border-ds-border bg-ds-bg cursor-not-allowed opacity-60'
                                            : dragOver
                                              ? 'border-ds-accent bg-ds-accent/5 cursor-copy'
                                              : 'border-ds-border bg-ds-bg hover:border-ds-accent/50 cursor-pointer',
                                    ].join(' ')}
                                >
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        accept={ACCEPTED_EXT}
                                        className="hidden"
                                        onChange={(e) => pickFile(e.target.files?.[0])}
                                        disabled={isWorking}
                                    />

                                    <div
                                        className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${dragOver ? 'bg-ds-accent/20' : 'bg-ds-surface'}`}
                                    >
                                        <Mic size={24} className={dragOver ? 'text-ds-accent' : 'text-ds-text3'} />
                                    </div>

                                    {file ? (
                                        <>
                                            <p className="font-heading text-ds-text max-w-xs truncate text-[14px] font-semibold">{file.name}</p>
                                            <p className="text-ds-text3 text-[12px]">{(file.size / 1024 / 1024).toFixed(1)} Mo</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-ds-text2 text-[14px]">{t('interviews.index.dropzone.prompt')}</p>
                                            <p className="text-ds-text3 text-[12px]">{t('interviews.index.dropzone.formats')}</p>
                                        </>
                                    )}
                                </div>

                                {/* Step loader */}
                                {isWorking && <AnalysisStepper status={status} analysisStatus={analysisStatus} t={t} />}

                                {/* Done */}
                                {status === 'done' && (
                                    <div className="border-badge-active-text/20 bg-badge-active-bg flex items-center gap-3 rounded-xl border px-4 py-3">
                                        <CheckCircle2 size={18} className="text-badge-active-text shrink-0" />
                                        <div>
                                            <p className="text-ds-text text-[13px] font-semibold">{t('interviews.index.done.title')}</p>
                                            <p className="text-ds-text3 text-[12px]">{t('interviews.index.done.description')}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Failed */}
                                {status === 'failed' && (
                                    <div className="border-ds-red/20 bg-ds-red/10 flex items-center gap-3 rounded-xl border px-4 py-3">
                                        <XCircle size={18} className="text-ds-red shrink-0" />
                                        <p className="text-ds-red text-[13px]">{t('interviews.index.toast.failed')}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!canSubmit}
                                        className="bg-ds-accent flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-[#7C74FF] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {isWorking ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin" />
                                                {t('interviews.index.actions.processing')}
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={15} />
                                                {t('interviews.index.actions.analyse')}
                                            </>
                                        )}
                                    </button>
                                    {(file || status !== 'idle') && (
                                        <button
                                            onClick={reset}
                                            disabled={isWorking}
                                            className="border-ds-border text-ds-text2 hover:bg-ds-surface hover:text-ds-text flex items-center gap-1.5 rounded-xl border px-4 py-3 text-[13px] transition disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <RotateCcw size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Right: Recent interviews ── */}
                        <div className="border-ds-border bg-ds-surface rounded-2xl border p-6">
                            <p className="text-ds-text3 mb-4 text-[11px] font-semibold tracking-wider uppercase">
                                {t('interviews.index.history_title')}
                            </p>

                            {interviews.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="bg-ds-bg mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                                        <Mic size={22} className="text-ds-text3" />
                                    </div>
                                    <p className="text-ds-text text-[14px] font-semibold">{t('interviews.index.history_empty')}</p>
                                    <p className="text-ds-text2 mt-1 text-[13px]">{t('interviews.index.history_description')}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {interviews.map((interview) => (
                                        <RecentRow key={interview.id} interview={interview} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
