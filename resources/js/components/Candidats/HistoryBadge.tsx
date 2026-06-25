export function HistoryBadge({ label, cls }: { label: string; cls: string }) {
    return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}
