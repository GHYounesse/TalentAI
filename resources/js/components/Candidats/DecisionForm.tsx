import { useI18n } from '@/hooks/useI18n';
import { Interview } from '@/types/candidat';
import { router } from '@inertiajs/react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

export function DecisionForm({ interview, onCancel }: { interview: Interview; onCancel: () => void }) {
    const { t } = useI18n();
    const [decision, setDecision] = useState<'accepted' | 'rejected'>(interview.decision !== 'pending' ? interview.decision : 'accepted');
    const [comment, setComment] = useState(interview.decision_comment ?? '');
    const [submitting, setSubmitting] = useState(false);

    function submit() {
        setSubmitting(true);
        router.post(
            route('dashboard.interviews.decide', interview.id),
            { decision, decision_comment: comment },
            { onFinish: () => setSubmitting(false) },
        );
    }

    return (
        <div className="border-ds-border bg-ds-bg mt-4 space-y-3 rounded-xl border p-4">
            <p className="text-ds-text text-[13px] font-semibold">{t('historique.decision_form.title')}</p>

            {/* Toggle accepted / rejected */}
            <div className="flex gap-2">
                <button
                    onClick={() => setDecision('accepted')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-[12px] font-medium transition ${
                        decision === 'accepted'
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-ds-border text-ds-text3 hover:border-emerald-500/40 hover:text-emerald-400'
                    }`}
                >
                    <ThumbsUp size={13} />
                    {t('historique.index.decision.accepted')}
                </button>
                <button
                    onClick={() => setDecision('rejected')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-[12px] font-medium transition ${
                        decision === 'rejected'
                            ? 'border-ds-red bg-ds-red/10 text-ds-red'
                            : 'border-ds-border text-ds-text3 hover:border-ds-red/40 hover:text-ds-red'
                    }`}
                >
                    <ThumbsDown size={13} />
                    {t('historique.index.decision.rejected')}
                </button>
            </div>

            {/* Comment */}
            <textarea
                rows={3}
                placeholder={t('historique.decision_form.comment_placeholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="border-ds-border bg-ds-surface text-ds-text placeholder-ds-text3 focus:border-ds-accent w-full resize-none rounded-lg border px-3 py-2 text-[12px] transition outline-none"
            />

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    className="border-ds-border text-ds-text3 hover:text-ds-text flex-1 rounded-lg border py-1.5 text-[12px] transition"
                >
                    {t('historique.decision_form.cancel')}
                </button>
                <button
                    onClick={submit}
                    disabled={submitting}
                    className="bg-ds-accent flex-1 rounded-lg py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#7C74FF] disabled:opacity-60"
                >
                    {submitting ? t('historique.decision_form.submitting') : t('historique.decision_form.confirm')}
                </button>
            </div>
        </div>
    );
}
