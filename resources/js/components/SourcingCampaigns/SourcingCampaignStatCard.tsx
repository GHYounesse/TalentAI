export function SourcingCampaignStatCard({
    icon: Icon,
    label,
    value,
    accent,
}: {
    icon: React.ElementType;
    label: string;
    value: number | string;
    accent?: string;
}) {
    return (
        <div className="border-ds-border bg-ds-surface flex flex-col gap-2 rounded-xl border p-4">
            <div className="flex items-center justify-between">
                <p className="text-ds-text3 text-[11px] font-semibold tracking-widest uppercase">{label}</p>
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent ?? 'bg-ds-bg3'}`}>
                    <Icon size={14} className="text-ds-text2" />
                </span>
            </div>
            <p className="font-heading text-ds-text text-[26px] leading-none font-bold">{value}</p>
        </div>
    );
}
