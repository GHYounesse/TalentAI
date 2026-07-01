import { SHOW_SOURCING_CAMPAIGN_STATUS_CONFIG } from '@/constants/sourcing_campaigns';

export function ShowSourcingCampaignStatusBadge({ status, label }: { status: string; label: string }) {
    const cfg = SHOW_SOURCING_CAMPAIGN_STATUS_CONFIG[status] ?? SHOW_SOURCING_CAMPAIGN_STATUS_CONFIG.pending;

    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>{label}</span>;
}
