import { InterviewCard } from '@/components/Candidats/InterviewCard';
import { useI18n } from '@/hooks/useI18n';
import AppLayout from '@/layouts/app-layout';
import { CandidatHistoryProps } from '@/types/candidat';
import { Head, Link, usePage } from '@inertiajs/react';
import { Briefcase, Calendar, ChevronLeft, ExternalLink, MapPin } from 'lucide-react';

export default function Historique({ candidat, interviews }: CandidatHistoryProps) {
    const { t } = useI18n();
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flash = props.flash;

    const accepted = interviews.filter((i) => i.decision === 'accepted').length;
    const rejected = interviews.filter((i) => i.decision === 'rejected').length;
    const pending = interviews.filter((i) => i.decision === 'pending').length;

    return (
        <AppLayout>
            <Head title={t('historique.candidat.title').replace('{name}', candidat.full_name)} />

            <div className="bg-ds-bg min-h-full px-6 py-8">
                {/* Flash */}
                {flash?.success && (
                    <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-400">
                        {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="mb-6 flex items-start gap-3">
                    <Link
                        href={route('dashboard.candidats.index')}
                        className="border-ds-border text-ds-text3 hover:border-ds-accent/40 hover:bg-ds-accent/[0.06] hover:text-ds-accent mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition"
                    >
                        <ChevronLeft size={16} />
                    </Link>
                    <div>
                        <p className="text-ds-text3 mb-1 text-[12px]">
                            <Link href={route('dashboard.candidats.index')} className="hover:text-ds-text2 transition">
                                {t('historique.candidat.breadcrumb.candidats')}
                            </Link>{' '}
                            <span className="text-ds-text2">› {t('historique.candidat.breadcrumb.historique')}</span>
                        </p>
                        <h1 className="font-heading text-ds-text text-[26px] font-bold">{t('historique.candidat.heading')}</h1>
                        <p className="text-ds-text2 mt-1 text-[14px]">{t('historique.candidat.subtitle')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* ── LEFT : Profil candidat ── */}
                    <div className="space-y-4">
                        <div className="border-ds-border bg-ds-surface rounded-2xl border p-5">
                            {/* Avatar + nom */}
                            <div className="mb-4 flex items-center gap-3">
                                {candidat.profile_photo ? (
                                    <img src={candidat.profile_photo} alt={candidat.full_name} className="h-12 w-12 rounded-full object-cover" />
                                ) : (
                                    <div className="bg-ds-accent/10 text-ds-accent flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-bold">
                                        {candidat.full_name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-ds-text truncate text-[15px] font-semibold">{candidat.full_name}</p>
                                    {candidat.headline && <p className="text-ds-text3 truncate text-[12px]">{candidat.headline}</p>}
                                </div>
                            </div>

                            {/* Infos */}
                            <div className="space-y-2">
                                {candidat.current_title && (
                                    <div className="text-ds-text2 flex items-center gap-2 text-[12px]">
                                        <Briefcase size={12} className="text-ds-text3 shrink-0" />
                                        {candidat.current_title}
                                        {candidat.current_company && ` · ${candidat.current_company}`}
                                    </div>
                                )}
                                {candidat.location && (
                                    <div className="text-ds-text2 flex items-center gap-2 text-[12px]">
                                        <MapPin size={12} className="text-ds-text3 shrink-0" />
                                        {candidat.location}
                                    </div>
                                )}
                                {candidat.open_to_work && (
                                    <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                                        {t('historique.candidat.open_to_work')}
                                    </span>
                                )}
                            </div>

                            {/* LinkedIn */}
                            {candidat.linkedin_url && (
                                <a
                                    href={candidat.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border-ds-border text-ds-text3 hover:border-ds-accent/40 hover:text-ds-accent mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-[12px] font-medium transition"
                                >
                                    <ExternalLink size={12} />
                                    {t('historique.candidat.linkedin_link')}
                                </a>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="border-ds-border bg-ds-surface rounded-2xl border p-5">
                            <p className="text-ds-text2 mb-3 text-[12px] font-semibold tracking-wide uppercase">
                                {t('historique.candidat.summary.title')}
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-ds-text3 text-[12px]">{t('historique.candidat.summary.total')}</span>
                                    <span className="text-ds-text text-[13px] font-semibold">{interviews.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-ds-text3 text-[12px]">{t('historique.candidat.summary.accepted')}</span>
                                    <span className="text-[13px] font-semibold text-emerald-400">{accepted}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-ds-text3 text-[12px]">{t('historique.candidat.summary.rejected')}</span>
                                    <span className="text-ds-red text-[13px] font-semibold">{rejected}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-ds-text3 text-[12px]">{t('historique.index.decision.pending')}</span>
                                    <span className="text-ds-text3 text-[13px] font-semibold">{pending}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT : Liste des entretiens ── */}
                    <div className="lg:col-span-2">
                        {interviews.length === 0 ? (
                            <div className="border-ds-border bg-ds-surface flex flex-col items-center justify-center rounded-2xl border px-6 py-16 text-center">
                                <div className="bg-ds-accent/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                                    <Calendar size={22} className="text-ds-accent" />
                                </div>
                                <p className="text-ds-text mb-1 text-[15px] font-semibold">{t('historique.candidat.empty.title')}</p>
                                <p className="text-ds-text3 text-[13px]">{t('historique.candidat.empty.description')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {interviews.map((interview) => (
                                    <InterviewCard key={interview.id} interview={interview} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
