export function SourcingCampaignSectionHeading({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
    return (
        <div className="mb-5 flex items-start gap-3">
            <span className="bg-ds-accent/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Icon size={15} className="text-ds-accent" />
            </span>
            <div>
                <p className="font-heading text-ds-text text-[14px] font-semibold">{title}</p>
                {description && <p className="text-ds-text3 mt-0.5 text-[12px] leading-relaxed">{description}</p>}
            </div>
        </div>
    );
}
