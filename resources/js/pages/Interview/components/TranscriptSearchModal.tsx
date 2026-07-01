import axios from 'axios';
import { ChevronDown, ChevronUp, FileText, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface TranscriptMessage {
    speaker: string;
    text: string;
}

interface Props {
    interviewId: number;
    open: boolean;
    onClose: () => void;
}

export default function TranscriptSearchModal({ interviewId, open, onClose }: Props) {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
    const [currentMatch, setCurrentMatch] = useState(0);

    const matchRefs = useRef<(HTMLSpanElement | null)[]>([]);

    useEffect(() => {
        if (!open) return;

        setLoading(true);

        axios
            .get(`/dashboard/interviews/${interviewId}/transcription/search`)
            .then((response) => {
                setTranscript(Array.isArray(response.data.transcript) ? response.data.transcript : []);
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [open, interviewId]);

    useEffect(() => {
        if (matchRefs.current[currentMatch]) {
            matchRefs.current[currentMatch]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentMatch]);

    const matchesCount = useMemo(() => {
        if (!search.trim()) return 0;

        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

        return transcript.reduce((total, item) => {
            return total + [...item.text.matchAll(regex)].length;
        }, 0);
    }, [search, transcript]);

    // Reset on every render so refs align with the current match indices.
    // Truncate stale entries so old refs don't linger after match count drops.
    matchRefs.current.length = 0;
    let globalMatchIndex = 0;
    const highlightText = (text: string, keyword: string) => {
        if (!keyword.trim()) {
            return text;
        }

        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const regex = new RegExp(`(${escapedKeyword})`, 'gi');

        return text.split(regex).map((part, index) => {
            const isMatch = part.toLowerCase() === keyword.toLowerCase();

            if (!isMatch) {
                return part;
            }

            const matchIndex = globalMatchIndex++;

            return (
                <mark
                    key={index}
                    ref={(el) => (matchRefs.current[matchIndex] = el)}
                    className={
                        matchIndex === currentMatch
                            ? 'rounded bg-orange-500 px-1 text-white ring-2 ring-orange-300'
                            : 'rounded bg-yellow-300 px-1 text-black'
                    }
                >
                    {part}
                </mark>
            );
        });
    };

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-ds-surface border-ds-border flex h-[90vh] w-[1100px] max-w-[95vw] flex-col overflow-hidden rounded-3xl border shadow-xl">
                {/* Header */}
                <div className="border-ds-border flex items-center justify-between border-b px-6 py-5">
                    <div className="flex items-center gap-4">
                        <div className="bg-ds-accent/10 flex h-12 w-12 items-center justify-center rounded-xl">
                            <FileText size={22} className="text-ds-accent" />
                        </div>

                        <div>
                            <h2 className="text-ds-text text-lg font-semibold">Transcription</h2>

                            <p className="text-ds-text3 text-sm">Recherche dans l'entretien</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="hover:bg-ds-bg3 rounded-lg p-2 transition">
                        <X size={18} className="text-ds-text3" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative flex items-center gap-3 px-6 py-2">
                    <div className="relative flex-1">
                        <Search size={18} className="text-ds-text3 absolute top-1/2 left-3 -translate-y-1/2" />

                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentMatch(0);
                            }}
                            placeholder="Rechercher un mot-clé..."
                            className="border-ds-border bg-ds-bg3 text-ds-text focus:border-ds-accent w-full rounded-xl border py-3 pr-4 pl-10 text-sm outline-none"
                        />
                    </div>

                    {matchesCount > 0 && (
                        <div className="bg-ds-surface border-ds-border flex items-center gap-2 rounded-xl border px-3 py-2">
                            <span className="text-ds-text text-sm font-medium">
                                {currentMatch + 1} / {matchesCount}
                            </span>

                            <button
                                onClick={() => setCurrentMatch((prev) => (prev === 0 ? matchesCount - 1 : prev - 1))}
                                className="hover:bg-ds-bg3 rounded-lg p-1"
                            >
                                <ChevronUp size={13} className="text-ds-text3" />
                            </button>

                            <button
                                onClick={() => setCurrentMatch((prev) => (prev === matchesCount - 1 ? 0 : prev + 1))}
                                className="hover:bg-ds-bg3 rounded-lg p-1"
                            >
                                <ChevronDown size={13} className="text-ds-text3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="bg-ds-bg3 flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="bg-ds-surface2 h-20 animate-pulse rounded-2xl" />
                            <div className="bg-ds-surface2 ml-auto h-20 w-2/3 animate-pulse rounded-2xl" />
                            <div className="bg-ds-surface2 h-20 w-3/4 animate-pulse rounded-2xl" />
                        </div>
                    ) : transcript.length === 0 ? (
                        <div className="text-ds-text3 text-center">Aucune transcription disponible.</div>
                    ) : (
                        transcript.map((message, index) => {
                            const isCandidate = message.speaker.toLowerCase().includes('candidate');

                            return (
                                <div key={index} className={`mb-4 flex ${isCandidate ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                            isCandidate ? 'bg-ds-accent text-white' : 'bg-ds-surface border-ds-border text-ds-text border'
                                        }`}
                                    >
                                        <div className={`mb-2 text-xs font-semibold ${isCandidate ? 'text-white/80' : 'text-ds-text3'}`}>
                                            {message.speaker}
                                        </div>

                                        <div className="text-sm leading-7 whitespace-pre-wrap">{highlightText(message.text, search)}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
