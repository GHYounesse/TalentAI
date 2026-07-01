import { FormField, inputCls } from '@/components/briefs/FormField';
import { useI18n } from '@/hooks/useI18n';
import AppLayout from '@/layouts/app-layout';
import type { FormData, Props, SelectOption } from '@/types/sourcing_campaigns';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, ChevronRight, Hash, Loader2, Search, X } from 'lucide-react';
import { KeyboardEvent, useRef, useState } from 'react';
import ReactSelect from 'react-select';

function TagInput({
    values,
    onChange,
    placeholder,
    error,
}: {
    values: string[];
    onChange: (v: string[]) => void;
    placeholder: string;
    error?: string;
}) {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    function addTag(raw: string) {
        const tag = raw.trim();
        if (tag && !values.includes(tag)) {
            onChange([...values, tag]);
        }
        setInput('');
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && input === '' && values.length > 0) {
            onChange(values.slice(0, -1));
        }
    }

    return (
        <div
            className={`flex min-h-[42px] cursor-text flex-wrap gap-1.5 rounded-xl border px-3 py-2 ${error ? 'border-red-400' : 'border-ds-border'} bg-ds-bg focus-within:ring-ds-accent/40 focus-within:ring-1`}
            onClick={() => inputRef.current?.focus()}
        >
            {values.map((v) => (
                <span key={v} className="bg-ds-accent/10 text-ds-accent flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium">
                    {v}
                    <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="transition hover:text-red-500">
                        <X size={11} />
                    </button>
                </span>
            ))}
            <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={() => addTag(input)}
                placeholder={values.length === 0 ? placeholder : ''}
                className="text-ds-text placeholder:text-ds-text3 min-w-[120px] flex-1 bg-transparent text-sm outline-none"
            />
        </div>
    );
}

export default function Create({ briefs, params }: Props) {
    const { sourcing_social_platforms } = params;
    const { t } = useI18n();

    const { data, setData, processing, errors } = useForm<FormData>({
        search_queries: [],
        author_urls: [],
        max_posts: '20',
        posted_limit_date: '',
        brief_id: '',
    });

    const e = errors as Record<string, string>;

    function submit(ev: React.FormEvent<HTMLFormElement>) {
        ev.preventDefault();
        router.post(route('dashboard.sourcing-campaigns.store'), {
            search_queries: data.search_queries,
            author_urls: data.author_urls,
            max_posts: Number(data.max_posts),
            posted_limit_date: data.posted_limit_date || null,
            brief_id: data.brief_id ? Number(data.brief_id) : null,
        });
    }

    const briefOptions = briefs.map((b) => ({ value: String(b.id), label: b.title }));
    const selectedBrief = briefOptions.find((o) => o.value === data.brief_id) ?? null;

    function onBriefChange(opt: SelectOption | null) {
        setData((prev) => ({
            ...prev,
            brief_id: opt?.value ?? '',
            search_queries: opt ? [opt.label] : prev.search_queries,
        }));
    }

    const canSubmit = !processing && data.author_urls.length > 0 && !!data.brief_id;

    return (
        <AppLayout>
            <Head title={t('sourcing_campaigns.create.header.title')} />

            <div className="bg-ds-bg min-h-full px-4 py-4 sm:px-6 sm:py-6">
                {/* Breadcrumb + Header */}
                <div className="mb-5 sm:mb-6">
                    <nav className="mb-3 flex min-w-0 items-center gap-1.5 text-[12px]">
                        <Link
                            href={route('dashboard.sourcing-campaigns.index')}
                            className="text-ds-text3 hover:text-ds-text2 flex shrink-0 items-center gap-1 transition"
                        >
                            <Search size={11} />
                            <span className="hidden sm:inline">{t('sourcing_campaigns.create.header.parent')}</span>
                        </Link>
                        <ChevronRight size={11} className="text-ds-text3/50 shrink-0" />
                        <span className="text-ds-text2 truncate font-medium">{t('sourcing_campaigns.create.header.title')}</span>
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('dashboard.sourcing-campaigns.index')}
                            className="border-ds-border text-ds-text3 hover:border-ds-accent/40 hover:bg-ds-accent/[0.06] hover:text-ds-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition"
                            title={t('sourcing_campaigns.create.header.back')}
                        >
                            <ArrowLeft size={15} />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="font-heading text-ds-text truncate text-[18px] leading-tight font-bold sm:text-[20px]">
                                {t('sourcing_campaigns.create.header.title')}
                            </h1>
                            <p className="text-ds-text3 mt-0.5 hidden text-[12px] sm:block">{t('sourcing_campaigns.create.header.subtitle')}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} noValidate>
                    <div className="border-ds-border bg-ds-surface space-y-4 rounded-2xl border p-4 sm:p-6">
                        {/* Brief — first, required */}
                        <FormField label={t('sourcing_campaigns.create.fields.brief.label')} required error={e.brief_id}>
                            <ReactSelect
                                classNamePrefix="rs"
                                options={briefOptions}
                                value={selectedBrief}
                                isClearable
                                onChange={(opt) => onBriefChange(opt as SelectOption | null)}
                                placeholder="Sélectionner un brief…"
                            />
                        </FormField>

                        {/* Search queries — auto-filled from brief, editable */}
                        <FormField
                            label={t('sourcing_campaigns.create.fields.search_queries.label')}
                            error={e.search_queries}
                            hint={t('sourcing_campaigns.create.fields.search_queries.hint')}
                        >
                            <TagInput
                                values={data.search_queries}
                                onChange={(v) => setData('search_queries', v)}
                                placeholder={t('sourcing_campaigns.create.fields.search_queries.placeholder')}
                                error={e.search_queries}
                            />
                        </FormField>

                        {/* Author URLs — required */}
                        <FormField
                            label={t('sourcing_campaigns.create.fields.author_urls.label')}
                            required
                            error={e.author_urls}
                            hint={t('sourcing_campaigns.create.fields.author_urls.hint')}
                        >
                            <ReactSelect
                                classNamePrefix="rs"
                                isMulti
                                options={sourcing_social_platforms}
                                value={sourcing_social_platforms.filter((o) => data.author_urls.includes(o.value))}
                                onChange={(opts) =>
                                    setData(
                                        'author_urls',
                                        (opts as SelectOption[]).map((o) => o.value),
                                    )
                                }
                                placeholder={t('sourcing_campaigns.create.fields.author_urls.placeholder')}
                                noOptionsMessage={() => t('sourcing_campaigns.create.fields.author_urls.no_options')}
                            />
                        </FormField>

                        {/* Parameters row */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                label={t('sourcing_campaigns.create.fields.max_posts.label')}
                                error={e.max_posts}
                                hint={t('sourcing_campaigns.create.fields.max_posts.hint')}
                            >
                                <div className="relative">
                                    <Hash size={13} className="text-ds-text3 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
                                    <input
                                        type="number"
                                        min={0}
                                        value={data.max_posts}
                                        onChange={(ev) => setData('max_posts', ev.target.value)}
                                        className={`${inputCls(e.max_posts)} pl-8`}
                                    />
                                </div>
                            </FormField>

                            <FormField
                                label={t('sourcing_campaigns.create.fields.posted_limit_date.label')}
                                error={e.posted_limit_date}
                                hint={t('sourcing_campaigns.create.fields.posted_limit_date.hint')}
                            >
                                <div className="relative">
                                    <CalendarDays size={13} className="text-ds-text3 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
                                    <input
                                        type="date"
                                        value={data.posted_limit_date}
                                        onChange={(ev) => setData('posted_limit_date', ev.target.value)}
                                        className={`${inputCls(e.posted_limit_date)} pl-8`}
                                    />
                                </div>
                            </FormField>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-stretch gap-2 pt-1 sm:flex-row sm:items-center sm:gap-3">
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="bg-ds-accent flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        {t('sourcing_campaigns.create.actions.submitting')}
                                    </>
                                ) : (
                                    <>
                                        <Search size={14} />
                                        {t('sourcing_campaigns.create.actions.submit')}
                                    </>
                                )}
                            </button>

                            <Link
                                href={route('dashboard.sourcing-campaigns.index')}
                                className="border-ds-border text-ds-text3 hover:bg-ds-bg hover:text-ds-text2 flex items-center justify-center rounded-xl border px-5 py-2.5 text-[13px] font-medium transition"
                            >
                                {t('sourcing_campaigns.create.actions.cancel')}
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
