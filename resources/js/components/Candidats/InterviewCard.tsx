import { PLATFORM_LABEL, STATUS_CFG, VERDICT_CFG } from '@/constants/interviews';
import { useI18n } from '@/hooks/useI18n';
import { Interview } from '@/types/candidat';
import { Award, Calendar, Clock, MessageSquare, Monitor, User } from 'lucide-react';
import { useState } from 'react';
import { DecisionForm } from './DecisionForm';
import { HistoryBadge } from './HistoryBadge';

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function InterviewCard({ interview }: { interview: Interview }) {
    const { t } = useI18n();
    const [showForm, setShowForm] = useState(false);

    const statusCfg = STATUS_CFG[interview.status] ?? { label: interview.status, cls: '' };
    const verdictCfg = interview.report ? VERDICT_CFG[interview.report.verdict] : null;

    const decisionLabel =
        interview.decision === 'accepted'
            ? t('historique.index.decision.accepted')
            : interview.decision === 'rejected'
              ? t('historique.index.decision.rejected')
              : null;

    const decisionCls =
        interview.decision === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-ds-red/10 text-ds-red border-ds-red/20';

    return (
        <div className="border-ds-border bg-ds-surface hover:border-ds-accent/30 rounded-2xl border p-5 transition">
            {/* Top row */}
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-ds-text truncate text-[15px] font-semibold">{interview.brief?.title ?? '—'}</p>
                    <p className="text-ds-text3 mt-0.5 text-[12px]">
                        {interview.brief?.sector}
                        {interview.brief?.sector && interview.brief?.contract_type ? ' · ' : ''}
                        {interview.brief?.contract_type}
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                    <HistoryBadge {...statusCfg} />
                    {verdictCfg && <HistoryBadge {...verdictCfg} />}
                    {interview.decision !== 'pending' && <HistoryBadge label={decisionLabel!} cls={decisionCls} />}
                </div>
            </div>

            {/* Meta row */}
            <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
                <span className="text-ds-text3 flex items-center gap-1.5 text-[12px]">
                    <Calendar size={12} className="text-ds-text3" />
                    {formatDate(interview.scheduled_at)}
                </span>
                <span className="text-ds-text3 flex items-center gap-1.5 text-[12px]">
                    <Monitor size={12} className="text-ds-text3" />
                    {PLATFORM_LABEL[interview.platform] ?? interview.platform}
                </span>
                {interview.interviewer && (
                    <span className="text-ds-text3 flex items-center gap-1.5 text-[12px]">
                        <User size={12} className="text-ds-text3" />
                        {interview.interviewer.name}
                    </span>
                )}
                {interview.ai_score !== null && (
                    <span className="text-ds-text3 flex items-center gap-1.5 text-[12px]">
                        <Award size={12} className="text-ds-accent" />
                        <span className="text-ds-accent font-medium">{interview.ai_score}/100</span>
                        <span className="text-ds-text3">{t('historique.interview_card.ai_label')}</span>
                    </span>
                )}
            </div>

            {/* AI recommendation */}
            {interview.report?.ai_recommendation && (
                <div className="border-ds-border bg-ds-bg mb-4 rounded-xl border p-3">
                    <p className="text-ds-text3 mb-1 text-[11px] font-medium tracking-wide uppercase">
                        {t('historique.interview_card.ai_recommendation')}
                    </p>
                    <p className="text-ds-text2 line-clamp-3 text-[12px] leading-relaxed">{interview.report.ai_recommendation}</p>
                </div>
            )}

            {/* Existing decision */}
            {interview.decision !== 'pending' && !showForm && (
                <div className="border-ds-border bg-ds-bg mb-4 rounded-xl border p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-ds-text3 text-[11px] font-medium tracking-wide uppercase">
                            {t('historique.interview_card.recruiter_decision')}
                        </p>
                        <div className="flex items-center gap-2">
                            {interview.decision_at && (
                                <span className="text-ds-text3 flex items-center gap-1 text-[11px]">
                                    <Clock size={10} />
                                    {formatDate(interview.decision_at)}
                                </span>
                            )}
                            {interview.decision_by && (
                                <span className="text-ds-text3 text-[11px]">
                                    {t('historique.interview_card.decided_by').replace('{name}', interview.decision_by.name)}
                                </span>
                            )}
                        </div>
                    </div>
                    {interview.decision_comment && (
                        <p className="text-ds-text2 flex items-start gap-1.5 text-[12px] leading-relaxed">
                            <MessageSquare size={12} className="text-ds-text3 mt-0.5 shrink-0" />
                            {interview.decision_comment}
                        </p>
                    )}
                </div>
            )}

            {/* Inline form */}
            {showForm && <DecisionForm interview={interview} onCancel={() => setShowForm(false)} />}

            {/* CTA */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="border-ds-border text-ds-text3 hover:border-ds-accent/40 hover:text-ds-accent mt-1 w-full rounded-lg border py-2 text-[12px] font-medium transition"
                >
                    {interview.decision === 'pending' ? t('historique.interview_card.actions.add') : t('historique.interview_card.actions.edit')}
                </button>
            )}
        </div>
    );
}
