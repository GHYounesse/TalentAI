import { ShowSourcingCampaignStatusBadge } from '@/components/SourcingCampaigns/ShowSourcingCampaignStatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/hooks/useI18n';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { safeUrl } from '@/lib/utils';
import { Candidat, Comment, Mention, Post, ShowProps } from '@/types/sourcing_campaigns';
import { Head, Link, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowLeft, Building2, ExternalLink, FileText, LayoutGrid, List, MessageSquare, Plus, Search, Sparkles, UserPlus, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

dayjs.extend(relativeTime);
dayjs.locale('fr');

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null): string {
    if (!name) return '?';
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

const AVATAR_GRADIENTS = [
    'from-[#6C63FF] to-[#38BDF8]',
    'from-[#34D399] to-[#38BDF8]',
    'from-[#FBBF24] to-[#F87171]',
    'from-[#A78BFA] to-[#6C63FF]',
    'from-[#F472B6] to-[#A78BFA]',
];

const AVATAR_FLAT = [
    'bg-[#6C63FF]/15 text-[#6C63FF]',
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600',
    'bg-amber-100 text-amber-600',
    'bg-pink-100 text-pink-600',
];

function avatarGradient(name: string | null): string {
    if (!name) return AVATAR_GRADIENTS[0];
    return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function avatarFlat(name: string | null): string {
    if (!name) return AVATAR_FLAT[0];
    return AVATAR_FLAT[name.charCodeAt(0) % AVATAR_FLAT.length];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CandidatBadge({ candidat, viewLabel }: { candidat: Candidat | null; viewLabel: string }) {
    if (!candidat) return <span className="text-ds-text3">—</span>;
    const label = candidat.current_title ?? candidat.full_name ?? viewLabel;
    return (
        <Link
            href={route('dashboard.candidats.show', candidat.id)}
            className="inline-flex max-w-[200px] items-center gap-1 truncate rounded-full bg-[#6C63FF]/10 px-2.5 py-0.5 text-xs font-medium text-[#6C63FF] transition hover:bg-[#6C63FF]/20 dark:bg-[#6C63FF]/15 dark:text-[#a78bfa]"
            title={label}
            onClick={(e) => e.stopPropagation()}
        >
            <span className="truncate">{label}</span>
            <ExternalLink size={10} className="shrink-0" />
        </Link>
    );
}

function CommentsModal({ post, open, onClose, t }: { post: Post | null; open: boolean; onClose: () => void; t: (k: string) => string }) {
    if (!post) return null;
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="flex max-h-[80vh] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden p-0">
                <DialogHeader className="border-ds-border border-b px-6 pt-5 pb-4">
                    <DialogTitle className="text-ds-text flex items-center gap-2 text-[15px] font-semibold">
                        <MessageSquare size={15} className="text-ds-text3 shrink-0" />
                        {post.author_name ?? t('sourcing_campaigns.show.post_card.unknown_author')}
                        <span className="text-ds-text3 text-[13px] font-normal">
                            — {post.comments.length} commentaire{post.comments.length !== 1 ? 's' : ''}
                        </span>
                    </DialogTitle>
                    {post.content && <p className="text-ds-text3 mt-1 line-clamp-2 text-[12px] leading-relaxed">{post.content}</p>}
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                    {post.comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <MessageSquare size={24} className="text-ds-text3 mb-2 opacity-40" />
                            <p className="text-ds-text3 text-sm">{t('sourcing_campaigns.show.posts_section.no_comments')}</p>
                        </div>
                    ) : (
                        <table className="w-full text-[13px]">
                            <thead className="border-ds-border bg-ds-bg3/30 sticky top-0 border-b">
                                <tr>
                                    <th className="text-ds-text3 px-6 py-2.5 text-left text-[10px] font-semibold tracking-[0.7px] uppercase">
                                        {t('sourcing_campaigns.show.comments_table.commenter')}
                                    </th>
                                    <th className="text-ds-text3 px-6 py-2.5 text-left text-[10px] font-semibold tracking-[0.7px] uppercase">
                                        {t('sourcing_campaigns.show.comments_table.comment')}
                                    </th>
                                    <th className="text-ds-text3 px-6 py-2.5 text-left text-[10px] font-semibold tracking-[0.7px] uppercase">
                                        {t('sourcing_campaigns.show.comments_table.candidate')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-ds-border divide-y">
                                {post.comments.map((comment: Comment) => (
                                    <tr key={comment.id} className="hover:bg-ds-bg2 transition">
                                        <td className="px-6 py-3.5 align-top">
                                            <div className="flex items-start gap-2.5">
                                                <div
                                                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold select-none ${avatarFlat(comment.commenter_name)}`}
                                                >
                                                    {initials(comment.commenter_name)}
                                                </div>
                                                <div>
                                                    <a
                                                        href={safeUrl(comment.commenter_linkedin_url)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-ds-text font-semibold hover:underline"
                                                    >
                                                        {comment.commenter_name ?? '—'}
                                                    </a>
                                                    {comment.commenter_position && (
                                                        <p className="text-ds-text3 mt-0.5 text-[11px]">{comment.commenter_position}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-ds-text2 max-w-[260px] px-6 py-3.5 align-top leading-relaxed">{comment.commentary}</td>
                                        <td className="px-6 py-3.5 align-top">
                                            <CandidatBadge candidat={comment.candidat} viewLabel={t('sourcing_campaigns.show.candidat_badge.view')} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Pending add can be a commenter (Comment) or a mention ({name, linkedinUrl})
type PendingAdd =
    | { kind: 'commenter'; comment: Comment }
    | { kind: 'mention'; name: string; linkedinUrl: string | null; postId: number; campaignId: number };

function ConfirmAddCandidatModal({
    pending,
    open,
    onClose,
    onConfirm,
}: {
    pending: PendingAdd | null;
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    if (!pending) return null;

    const name = pending.kind === 'commenter' ? pending.comment.commenter_name : pending.name;
    const position = pending.kind === 'commenter' ? pending.comment.commenter_position : null;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-sm overflow-hidden p-0">
                <DialogHeader className="border-ds-border border-b px-6 pt-5 pb-4">
                    <DialogTitle className="text-ds-text flex items-center gap-2 text-[15px] font-semibold">
                        <UserPlus size={15} className="shrink-0 text-[#6C63FF]" />
                        Ajouter à la base candidats
                    </DialogTitle>
                </DialogHeader>
                <div className="px-6 py-4">
                    <div className="mb-4 flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(name)} text-[12px] font-bold text-white select-none`}
                        >
                            {initials(name)}
                        </div>
                        <div>
                            <p className="text-ds-text text-[14px] font-semibold">{name ?? '—'}</p>
                            {position && <p className="text-ds-text3 text-[12px]">{position}</p>}
                            {pending.kind === 'mention' && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                                    Mention
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-ds-text2 text-[13px]">
                        Voulez-vous ajouter {pending.kind === 'mention' ? 'cette personne mentionnée' : 'ce commentateur'} à votre base de candidats ?
                        Son profil sera disponible pour vos futurs recrutements.
                    </p>
                </div>
                <div className="flex flex-col-reverse gap-2 px-4 pb-4 sm:flex-row sm:justify-end sm:px-6 sm:pb-5">
                    <button
                        onClick={onClose}
                        className="border-ds-border text-ds-text2 hover:bg-ds-bg3/40 rounded-lg border px-4 py-2.5 text-center text-[13px] font-medium transition sm:py-2"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-[#6C63FF] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90 sm:py-2"
                    >
                        <Plus size={13} />
                        Confirmer
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function MentionPill({ mention, onAdd }: { mention: Mention; onAdd: () => void }) {
    const profileUrl = mention.linkedinUrl ?? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(mention.name)}`;

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6C63FF]/25 bg-[#6C63FF]/10 px-2.5 py-0.5 text-[12px] font-medium text-[#6C63FF] dark:bg-[#6C63FF]/15 dark:text-[#a78bfa]">
            <a
                href={safeUrl(profileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
                title={mention.linkedinUrl ? 'Voir le profil LinkedIn' : 'Rechercher sur LinkedIn'}
            >
                @{mention.name}
                <ExternalLink size={10} className="shrink-0 opacity-60" />
            </a>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                }}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-[#6C63FF]/20 text-[#6C63FF] transition hover:bg-[#6C63FF] hover:text-white"
                title={`Ajouter ${mention.name} à la base candidats`}
            >
                <Plus size={9} />
            </button>
        </span>
    );
}

function CommentaryWithMentions({
    commentary,
    mentions,
    onAddMention,
}: {
    commentary: string;
    mentions: Mention[] | null;
    onAddMention: (m: Mention) => void;
}) {
    // Structured mentions from Apify
    if (mentions && mentions.length > 0) {
        let remaining = commentary;
        const parts: React.ReactNode[] = [];

        mentions.forEach((mention, idx) => {
            const mentionIdx = remaining.indexOf(mention.name);
            if (mentionIdx === -1) return;
            if (mentionIdx > 0) {
                parts.push(<span key={`text-${idx}`}>{remaining.slice(0, mentionIdx)}</span>);
            }
            parts.push(<MentionPill key={`mention-${idx}`} mention={mention} onAdd={() => onAddMention(mention)} />);
            remaining = remaining.slice(mentionIdx + mention.name.length);
        });

        if (remaining) parts.push(<span key="tail">{remaining}</span>);

        if (parts.length === 0) {
            mentions.forEach((mention, idx) => {
                parts.push(<MentionPill key={`mention-only-${idx}`} mention={mention} onAdd={() => onAddMention(mention)} />);
            });
        }

        return <p className="text-ds-text2 flex flex-wrap items-center gap-1 text-[13px] leading-relaxed">{parts}</p>;
    }

    return <p className="text-ds-text2 text-[13px] leading-relaxed">{commentary}</p>;
}

// ── Comment card ──────────────────────────────────────────────────────────────

function CommentCard({
    comment,
    campaignId,
    alreadyAdded,
    onAdd,
    onAddMention,
    viewLabel,
}: {
    comment: Comment & { post: Post };
    campaignId: number;
    alreadyAdded: boolean;
    onAdd: () => void;
    onAddMention: (m: Mention, postId: number, campaignId: number) => void;
    viewLabel: string;
}) {
    return (
        <div className="bg-ds-surface border-ds-border flex flex-col gap-3 rounded-2xl border p-5">
            {/* Header: commenter + actions */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(comment.commenter_name)} text-[13px] font-bold text-white select-none`}
                    >
                        {initials(comment.commenter_name)}
                    </div>
                    <div className="min-w-0">
                        {comment.commenter_linkedin_url ? (
                            <a
                                href={safeUrl(comment.commenter_linkedin_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-ds-text inline-flex items-center gap-1 text-[14px] font-semibold hover:underline"
                            >
                                {comment.commenter_name ?? '—'}
                                <ExternalLink size={11} className="text-ds-text3 shrink-0" />
                            </a>
                        ) : (
                            <p className="text-ds-text text-[14px] font-semibold">{comment.commenter_name ?? '—'}</p>
                        )}
                        {comment.commenter_position && (
                            <p className="text-ds-text3 max-w-[280px] truncate text-[12px]">{comment.commenter_position}</p>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {comment.commented_at && <span className="text-ds-text3 text-[11px]">{dayjs(comment.commented_at).fromNow()}</span>}
                    {alreadyAdded ? (
                        <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                            title="Déjà dans la base"
                        >
                            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    ) : (
                        <button
                            onClick={onAdd}
                            className="border-ds-border text-ds-text3 inline-flex h-8 w-8 items-center justify-center rounded-full border transition hover:border-[#6C63FF]/40 hover:bg-[#6C63FF]/5 hover:text-[#6C63FF]"
                            title="Ajouter à la base candidats"
                        >
                            <Plus size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Comment text with inline mention pills */}
            <CommentaryWithMentions
                commentary={comment.commentary}
                mentions={comment.mentions}
                onAddMention={(m) => onAddMention(m, comment.post.id, campaignId)}
            />

            {/* Source: company page + post */}
            <div className="border-ds-border flex flex-wrap items-center gap-2 border-t pt-1">
                <span className="text-ds-text3 text-[11px] font-medium tracking-wide uppercase">Source</span>
                {comment.post.author_name && (
                    <a
                        href={safeUrl(comment.post.author_linkedin_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-ds-border bg-ds-bg text-ds-text2 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition hover:border-[#6C63FF]/30 hover:text-[#6C63FF]"
                    >
                        <Building2 size={10} className="shrink-0" />
                        {comment.post.author_name}
                    </a>
                )}
                {comment.post.linkedin_url && (
                    <a
                        href={safeUrl(comment.post.linkedin_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-ds-border bg-ds-bg text-ds-text2 inline-flex max-w-[340px] items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition hover:border-[#6C63FF]/30 hover:text-[#6C63FF]"
                        title={comment.post.content}
                    >
                        <FileText size={10} className="shrink-0" />
                        <span className="truncate">{comment.post.content?.slice(0, 60)}…</span>
                        <ExternalLink size={9} className="shrink-0 opacity-60" />
                    </a>
                )}
                {comment.candidat && <CandidatBadge candidat={comment.candidat} viewLabel={viewLabel} />}
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type StreamLog = { id: number; text: string; kind: 'info' | 'progress' | 'done' | 'error' };

export default function Show({ sourcingCampaign, enrichment }: ShowProps) {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
    const [commentsView, setCommentsView] = useState<'card' | 'table'>('table');
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [pending, setPending] = useState<PendingAdd | null>(null);
    const [addingIds, setAddingIds] = useState<Set<number>>(new Set());

    const isRunning = sourcingCampaign.status === 'pending' || sourcingCampaign.status === 'running';
    const enrichmentInProgress = sourcingCampaign.status === 'completed' && !enrichment.done && enrichment.total > 0;

    const [streamLogs, setStreamLogs] = useState<StreamLog[]>([]);
    const [streamPostsStored, setStreamPostsStored] = useState(0);
    const [streamPostsTotal, setStreamPostsTotal] = useState(0);
    const [streamPhase, setStreamPhase] = useState<'connecting' | 'running' | 'done' | 'error'>('connecting');
    const logIdRef = useRef(0);
    const logsEndRef = useRef<HTMLDivElement>(null);

    function pushLog(text: string, kind: StreamLog['kind'] = 'info') {
        setStreamLogs((prev) => [...prev, { id: logIdRef.current++, text, kind }]);
        setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }

    const sseRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!isRunning) return;
        setStreamPhase('connecting');
        pushLog('Connexion au serveur de collecte…');
        const url = route('dashboard.sourcing-campaigns.stream') + `?campaign_id=${sourcingCampaign.id}`;
        const es = new EventSource(url, { withCredentials: true });
        sseRef.current = es;
        es.addEventListener('status', (e) => {
            const data = JSON.parse((e as MessageEvent).data);
            setStreamPhase('running');
            pushLog(data.message === 'running' ? 'Collecte LinkedIn en cours…' : data.message);
        });
        es.addEventListener('progress', (e) => {
            const data = JSON.parse((e as MessageEvent).data);
            setStreamPostsStored(data.stored ?? 0);
            setStreamPostsTotal(data.total ?? 0);
            pushLog(`${data.stored} / ${data.total} posts traités…`, 'progress');
        });
        es.addEventListener('done', (e) => {
            const data = JSON.parse((e as MessageEvent).data);
            setStreamPhase('done');
            pushLog(
                data.status === 'completed' ? `✓ Collecte terminée — ${data.posts_stored ?? 0} post(s) stocké(s).` : 'Campagne terminée.',
                'done',
            );
            es.close();
            setTimeout(() => router.reload({ only: ['sourcingCampaign', 'enrichment'] }), 1200);
        });
        es.addEventListener('error', (e) => {
            const raw = (e as MessageEvent).data;
            const msg = raw ? JSON.parse(raw)?.message : 'Erreur de connexion au flux.';
            setStreamPhase('error');
            pushLog(msg ?? 'Erreur inattendue.', 'error');
            es.close();
            setTimeout(() => router.reload({ only: ['sourcingCampaign', 'enrichment'] }), 2000);
        });
        return () => {
            es.close();
        };
    }, [sourcingCampaign.id, isRunning]);

    useEffect(() => {
        if (!enrichmentInProgress) return;
        const interval = setInterval(() => {
            router.reload({ only: ['enrichment'] });
        }, 5000);
        return () => clearInterval(interval);
    }, [enrichmentInProgress]);

    const statusLabel = t(`sourcing_campaigns.show.status.${sourcingCampaign.status}`) || sourcingCampaign.status;
    const pageTitle = sourcingCampaign.brief?.title
        ? sourcingCampaign.brief.title
        : t('sourcing_campaigns.show.title').replace(':id', String(sourcingCampaign.id));

    const enrichPct = enrichment.total > 0 ? Math.round((enrichment.enriched / enrichment.total) * 100) : 0;
    const keywords = sourcingCampaign.search_queries ?? [];

    const allComments: Array<Comment & { post: Post }> = sourcingCampaign.posts.flatMap((post) => post.comments.map((c) => ({ ...c, post })));

    function handleAddCandidat(comment: Comment) {
        setPending({ kind: 'commenter', comment });
    }

    function handleAddMention(mention: Mention, postId: number, campaignId: number) {
        setPending({ kind: 'mention', name: mention.name, linkedinUrl: mention.linkedinUrl, postId, campaignId });
    }

    function handleConfirmAdd() {
        if (!pending) return;
        const snap = pending;
        setPending(null);

        if (snap.kind === 'commenter') {
            const commentId = snap.comment.id;
            setAddingIds((prev) => new Set(prev).add(commentId));

            router.post(
                route('dashboard.sourcing-campaigns.add-candidat', commentId),
                {},
                {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        const flash = (page.props as Record<string, unknown>).flash as Record<string, string> | undefined;
                        toast.success(flash?.success ?? 'Candidat ajouté.');
                        router.reload({ only: ['sourcingCampaign'] });
                    },
                    onError: () => {
                        toast.error('Une erreur est survenue. Veuillez réessayer.');
                        setAddingIds((prev) => {
                            const s = new Set(prev);
                            s.delete(commentId);
                            return s;
                        });
                    },
                },
            );
        } else {
            router.post(
                route('dashboard.sourcing-campaigns.add-mentioned-candidat'),
                {
                    name: snap.name,
                    linkedin_url: snap.linkedinUrl,
                    sourcing_campaign_id: snap.campaignId,
                    post_id: snap.postId,
                },
                {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        const flash = (page.props as Record<string, unknown>).flash as Record<string, string> | undefined;
                        toast.success(flash?.success ?? 'Candidat ajouté.');
                    },
                    onError: () => {
                        toast.error('Une erreur est survenue. Veuillez réessayer.');
                    },
                },
            );
        }
    }

    return (
        <>
            <Head title={pageTitle} />
            <AppSidebarLayout>
                <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
                <div className="bg-ds-bg text-ds-text min-h-screen p-4 sm:p-8">
                    {/* ── Header ── */}
                    <div className="mb-6 flex items-start gap-3">
                        <Link
                            href={route('dashboard.sourcing-campaigns.index')}
                            className="border-ds-border bg-ds-surface text-ds-text2 hover:border-ds-border2 hover:text-ds-text mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition"
                            title={t('sourcing_campaigns.show.breadcrumb.back')}
                        >
                            <ArrowLeft size={16} />
                        </Link>
                        <div className="min-w-0 flex-1">
                            <Link
                                href={route('dashboard.sourcing-campaigns.index')}
                                className="text-ds-text3 hover:text-ds-accent text-xs transition"
                            >
                                {t('sourcing_campaigns.show.breadcrumb.all')}
                            </Link>
                            <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
                            <p className="text-ds-text3 text-sm">{t('sourcing_campaigns.show.subtitle')}</p>
                        </div>
                        <div className="mt-1 shrink-0">
                            <ShowSourcingCampaignStatusBadge status={sourcingCampaign.status} label={statusLabel} />
                        </div>
                    </div>

                    {/* ── Meta bar ── */}
                    {/* Mobile: 2×2 grid; sm+: horizontal flex */}
                    <div className="border-ds-border bg-ds-border sm:divide-ds-border mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:flex sm:gap-0 sm:divide-x sm:bg-transparent">
                        {sourcingCampaign.brief && (
                            <div className="bg-ds-surface col-span-2 flex min-w-0 items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 sm:h-8 sm:w-8 dark:bg-blue-500/10">
                                    <FileText size={13} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-ds-text3 mb-0.5 text-[10px] font-medium tracking-wide uppercase">Brief</p>
                                    <p className="text-ds-text truncate text-[13px] font-semibold">{sourcingCampaign.brief.title}</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-ds-surface col-span-2 flex min-w-0 items-center gap-2 px-3 py-3 sm:flex-[1.4] sm:gap-3 sm:px-5 sm:py-3.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/10 sm:h-8 sm:w-8">
                                <Search size={13} className="text-[#6C63FF]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-ds-text3 mb-1 text-[10px] font-medium tracking-wide uppercase">
                                    {t('sourcing_campaigns.show.cards.search_queries.title')}
                                </p>
                                {keywords.length === 0 ? (
                                    <span className="text-ds-text3 text-xs italic">—</span>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {keywords.map((kw) => (
                                            <span
                                                key={kw}
                                                className="inline-flex items-center gap-1 rounded-full bg-[#6C63FF]/10 px-2 py-0.5 text-[11px] font-semibold text-[#6C63FF] dark:bg-[#6C63FF]/15 dark:text-[#a78bfa]"
                                            >
                                                <Search size={9} />
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-ds-surface flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 sm:h-8 sm:w-8 dark:bg-blue-500/10">
                                <FileText size={13} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-ds-text3 text-[10px] font-medium tracking-wide uppercase">
                                    {t('sourcing_campaigns.show.cards.posts.title')}
                                </p>
                                <p className="text-ds-text text-[15px] leading-tight font-bold sm:text-[17px]">
                                    {sourcingCampaign.posts.length}
                                    {isRunning && sourcingCampaign.posts.length > 0 && (
                                        <span className="ml-1.5 text-[10px] font-semibold text-blue-500">↑</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="bg-ds-surface flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 sm:h-8 sm:w-8 dark:bg-emerald-500/10">
                                <Users size={13} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-ds-text3 text-[10px] font-medium tracking-wide uppercase">Commentateurs</p>
                                <p className="text-ds-text text-[15px] leading-tight font-bold sm:text-[17px]">
                                    {enrichment.total > 0 ? enrichment.total : '—'}
                                </p>
                                {enrichment.total > 0 && <p className="text-ds-text3 text-[10px] sm:text-[11px]">candidats potentiels</p>}
                            </div>
                        </div>

                        {enrichment.total > 0 && (
                            <div className="bg-ds-surface col-span-2 flex items-center gap-2 px-3 py-3 sm:flex-[1.4] sm:gap-3 sm:px-5 sm:py-3.5">
                                <div
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${enrichment.done ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-[#6C63FF]/10'}`}
                                >
                                    <Sparkles size={13} className={enrichment.done ? 'text-emerald-500' : 'text-[#6C63FF]'} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p
                                            className={`text-[10px] font-semibold tracking-wide uppercase ${enrichment.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#6C63FF]'}`}
                                        >
                                            {t('sourcing_campaigns.show.cards.enrichment.label')}
                                        </p>
                                        <span className="text-[11px] font-bold text-[#6C63FF]">{enrichPct}%</span>
                                    </div>
                                    <p className="text-ds-text text-[15px] leading-tight font-bold sm:text-[17px]">
                                        {enrichment.enriched}{' '}
                                        <span className="text-ds-text3 text-[12px] font-normal sm:text-[13px]">/ {enrichment.total}</span>
                                    </p>
                                    <div className="bg-ds-bg3 mt-1.5 h-1 w-full overflow-hidden rounded-full">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${enrichment.done ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#6C63FF] to-[#9f97ff]'}`}
                                            style={{ width: `${enrichPct}%` }}
                                        />
                                    </div>
                                    <p className="text-ds-text3 mt-1 text-[10px] sm:text-[11px]">
                                        {enrichment.done
                                            ? t('sourcing_campaigns.show.cards.enrichment.complete')
                                            : t('sourcing_campaigns.show.cards.enrichment.running')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Running overlay ── */}
                    {isRunning && (
                        <div className="mb-6 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/[0.07]">
                            {/* Header */}
                            <div className="flex items-center gap-2 border-b border-blue-200/70 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4 dark:border-blue-500/20">
                                <span className="relative flex h-3 w-3">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
                                </span>
                                <p className="text-[14px] font-semibold text-blue-700 dark:text-blue-300">
                                    {streamPhase === 'connecting' && 'Connexion en cours…'}
                                    {streamPhase === 'running' && 'Collecte LinkedIn en cours…'}
                                    {streamPhase === 'done' && 'Collecte terminée — rechargement…'}
                                    {streamPhase === 'error' && 'Une erreur est survenue'}
                                </p>
                                {streamPostsTotal > 0 && (
                                    <span className="ml-auto text-[13px] font-bold text-blue-600 tabular-nums dark:text-blue-400">
                                        {streamPostsStored} / {streamPostsTotal}
                                    </span>
                                )}
                            </div>

                            {/* Progress bar */}
                            {streamPostsTotal > 0 && (
                                <div className="h-1 bg-blue-100 dark:bg-blue-500/20">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${Math.round((streamPostsStored / streamPostsTotal) * 100)}%` }}
                                    />
                                </div>
                            )}

                            {/* Log feed */}
                            <div className="max-h-[160px] space-y-1 overflow-y-auto px-3 py-3 font-mono text-[11px] sm:px-5 sm:text-[12px]">
                                {streamLogs.length === 0 && <p className="animate-pulse text-blue-400">En attente du flux…</p>}
                                {streamLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className={`flex items-start gap-2 ${
                                            log.kind === 'done'
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : log.kind === 'error'
                                                  ? 'text-red-500'
                                                  : log.kind === 'progress'
                                                    ? 'text-blue-500 dark:text-blue-300'
                                                    : 'text-blue-600/70 dark:text-blue-300/60'
                                        }`}
                                    >
                                        <span className="mt-[2px] shrink-0 opacity-50">›</span>
                                        <span>{log.text}</span>
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                            </div>
                        </div>
                    )}

                    {/* ── Tabs ── */}
                    <div className="border-ds-border mb-5 flex items-center gap-1 border-b">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                                activeTab === 'posts' ? 'border-[#6C63FF] text-[#6C63FF]' : 'text-ds-text3 hover:text-ds-text2 border-transparent'
                            }`}
                        >
                            <FileText size={13} />
                            {t('sourcing_campaigns.show.posts_section.title')}
                            <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === 'posts' ? 'bg-[#6C63FF]/10 text-[#6C63FF]' : 'bg-ds-bg3 text-ds-text3'}`}
                            >
                                {sourcingCampaign.posts.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                                activeTab === 'comments' ? 'border-[#6C63FF] text-[#6C63FF]' : 'text-ds-text3 hover:text-ds-text2 border-transparent'
                            }`}
                        >
                            <MessageSquare size={13} />
                            Commentaires
                            <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === 'comments' ? 'bg-[#6C63FF]/10 text-[#6C63FF]' : 'bg-ds-bg3 text-ds-text3'}`}
                            >
                                {allComments.length}
                            </span>
                        </button>
                    </div>

                    {/* ── Posts tab ── */}
                    {activeTab === 'posts' && (
                        <>
                            {sourcingCampaign.posts.length === 0 ? (
                                <div className="border-ds-border bg-ds-surface flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center">
                                    <FileText size={28} className="text-ds-text3 mb-3 opacity-40" />
                                    <p className="text-ds-text2 text-sm font-medium">
                                        {isRunning
                                            ? 'Collection en cours — les posts apparaîtront ici.'
                                            : t('sourcing_campaigns.show.posts_section.empty_done')}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-ds-surface border-ds-border overflow-hidden overflow-x-auto rounded-2xl border">
                                    <table className="w-full min-w-[560px] border-collapse text-[13px]">
                                        <thead>
                                            <tr className="border-ds-border bg-ds-bg3/30 border-b">
                                                <th className="text-ds-text3 w-[220px] px-5 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                    Auteur
                                                </th>
                                                <th className="text-ds-text3 px-5 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                    Aperçu du post
                                                </th>
                                                <th className="text-ds-text3 w-[130px] px-5 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                    Commentaires
                                                </th>
                                                <th className="w-[60px] px-5 py-3" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-ds-border divide-y">
                                            {sourcingCampaign.posts.map((post) => (
                                                <tr key={post.id} className="hover:bg-ds-bg3/20 transition-colors">
                                                    <td className="px-5 py-3.5 align-middle">
                                                        <div className="flex items-center gap-2.5">
                                                            <div
                                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold select-none ${avatarFlat(post.author_name)}`}
                                                            >
                                                                {initials(post.author_name)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <a
                                                                    href={safeUrl(post.author_linkedin_url)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-ds-text block max-w-[160px] truncate font-semibold hover:underline"
                                                                >
                                                                    {post.author_name ?? t('sourcing_campaigns.show.post_card.unknown_author')}
                                                                </a>
                                                                {post.author_info && (
                                                                    <p className="text-ds-text3 max-w-[160px] truncate text-[11px]">
                                                                        {post.author_info}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 align-middle">
                                                        <p className="text-ds-text2 line-clamp-2 max-w-[480px] text-[12px] leading-relaxed">
                                                            {post.content}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-3.5 align-middle">
                                                        {post.comments.length > 0 ? (
                                                            <button
                                                                onClick={() => setSelectedPost(post)}
                                                                className="border-ds-border bg-ds-bg text-ds-text2 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition hover:border-[#6C63FF]/40 hover:bg-[#6C63FF]/5 hover:text-[#6C63FF]"
                                                            >
                                                                <MessageSquare size={12} />
                                                                {post.comments.length}
                                                            </button>
                                                        ) : (
                                                            <span className="text-ds-text3 text-[12px]">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5 align-middle">
                                                        {post.linkedin_url && (
                                                            <a
                                                                href={safeUrl(post.linkedin_url)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-ds-text3 transition hover:text-[#6C63FF]"
                                                                title={t('sourcing_campaigns.show.posts_section.view_post')}
                                                            >
                                                                <ExternalLink size={14} />
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Comments tab ── */}
                    {activeTab === 'comments' && (
                        <>
                            {allComments.length === 0 ? (
                                <div className="border-ds-border bg-ds-surface flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center">
                                    <MessageSquare size={28} className="text-ds-text3 mb-3 opacity-40" />
                                    <p className="text-ds-text2 text-sm font-medium">
                                        {isRunning
                                            ? 'Collection en cours — les commentaires apparaîtront ici.'
                                            : t('sourcing_campaigns.show.posts_section.no_comments')}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* View toggle */}
                                    <div className="mb-4 flex justify-end">
                                        <div className="border-ds-border bg-ds-surface inline-flex items-center gap-0.5 rounded-lg border p-0.5">
                                            <button
                                                onClick={() => setCommentsView('card')}
                                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition ${commentsView === 'card' ? 'bg-[#6C63FF] text-white shadow-sm' : 'text-ds-text3 hover:text-ds-text2'}`}
                                            >
                                                <LayoutGrid size={13} />
                                                Cartes
                                            </button>
                                            <button
                                                onClick={() => setCommentsView('table')}
                                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition ${commentsView === 'table' ? 'bg-[#6C63FF] text-white shadow-sm' : 'text-ds-text3 hover:text-ds-text2'}`}
                                            >
                                                <List size={13} />
                                                Tableau
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card view */}
                                    {commentsView === 'card' && (
                                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                            {allComments.map((comment) => (
                                                <CommentCard
                                                    key={comment.id}
                                                    comment={comment}
                                                    campaignId={sourcingCampaign.id}
                                                    alreadyAdded={!!comment.candidat || addingIds.has(comment.id)}
                                                    onAdd={() => handleAddCandidat(comment)}
                                                    onAddMention={handleAddMention}
                                                    viewLabel={t('sourcing_campaigns.show.candidat_badge.view')}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Table view */}
                                    {commentsView === 'table' && (
                                        <div className="bg-ds-surface border-ds-border overflow-hidden overflow-x-auto rounded-2xl border">
                                            <table className="w-full min-w-[700px] border-collapse text-[13px]">
                                                <thead>
                                                    <tr className="border-ds-border bg-ds-bg3/30 border-b">
                                                        <th className="text-ds-text3 w-[210px] px-5 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                            {t('sourcing_campaigns.show.comments_table.commenter')}
                                                        </th>
                                                        <th className="text-ds-text3 px-5 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                            {t('sourcing_campaigns.show.comments_table.comment')}
                                                        </th>
                                                        <th className="text-ds-text3 w-[120px] px-5 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                            Source
                                                        </th>
                                                        <th className="text-ds-text3 w-[90px] px-5 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                            Date
                                                        </th>
                                                        <th className="text-ds-text3 w-[150px] px-5 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                            {t('sourcing_campaigns.show.comments_table.candidate')}
                                                        </th>
                                                        <th className="w-[52px] px-5 py-3" />
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-ds-border divide-y">
                                                    {allComments.map((comment) => {
                                                        const alreadyAdded = !!comment.candidat || addingIds.has(comment.id);
                                                        return (
                                                            <tr key={comment.id} className="hover:bg-ds-bg3/20 transition-colors">
                                                                <td className="px-5 py-3.5 align-top">
                                                                    <div className="flex items-start gap-2.5">
                                                                        <div
                                                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(comment.commenter_name)} mt-0.5 text-[11px] font-bold text-white select-none`}
                                                                        >
                                                                            {initials(comment.commenter_name)}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <a
                                                                                href={safeUrl(comment.commenter_linkedin_url)}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-ds-text block max-w-[140px] truncate font-semibold hover:underline"
                                                                            >
                                                                                {comment.commenter_name ?? '—'}
                                                                            </a>
                                                                            {comment.commenter_position && (
                                                                                <p className="text-ds-text3 max-w-[140px] truncate text-[11px]">
                                                                                    {comment.commenter_position}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="max-w-[300px] px-5 py-3.5 align-top">
                                                                    <CommentaryWithMentions
                                                                        commentary={comment.commentary}
                                                                        mentions={comment.mentions}
                                                                        onAddMention={(m) =>
                                                                            handleAddMention(m, comment.post.id, sourcingCampaign.id)
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="px-5 py-3.5 align-top">
                                                                    <div className="flex flex-col gap-1">
                                                                        {comment.post.author_name && (
                                                                            <a
                                                                                href={safeUrl(comment.post.author_linkedin_url)}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-ds-text2 inline-flex max-w-[110px] items-center gap-1 truncate text-[11px] transition hover:text-[#6C63FF]"
                                                                            >
                                                                                <Building2 size={10} className="shrink-0" />
                                                                                <span className="truncate">{comment.post.author_name}</span>
                                                                            </a>
                                                                        )}
                                                                        {comment.post.linkedin_url && (
                                                                            <a
                                                                                href={safeUrl(comment.post.linkedin_url)}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-ds-text3 inline-flex max-w-[110px] items-center gap-1 truncate text-[11px] transition hover:text-[#6C63FF]"
                                                                                title={comment.post.content}
                                                                            >
                                                                                <FileText size={10} className="shrink-0" />
                                                                                <span className="truncate">Voir le post</span>
                                                                                <ExternalLink size={9} className="shrink-0 opacity-60" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="text-ds-text3 px-5 py-3.5 align-top text-[12px] whitespace-nowrap">
                                                                    {comment.commented_at ? dayjs(comment.commented_at).fromNow() : '—'}
                                                                </td>
                                                                <td className="px-5 py-3.5 align-top">
                                                                    <CandidatBadge
                                                                        candidat={comment.candidat}
                                                                        viewLabel={t('sourcing_campaigns.show.candidat_badge.view')}
                                                                    />
                                                                </td>
                                                                <td className="px-5 py-3.5 align-top">
                                                                    {alreadyAdded ? (
                                                                        <span
                                                                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                                                                            title="Déjà dans la base"
                                                                        >
                                                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                                                <path
                                                                                    d="M2 6l3 3 5-5"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="1.8"
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                />
                                                                            </svg>
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleAddCandidat(comment)}
                                                                            className="border-ds-border text-ds-text3 inline-flex h-7 w-7 items-center justify-center rounded-full border transition hover:border-[#6C63FF]/40 hover:bg-[#6C63FF]/5 hover:text-[#6C63FF]"
                                                                            title="Ajouter à la base candidats"
                                                                        >
                                                                            <Plus size={13} />
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* ── Modals ── */}
                <CommentsModal post={selectedPost} open={selectedPost !== null} onClose={() => setSelectedPost(null)} t={t} />
                <ConfirmAddCandidatModal pending={pending} open={pending !== null} onClose={() => setPending(null)} onConfirm={handleConfirmAdd} />
            </AppSidebarLayout>
        </>
    );
}
