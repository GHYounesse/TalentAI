export function SourcingCampaignInfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
    return (
        <div className="flex items-center justify-between py-2.5">
            <span className="text-ds-text3 flex items-center gap-2 text-[12px]">
                <Icon size={12} />
                {label}
            </span>
            <span className="text-ds-text2 text-[12px] font-medium">{value}</span>
        </div>
    );
}
