import { useI18n } from '@/hooks/useI18n';
import { ChevronDown, ChevronUp, Loader2, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import ReactSelect, { type StylesConfig } from 'react-select';

export interface FilterField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date';
    multi?: boolean;
    options?: { value: string | number; label: string }[];
}

export interface FilterEntry {
    field: string;
    value: string | string[];
}

interface Props {
    fields: FilterField[];
    activeFilters: FilterEntry[];
    onChange: (filters: FilterEntry[]) => void;
    onSearch: (filtersOverride?: FilterEntry[]) => void;
    loading?: boolean;
}

type RSOption = { value: string | number; label: string };

const RS_STYLES: StylesConfig<RSOption, boolean> = {
    control: (base, state) => ({
        ...base,
        backgroundColor: 'var(--ds-bg)',
        borderColor: state.isFocused ? '#6C63FF' : 'var(--ds-border)',
        minHeight: '38px',
        boxShadow: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        cursor: 'pointer',
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: 'var(--ds-surface)',
        border: '1px solid var(--ds-border)',
        borderRadius: '10px',
        overflow: 'hidden',
        zIndex: 40,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: 'rgba(108,99,255,0.12)',
        borderRadius: '6px',
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: '#6C63FF',
        fontSize: '11px',
        fontWeight: 600,
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: '#6C63FF',
        ':hover': { backgroundColor: 'rgba(108,99,255,0.2)', color: '#6C63FF' },
    }),
    singleValue: (base) => ({ ...base, color: 'var(--ds-text)' }),
    input: (base) => ({ ...base, color: 'var(--ds-text)' }),
    placeholder: (base) => ({ ...base, color: 'var(--ds-text3)' }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? 'rgba(108,99,255,0.15)'
            : state.isFocused
            ? 'var(--ds-bg3)'
            : 'transparent',
        color: state.isSelected ? '#6C63FF' : 'var(--ds-text)',
        cursor: 'pointer',
        fontSize: '13px',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
};

export default function FilterPanel({ fields, activeFilters, onChange, onSearch, loading = false }: Props) {
    const { t } = useI18n();
    const [modalOpen, setModalOpen] = useState(false);
    const [panelOpen, setPanelOpen] = useState(true);

    function addFilter(key: string) {
        if (activeFilters.some((f) => f.field === key)) return;
        onChange([...activeFilters, { field: key, value: '' }]);
    }

    function removeFilter(key: string) {
        onChange(activeFilters.filter((f) => f.field !== key));
    }

    function updateValue(index: number, value: string | string[]) {
        const next = [...activeFilters];
        next[index] = { ...next[index], value };
        onChange(next);
    }

    function resetAll() {
        onChange([]);
        onSearch([]);
        setModalOpen(false);
    }

    return (
        <div>
            {/* ── Toolbar trigger button ── */}
            <button
                onClick={() => setModalOpen(true)}
                className="bg-ds-accent flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#7C74FF]"
            >
                <SlidersHorizontal size={14} />
                {t('briefs.index.actions.filters')}
            </button>

            {/* ── Filter picker modal ── */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-2xl border border-ds-border bg-ds-surface shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* header */}
                        <div className="flex items-start justify-between px-6 pt-6 pb-4">
                            <div>
                                <h2 className="font-heading text-[17px] font-bold text-ds-text">
                                    {t('briefs.index.filters.modal_title')}
                                </h2>
                                <p className="mt-0.5 text-[12px] text-ds-text3">
                                    {t('briefs.index.filters.modal_subtitle')}
                                </p>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ds-text3 transition hover:bg-ds-bg3 hover:text-ds-text"
                            >
                                ✕
                            </button>
                        </div>

                        {/* chips */}
                        <div className="px-6 pb-4">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {fields.map((f) => {
                                    const isActive = activeFilters.some((item) => item.field === f.key);
                                    return (
                                        <button
                                            key={f.key}
                                            onClick={() => (isActive ? removeFilter(f.key) : addFilter(f.key))}
                                            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-medium transition-all duration-150 ${
                                                isActive
                                                    ? 'border-ds-accent bg-ds-accent/10 text-ds-accent'
                                                    : 'border-ds-border bg-ds-bg2 text-ds-text2 hover:border-ds-accent/30 hover:text-ds-text'
                                            }`}
                                        >
                                            <span>{f.label}</span>
                                            {isActive && (
                                                <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ds-accent text-[9px] font-bold text-white">
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* footer */}
                        <div className="flex items-center justify-between border-t border-ds-border px-6 py-4">
                            <span className="text-[12px] text-ds-text3">
                                {activeFilters.length} {t('briefs.index.filters.selected_count')}
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={resetAll}
                                    className="text-[13px] font-medium text-red-400 transition hover:text-red-500"
                                >
                                    {t('briefs.index.actions.reset')}
                                </button>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-lg bg-ds-accent px-5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                                >
                                    {t('briefs.index.actions.apply')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Active filters panel ── */}
            {activeFilters.length > 0 && (
                <div className="mt-4 rounded-2xl border border-ds-border bg-ds-surface p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-ds-text">
                                {t('briefs.index.filters.active_title')}
                            </h3>
                            <p className="mt-0.5 text-xs text-ds-text3">
                                {t('briefs.index.filters.active_subtitle')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { onChange([]); onSearch([]); }}
                                className="text-[12px] font-medium text-red-400 transition hover:text-red-500"
                            >
                                {t('briefs.index.actions.reset')}
                            </button>
                            <button
                                onClick={() => setPanelOpen((v) => !v)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-ds-border text-ds-text3 transition hover:bg-ds-bg3 hover:text-ds-text"
                            >
                                {panelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>
                    </div>

                    {panelOpen && (
                        <>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                {activeFilters.map((f, index) => {
                                    const field = fields.find((x) => x.key === f.field);
                                    if (!field) return null;

                                    return (
                                        <div key={f.field} className="rounded-xl border border-ds-border bg-ds-bg2 p-3">
                                            <div className="mb-2 flex items-center justify-between">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-ds-text3">
                                                    {field.label}
                                                </p>
                                                <button
                                                    onClick={() => removeFilter(f.field)}
                                                    className="flex h-5 w-5 items-center justify-center rounded text-ds-text3 transition hover:text-red-400"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            {field.type === 'select' ? (
                                                <ReactSelect<RSOption, boolean>
                                                    isMulti={field.multi ?? false}
                                                    classNamePrefix="rs"
                                                    options={field.options as RSOption[]}
                                                    value={
                                                        field.multi
                                                            ? (field.options ?? []).filter((opt) =>
                                                                  (Array.isArray(f.value) ? f.value : [f.value]).includes(String(opt.value))
                                                              )
                                                            : (field.options?.find((opt) => String(opt.value) === f.value) ?? null)
                                                    }
                                                    onChange={(selected) => {
                                                        updateValue(
                                                            index,
                                                            field.multi
                                                                ? (selected as RSOption[]).map((o) => String(o.value))
                                                                : ((selected as RSOption | null)?.value != null ? String((selected as RSOption).value) : '')
                                                        );
                                                    }}
                                                    placeholder={t('briefs.index.filters.select_placeholder')}
                                                    styles={RS_STYLES}
                                                />
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    value={Array.isArray(f.value) ? '' : f.value}
                                                    onChange={(e) => updateValue(index, e.target.value)}
                                                    placeholder={field.label}
                                                    className="w-full rounded-lg border border-ds-border bg-ds-bg px-3 py-2 text-[13px] text-ds-text placeholder:text-ds-text3 outline-none transition focus:border-ds-accent focus:ring-2 focus:ring-ds-accent/10"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => onSearch()}
                                    disabled={loading}
                                    className="bg-ds-accent flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading && <Loader2 size={13} className="animate-spin" />}
                                    {t('briefs.index.filters.search_btn')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
