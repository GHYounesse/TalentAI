import { SOURCING_CAMPAIGN_STATUS_CONFIG } from '@/constants/sourcing_campaigns';
import { useI18n } from '@/hooks/useI18n';
export function SourcingCampaignStatusBadge({ status }: { status: string }) {
    const { t } = useI18n();
    const config = SOURCING_CAMPAIGN_STATUS_CONFIG[status] ?? {
        classes: 'bg-ds-bg3 text-ds-text2 border border-ds-border',
        dot: 'bg-ds-text3',
    };
    const label = t(`sourcing_campaigns.index.status.${status}`) ?? status;

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${config.classes}`}>{label}</span>
    );
}
