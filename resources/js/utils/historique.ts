import { FilterEntry } from '@/components/ui/FilterPanel';
import { Filters } from '@/types/historique';
export function scoreColor(score: number) {
    if (score >= 85) return 'text-[#34D399]';
    if (score >= 70) return 'text-[#818CF8]';
    if (score >= 55) return 'text-[#22D3EE]';
    return 'text-ds-text3';
}
export function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function filtersToEntries(filters: Filters): FilterEntry[] {
    return (Object.entries(filters) as [string, string | undefined][])
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([field, value]) => ({ field, value: value as string }));
}

export function entriesToParams(entries: FilterEntry[]): Record<string, string> {
    const params: Record<string, string> = {};
    entries.forEach((f) => {
        const value = Array.isArray(f.value) ? f.value.join(',') : f.value;
        if (value && String(value).trim() !== '') {
            params[f.field] = String(value);
        }
    });
    return params;
}
