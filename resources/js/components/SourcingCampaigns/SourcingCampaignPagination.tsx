import { useI18n } from '@/hooks/useI18n';
import { router } from '@inertiajs/react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationMeta {
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

export function SourcingCampaignPagination({ meta }: { meta: PaginationMeta }) {
    const { t } = useI18n();
    const { current_page, last_page, from, to, total } = meta;
    if (last_page <= 1) return null;

    function goTo(page: number) {
        router.get(route('dashboard.sourcing-campaigns.index'), { page }, { preserveState: true, preserveScroll: false });
    }

    const pages = Array.from({ length: last_page }, (_, i) => i + 1);
    const visible = pages.filter((p) => p === 1 || p === last_page || Math.abs(p - current_page) <= 2);

    const btnBase = 'flex h-7 min-w-[28px] items-center justify-center rounded-lg border px-2 text-[12px] font-medium transition';
    const btnIdle = 'border-ds-border text-ds-text2 hover:border-ds-border2 hover:text-ds-text hover:bg-ds-bg3/60';
    const btnActive = 'border-ds-accent bg-ds-accent text-white shadow-sm';
    const btnDisabled = 'border-ds-border text-ds-text3 cursor-not-allowed opacity-40';

    const summary =
        from != null && to != null
            ? t('sourcing_campaigns.index.pagination.summary_range')
                  .replace(':from', String(from))
                  .replace(':to', String(to))
                  .replace(':total', String(total))
            : t('sourcing_campaigns.index.pagination.summary_total').replace(':total', String(total));

    return (
        <div className="mt-4 flex items-center justify-between text-[13px]">
            <p className="text-ds-text3">{summary}</p>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => goTo(current_page - 1)}
                    disabled={current_page === 1}
                    className={`${btnBase} ${current_page === 1 ? btnDisabled : btnIdle}`}
                    aria-label={t('sourcing_campaigns.index.pagination.previous')}
                >
                    <ChevronLeft size={13} />
                </button>

                {visible.map((p, i) => (
                    <span key={p} className="flex items-center gap-1">
                        {i > 0 && visible[i - 1] !== p - 1 && <span className="text-ds-text3 px-0.5">…</span>}
                        <button
                            onClick={() => goTo(p)}
                            className={`${btnBase} ${p === current_page ? btnActive : btnIdle}`}
                            aria-current={p === current_page ? 'page' : undefined}
                        >
                            {p}
                        </button>
                    </span>
                ))}

                <button
                    onClick={() => goTo(current_page + 1)}
                    disabled={current_page === last_page}
                    className={`${btnBase} ${current_page === last_page ? btnDisabled : btnIdle}`}
                    aria-label={t('sourcing_campaigns.index.pagination.next')}
                >
                    <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}
