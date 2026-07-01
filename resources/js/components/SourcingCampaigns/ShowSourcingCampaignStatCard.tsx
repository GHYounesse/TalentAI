export function ShowSourcingCampaignStatCard({
    icon: Icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    accent?: string;
}) {
    return (
        <div className="bg-ds-surface border-ds-border flex items-start gap-4 rounded-xl border p-5">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent ?? 'bg-[#6C63FF]/10'}`}>
                <Icon size={18} className={accent ? 'text-white' : 'text-[#6C63FF]'} />
            </div>
            <div className="min-w-0">
                <p className="text-ds-text3 mb-0.5 text-xs font-medium">{label}</p>
                <p className="text-ds-text text-2xl leading-none font-bold">{value}</p>
                {sub && <p className="text-ds-text3 mt-1 text-xs">{sub}</p>}
            </div>
        </div>
    );
}
