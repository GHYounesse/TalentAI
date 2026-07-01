import { SourcingCampaignPagination } from '@/components/SourcingCampaigns/SourcingCampaignPagination';
import { SourcingCampaignStatusBadge } from '@/components/SourcingCampaigns/SourcingCampaignStatusBadge';
import { useI18n } from '@/hooks/useI18n';
import AppLayout from '@/layouts/app-layout';
import { IndexProps } from '@/types/sourcing_campaigns';
import { Head, Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Clock, Eye, FileText, Plus, Search, Users } from 'lucide-react';

dayjs.extend(relativeTime);
dayjs.locale('fr');

const STALE_THRESHOLD_HOURS = 2;

export default function Index({ sourcingCampaigns }: IndexProps) {
    const { t } = useI18n();
    const runs = sourcingCampaigns.data ?? [];

    return (
        <>
            <Head title={t('sourcing_campaigns.index.title')} />
            <AppLayout>
                <div className="bg-ds-bg min-h-screen px-4 py-4 sm:px-6 sm:py-6">
                    {/* Header */}
                    <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
                        <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                                <span className="bg-ds-accent/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8">
                                    <Search size={13} className="text-ds-accent" />
                                </span>
                                <h1 className="font-heading text-ds-text truncate text-[18px] leading-none font-bold sm:text-[22px]">
                                    {t('sourcing_campaigns.index.title')}
                                </h1>
                            </div>
                            <p className="text-ds-text3 ml-[36px] text-[12px] sm:ml-[42px] sm:text-[13px]">
                                {t('sourcing_campaigns.index.subtitle')}
                            </p>
                        </div>

                        <Link
                            href={route('dashboard.sourcing-campaigns.create')}
                            className="bg-ds-accent flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98] sm:px-4 sm:py-2.5 sm:text-[13px]"
                        >
                            <Plus size={13} />
                            <span className="hidden sm:inline">{t('sourcing_campaigns.index.toolbar.new')}</span>
                            <span className="sm:hidden">Nouveau</span>
                        </Link>
                    </div>

                    {/* Empty state */}
                    {runs.length === 0 && (
                        <div className="border-ds-border bg-ds-surface flex flex-col items-center justify-center rounded-2xl border py-20 text-center">
                            <div className="bg-ds-accent/10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                                <Search size={22} className="text-ds-accent" />
                            </div>
                            <p className="font-heading text-ds-text text-[15px] font-semibold">{t('sourcing_campaigns.index.empty.title')}</p>
                            <p className="text-ds-text2 mt-1 px-4 text-[13px]">{t('sourcing_campaigns.index.empty.description')}</p>
                            <Link
                                href={route('dashboard.sourcing-campaigns.create')}
                                className="bg-ds-accent mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90"
                            >
                                <Plus size={14} />
                                {t('sourcing_campaigns.index.empty.cta')}
                            </Link>
                        </div>
                    )}

                    {runs.length > 0 && (
                        <>
                            {/* ── Mobile card list (hidden on sm+) ── */}
                            <div className="space-y-3 sm:hidden">
                                {runs.map((run) => {
                                    const inProgressStatus = run.status === 'pending' || run.status === 'running';
                                    const ageHours = dayjs().diff(dayjs(run.created_at), 'hour');
                                    const isStale = inProgressStatus && ageHours >= STALE_THRESHOLD_HOURS;
                                    const isLive = inProgressStatus && !isStale;
                                    const keywords = run.search_queries ?? [];

                                    return (
                                        <div
                                            key={run.id}
                                            className={`border-ds-border bg-ds-surface rounded-2xl border p-4 ${isLive ? 'border-blue-200 bg-blue-50/30 dark:border-blue-500/20 dark:bg-blue-500/5' : ''}`}
                                        >
                                            {/* Keywords + status */}
                                            <div className="mb-3 flex items-start justify-between gap-2">
                                                <div className="flex min-w-0 flex-wrap gap-1">
                                                    {isLive && <span className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-500" />}
                                                    {keywords.length === 0 ? (
                                                        <span className="text-ds-text3 text-xs italic">Aucun mot-clé</span>
                                                    ) : (
                                                        keywords.slice(0, 3).map((kw) => (
                                                            <span
                                                                key={kw}
                                                                className="inline-flex items-center gap-1 rounded-full bg-[#6C63FF]/10 px-2 py-0.5 text-[11px] font-medium text-[#6C63FF] dark:bg-[#6C63FF]/15 dark:text-[#a78bfa]"
                                                            >
                                                                <Search size={9} className="shrink-0" />
                                                                {kw}
                                                            </span>
                                                        ))
                                                    )}
                                                    {keywords.length > 3 && (
                                                        <span className="text-ds-text3 self-center text-[11px]">+{keywords.length - 3}</span>
                                                    )}
                                                </div>
                                                {isStale ? (
                                                    <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                        {t('sourcing_campaigns.index.status.stalled')}
                                                    </span>
                                                ) : (
                                                    <div className="shrink-0">
                                                        <SourcingCampaignStatusBadge status={run.status} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Brief */}
                                            {run.brief && (
                                                <div className="mb-2 flex items-center gap-1.5 text-[12px]">
                                                    <FileText size={11} className="text-ds-text3 shrink-0" />
                                                    <span className="text-ds-text2 truncate font-medium">{run.brief.title}</span>
                                                </div>
                                            )}

                                            {/* Stats row */}
                                            <div className="mb-3 flex items-center gap-4 text-[12px]">
                                                <span className="text-ds-text2 inline-flex items-center gap-1">
                                                    <FileText size={12} className="text-ds-text3" />
                                                    <span className="font-medium">{run.posts_count}</span>
                                                    <span className="text-ds-text3">posts</span>
                                                </span>
                                                {run.comments_count > 0 ? (
                                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                                        <Users size={12} />
                                                        {run.comments_count}
                                                        <span className="text-[11px] font-normal text-emerald-500/70">commentateurs</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-ds-text3 inline-flex items-center gap-1">
                                                        <Users size={12} />—
                                                    </span>
                                                )}
                                            </div>

                                            {/* Footer: date + view */}
                                            <div className="border-ds-border flex items-center justify-between border-t pt-3">
                                                <span className="text-ds-text3 inline-flex items-center gap-1 text-[11px]">
                                                    <Clock size={11} />
                                                    {dayjs(run.created_at).fromNow()}
                                                </span>
                                                <Link
                                                    href={route('dashboard.sourcing-campaigns.show', run.id)}
                                                    className="border-ds-border text-ds-text2 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition hover:border-[#6C63FF]/40 hover:text-[#6C63FF]"
                                                >
                                                    <Eye size={12} />
                                                    {t('sourcing_campaigns.index.table.view')}
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="border-ds-border border-t pt-3">
                                    <SourcingCampaignPagination meta={sourcingCampaigns} />
                                </div>
                            </div>

                            {/* ── Desktop table (hidden on mobile) ── */}
                            <div className="border-ds-border bg-ds-surface hidden overflow-hidden rounded-2xl border sm:block">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px] border-collapse text-[13px]">
                                        <thead>
                                            <tr className="border-ds-border bg-ds-bg3/30 border-b">
                                                <th className="text-ds-text3 px-4 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                    Brief
                                                </th>
                                                <th className="text-ds-text3 px-4 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                    Keywords
                                                </th>
                                                <th className="text-ds-text3 px-4 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                    {t('sourcing_campaigns.index.columns.posts')}
                                                </th>
                                                <th className="text-ds-text3 px-4 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                    Commenters
                                                </th>
                                                <th className="text-ds-text3 px-4 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                    {t('sourcing_campaigns.index.columns.status')}
                                                </th>
                                                <th className="text-ds-text3 px-4 py-3 text-left text-[10px] font-semibold tracking-[0.8px] uppercase">
                                                    {t('sourcing_campaigns.index.columns.started')}
                                                </th>
                                                <th className="px-4 py-3" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {runs.map((run) => {
                                                const inProgressStatus = run.status === 'pending' || run.status === 'running';
                                                const ageHours = dayjs().diff(dayjs(run.created_at), 'hour');
                                                const isStale = inProgressStatus && ageHours >= STALE_THRESHOLD_HOURS;
                                                const isLive = inProgressStatus && !isStale;
                                                const keywords = run.search_queries ?? [];
                                                const visibleKw = keywords.slice(0, 3);
                                                const hiddenKwCount = keywords.length - visibleKw.length;

                                                return (
                                                    <tr
                                                        key={run.id}
                                                        className={`border-ds-border group border-b transition-colors last:border-0 ${
                                                            isLive
                                                                ? 'bg-blue-50/40 hover:bg-blue-50/60 dark:bg-blue-500/5 dark:hover:bg-blue-500/8'
                                                                : 'hover:bg-ds-bg3/30'
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3.5">
                                                            {run.brief ? (
                                                                <span className="text-ds-text2 inline-flex max-w-[180px] items-center gap-1.5 truncate text-[12px] font-medium">
                                                                    <FileText size={11} className="text-ds-text3 shrink-0" />
                                                                    <span className="truncate">{run.brief.title}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-ds-text3">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                {isLive && (
                                                                    <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-blue-500" />
                                                                )}
                                                                {visibleKw.length === 0 ? (
                                                                    <span className="text-ds-text3 text-xs italic">No keywords</span>
                                                                ) : (
                                                                    <>
                                                                        {visibleKw.map((kw) => (
                                                                            <span
                                                                                key={kw}
                                                                                className="inline-flex items-center gap-1 rounded-full bg-[#6C63FF]/10 px-2 py-0.5 text-[11px] font-medium text-[#6C63FF] dark:bg-[#6C63FF]/15 dark:text-[#a78bfa]"
                                                                            >
                                                                                <Search size={9} className="shrink-0" />
                                                                                {kw}
                                                                            </span>
                                                                        ))}
                                                                        {hiddenKwCount > 0 && (
                                                                            <span className="text-ds-text3 text-[11px]">+{hiddenKwCount} more</span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <span className="text-ds-text2 inline-flex items-center gap-1.5">
                                                                <FileText size={12} className="text-ds-text3 shrink-0" />
                                                                <span className="font-medium">{run.posts_count}</span>
                                                                {isLive && run.posts_count > 0 && (
                                                                    <span className="text-[10px] font-semibold text-blue-500">↑</span>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            {run.comments_count > 0 ? (
                                                                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                                                    <Users size={12} className="shrink-0" />
                                                                    {run.comments_count}
                                                                    <span className="text-[11px] font-normal text-emerald-500/70 dark:text-emerald-500">
                                                                        potential candidates
                                                                    </span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-ds-text3 inline-flex items-center gap-1.5">
                                                                    <Users size={12} className="shrink-0" />—
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            {isStale ? (
                                                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                                                                    {t('sourcing_campaigns.index.status.stalled')}
                                                                </span>
                                                            ) : (
                                                                <SourcingCampaignStatusBadge status={run.status} />
                                                            )}
                                                        </td>
                                                        <td className="text-ds-text3 px-4 py-3.5 text-[12px]">
                                                            <span
                                                                className="inline-flex items-center gap-1.5"
                                                                title={dayjs(run.created_at).format('DD MMM YYYY, HH:mm')}
                                                            >
                                                                <Clock size={11} className="shrink-0" />
                                                                {dayjs(run.created_at).fromNow()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Link
                                                                    href={route('dashboard.sourcing-campaigns.show', run.id)}
                                                                    className="border-ds-border text-ds-text3 hover:border-ds-accent/40 hover:text-ds-accent hover:bg-ds-accent/5 flex h-7 w-7 items-center justify-center rounded-lg border transition"
                                                                    title={t('sourcing_campaigns.index.table.view')}
                                                                >
                                                                    <Eye size={13} />
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="border-ds-border border-t px-4 py-3">
                                    <SourcingCampaignPagination meta={sourcingCampaigns} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </AppLayout>
        </>
    );
}
