import { STATUSES, StatusKey } from '@/constants/interviews';
import { useI18n } from '@/hooks/useI18n';
import { InterviewRecord } from '@/types/interviews';
import { Link } from '@inertiajs/react';
import { BarChart2, ExternalLink, Pause, Play, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import TranscriptSearchModal from './TranscriptSearchModal';

/* ── Platform badge ──────────────────────────────────────────────────── */
const PLATFORM_STYLE: Record<string, string> = {
    zoom: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    meet: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    teams: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    presentiel: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};
const PLATFORM_LABEL: Record<string, string> = {
    zoom: 'Zoom',
    meet: 'Meet',
    teams: 'Teams',
    presentiel: 'Présentiel',
};

/* ── Status badge styles ─────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, string> = {
    done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    processing: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    none: 'bg-ds-bg3 text-ds-text3 border-ds-border',
};

/* ── Avatar colors ───────────────────────────────────────────────────── */
const AVATAR_COLORS = ['bg-ds-accent', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500'];

/* ── Audio player modal (rendered via portal) ────────────────────────── */
function AudioModal({ url, candidateName, onClose }: { url: string; candidateName: string; onClose: () => void }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loadError, setLoadError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
        };
        const onLoaded = () => {
            setDuration(audio.duration);
            setLoading(false);
        };
        const onEnded = () => setPlaying(false);
        const onError = () => {
            setLoadError(true);
            setLoading(false);
            setPlaying(false);
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            audio.pause();
        };
    }, []);

    // Close on Escape
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio || loadError) return;

        if (playing) {
            audio.pause();
            setPlaying(false);
            return;
        }

        // audio.play() returns a promise that rejects if playback fails
        // (e.g. broken source, browser autoplay policy) — must be handled
        // or React state desyncs from actual playback state.
        audio
            .play()
            .then(() => setPlaying(true))
            .catch(() => {
                setLoadError(true);
                setPlaying(false);
            });
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration || loadError) return;
        const rect = e.currentTarget.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    };

    const fmt = (s: number) => {
        if (!s || isNaN(s)) return '0:00';
        return `${Math.floor(s / 60)}:${Math.floor(s % 60)
            .toString()
            .padStart(2, '0')}`;
    };

    const BARS = [
        3, 6, 12, 8, 16, 10, 18, 14, 8, 20, 12, 16, 6, 14, 18, 10, 4, 12, 8, 16, 10, 18, 12, 20, 16, 8, 14, 6, 18, 10, 16, 12, 20, 8, 14, 18, 10, 6,
        16, 12,
    ];

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="border-ds-border bg-ds-surface w-full max-w-md rounded-2xl border p-6 shadow-2xl">
                {/* Header */}
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-ds-text3 text-[11px] font-semibold tracking-wider uppercase">Enregistrement</p>
                        <p className="font-heading text-ds-text mt-0.5 text-[15px] font-semibold">{candidateName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="border-ds-border text-ds-text3 hover:bg-ds-bg hover:text-ds-text flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition"
                    >
                        <X size={15} />
                    </button>
                </div>

                {loadError ? (
                    /* Error state — file missing/unreachable (e.g. deleted post-transcription) */
                    <div className="bg-ds-bg mb-4 flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-8 text-center">
                        <p className="text-ds-text2 text-[13px] font-medium">Enregistrement indisponible</p>
                        <p className="text-ds-text3 text-[12px]">Ce fichier audio a peut-être été supprimé après la transcription.</p>
                    </div>
                ) : (
                    <>
                        {/* Waveform */}
                        <div className="bg-ds-bg mb-4 flex items-center justify-center gap-[3px] rounded-xl px-4 py-5">
                            {loading ? (
                                <span className="text-ds-text3 text-[12px]">Chargement…</span>
                            ) : (
                                BARS.map((h, i) => (
                                    <div
                                        key={i}
                                        className={`w-[4px] rounded-full transition-colors duration-100 ${(i / BARS.length) * 100 <= progress ? 'bg-ds-accent' : 'bg-ds-text3/20'}`}
                                        style={{ height: `${h}px` }}
                                    />
                                ))
                            )}
                        </div>

                        {/* Seek bar */}
                        <div className="mb-2 cursor-pointer" onClick={seek}>
                            <div className="bg-ds-bg3 h-1.5 w-full overflow-hidden rounded-full">
                                <div className="bg-ds-accent h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        </div>

                        {/* Time */}
                        <div className="text-ds-text3 mb-5 flex justify-between text-[11px]">
                            <span>{fmt(currentTime)}</span>
                            <span>{fmt(duration)}</span>
                        </div>

                        {/* Play / Pause */}
                        <div className="flex justify-center">
                            <button
                                onClick={togglePlay}
                                disabled={loading}
                                className="bg-ds-accent flex h-12 w-12 items-center justify-center rounded-full text-white transition hover:bg-[#7C74FF] disabled:opacity-50"
                            >
                                {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                            </button>
                        </div>
                    </>
                )}

                <audio ref={audioRef} src={url} preload="metadata" />
            </div>
        </div>,
        document.body,
    );
}

/* ── Table row ───────────────────────────────────────────────────────── */
export default function InterviewIndexRow({ interview }: { interview: InterviewRecord }) {
    const { t, locale } = useI18n();
    const [showAudio, setShowAudio] = useState(false);
    const [showTranscriptSearch, setShowTranscriptSearch] = useState(false);

    const statusKey = (STATUSES.includes(interview.transcription_status as StatusKey) ? interview.transcription_status : 'none') as StatusKey;

    const isProcessing = ['processing', 'pending'].includes(statusKey);
    const hasReport = statusKey === 'done' && interview.analysis_status === 'done';
    const canView = statusKey === 'done';

    const formattedDate = (() => {
        try {
            return new Date(interview.scheduled_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return interview.scheduled_at;
        }
    })();

    const initials = interview.candidate_name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
    const avatarColor = AVATAR_COLORS[interview.id % AVATAR_COLORS.length];
    const platformStyle = PLATFORM_STYLE[interview.platform] ?? 'bg-ds-bg3 text-ds-text3 border-ds-border';
    const platformLabel = PLATFORM_LABEL[interview.platform] ?? interview.platform;
    const statusStyle = STATUS_STYLE[statusKey] ?? STATUS_STYLE.none;

    return (
        <>
            <tr className="border-ds-border group hover:bg-ds-surface/60 border-b transition-colors last:border-0">
                {/* Candidat */}
                <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${avatarColor}`}>
                            <span className="text-[10px] font-bold text-white">{initials}</span>
                        </div>
                        <span className="font-heading text-ds-text text-[13px] font-semibold">{interview.candidate_name}</span>
                    </div>
                </td>

                {/* Brief */}
                <td className="px-4 py-3.5">
                    {interview.brief_id ? (
                        <Link
                            href={`/dashboard/briefs/${interview.brief_id}`}
                            className="text-ds-text2 hover:text-ds-accent max-w-[200px] truncate text-[12px] underline-offset-2 transition hover:underline"
                        >
                            {interview.brief_title}
                        </Link>
                    ) : (
                        <span className="text-ds-text2 text-[12px]">{interview.brief_title}</span>
                    )}
                </td>

                {/* Date */}
                <td className="px-4 py-3.5">
                    <span className="text-ds-text3 text-[12px]">{formattedDate}</span>
                </td>

                {/* Plateforme */}
                <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${platformStyle}`}>
                        {platformLabel}
                    </span>
                </td>

                {/* Durée */}
                <td className="px-4 py-3.5">
                    {interview.duration_minutes ? (
                        <span className="text-ds-text3 text-[12px]">{interview.duration_minutes} min</span>
                    ) : isProcessing ? (
                        <div className="w-20">
                            <div className="bg-ds-bg3 h-1 overflow-hidden rounded-full">
                                <div className="bg-ds-accent h-full w-3/4 animate-pulse rounded-full" />
                            </div>
                        </div>
                    ) : (
                        <span className="text-ds-text3 text-[12px]">—</span>
                    )}
                </td>

                {/* Statut */}
                <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle}`}>
                        {t(`interviews.list.status.${statusKey}`)}
                    </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                        {interview.audio_url && (
                            <button
                                onClick={() => setShowAudio(true)}
                                title="Écouter l'enregistrement"
                                className="border-ds-border text-ds-text3 hover:bg-ds-surface2 hover:text-ds-accent flex h-7 w-7 items-center justify-center rounded-lg border transition"
                            >
                                <Play size={12} className="ml-0.5" />
                            </button>
                        )}
                        {canView && (
                            <Link
                                href={`/dashboard/interviews/${interview.id}`}
                                title={hasReport ? t('interviews.list.row.report') : t('interviews.list.row.view')}
                                className="border-ds-border text-ds-text3 hover:bg-ds-surface2 hover:text-ds-accent flex h-7 w-7 items-center justify-center rounded-lg border transition"
                            >
                                {hasReport ? <BarChart2 size={13} /> : <ExternalLink size={12} />}
                            </Link>
                        )}
                        <button
                            onClick={() => setShowTranscriptSearch(true)}
                            className="border-ds-border text-ds-text3 hover:bg-ds-surface2 hover:text-ds-accent flex h-7 w-7 items-center justify-center rounded-lg border transition"
                        >
                            <Search size={13} />
                        </button>
                    </div>
                </td>
            </tr>

            {showAudio && interview.audio_url && (
                <AudioModal url={interview.audio_url} candidateName={interview.candidate_name} onClose={() => setShowAudio(false)} />
            )}
            <TranscriptSearchModal interviewId={interview.id} open={showTranscriptSearch} onClose={() => setShowTranscriptSearch(false)} />
        </>
    );
}
