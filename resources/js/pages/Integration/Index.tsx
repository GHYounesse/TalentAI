import { useI18n } from '@/hooks/useI18n';
import AppLayout from '@/layouts/app-layout';
import { safeUrl } from '@/lib/utils';
import type { Integration, IntegrationsProps } from '@/types/integration';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, ChevronUp, Copy, ExternalLink, Eye, EyeOff, Loader2, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

function StatusBadge({ integration }: { integration: Integration }) {
    const { t } = useI18n();

    if (integration.has_token) {
        return (
            <span className="border-badge-active-text/20 bg-badge-active-bg text-badge-active-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
                <span className="bg-ds-green h-1.5 w-1.5 rounded-full" />
                {t('integrations.status.connected')}
            </span>
        );
    }
    if (integration.has_env_fallback) {
        return (
            <span className="border-badge-sourcing-text/20 bg-badge-sourcing-bg text-badge-sourcing-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
                <span className="bg-ds-amber h-1.5 w-1.5 rounded-full" />
                {t('integrations.status.env_fallback')}
            </span>
        );
    }
    return (
        <span className="border-ds-border bg-ds-bg3 text-ds-text3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
            <span className="bg-ds-text3 h-1.5 w-1.5 rounded-full" />
            {t('integrations.status.not_configured')}
        </span>
    );
}

function IntegrationCard({ integration }: { integration: Integration }) {
    const { t } = useI18n();
    const { flash } = usePage<{ flash: { test_result?: { provider: string; ok: boolean } } }>().props;

    const testResult = flash.test_result?.provider === integration.provider ? (flash.test_result.ok ? 'ok' : 'fail') : null;
    const [open, setOpen] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [testing, setTesting] = useState(false);

    const [copied, setCopied] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        provider: integration.provider,
        token: '',
        secondary_token: '',
        expires_at: '',
    });

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        post(route('dashboard.integrations.store'), {
            onSuccess: () => {
                reset('token', 'secondary_token');
                setShowToken(false);
            },
        });
    }

    function handleRevoke() {
        router.delete(route('dashboard.integrations.destroy', integration.provider));
    }

    async function handleTest() {
        setTesting(true);
        try {
            await router.post(
                route('dashboard.integrations.test'),
                { provider: integration.provider, ...(data.token ? { token: data.token } : {}) },
                {
                    onFinish: () => setTesting(false),
                    preserveState: true,
                },
            );
        } catch {
            setTesting(false);
        }
    }

    function handleCopyMasked() {
        if (!integration.masked_token) return;
        navigator.clipboard.writeText(integration.masked_token);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className="border-ds-border bg-ds-surface hover:border-ds-border2 rounded-xl border transition-all duration-150">
            {/* Card header */}
            <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5">
                <div className="bg-ds-bg3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl">{integration.icon}</div>
                <div className="min-w-0 flex-1">
                    <p className="font-heading text-ds-text leading-tight font-semibold">{integration.label}</p>
                    <p className="text-ds-text3 mt-0.5 text-[12px] leading-tight">{integration.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <StatusBadge integration={integration} />
                    {open ? <ChevronUp size={14} className="text-ds-text3" /> : <ChevronDown size={14} className="text-ds-text3" />}
                </div>
            </button>

            {/* Expandable body */}
            {open && (
                <div className="border-ds-border border-t px-4 pt-4 pb-5 sm:px-5">
                    {/* Current token display */}
                    {integration.has_token && (
                        <div className="mb-4">
                            <p className="text-ds-text3 mb-1.5 text-[11px] font-semibold tracking-[0.8px] uppercase">
                                {t('integrations.token.current')}
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="border-ds-border bg-ds-bg3 flex flex-1 items-center gap-2 overflow-hidden rounded-lg border px-3 py-2">
                                    <code className="text-ds-text2 flex-1 truncate font-mono text-[12px]">{integration.masked_token}</code>
                                </div>
                                <button
                                    onClick={handleCopyMasked}
                                    className="border-ds-border text-ds-text3 hover:text-ds-text flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition"
                                    title={t('integrations.token.copy')}
                                >
                                    {copied ? <CheckCircle2 size={13} className="text-ds-green" /> : <Copy size={13} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* New token form */}
                    <form onSubmit={handleSave}>
                        <p className="text-ds-text3 mb-1.5 text-[11px] font-semibold tracking-[0.8px] uppercase">
                            {integration.has_token ? t('integrations.token.replace') : integration.token_label}
                        </p>

                        {/* Token input */}
                        <div className="mb-3">
                            <div className="flex items-center gap-2">
                                <div className="border-ds-border bg-ds-bg3 focus-within:border-ds-accent flex flex-1 items-center gap-2 overflow-hidden rounded-lg border px-3 py-2 transition">
                                    <input
                                        type={showToken ? 'text' : 'password'}
                                        value={data.token}
                                        onChange={(e) => setData('token', e.target.value)}
                                        placeholder={integration.placeholder}
                                        className="text-ds-text placeholder:text-ds-text3 flex-1 bg-transparent font-mono text-[12px] outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowToken((s) => !s)}
                                        className="text-ds-text3 hover:text-ds-text2 shrink-0 transition"
                                    >
                                        {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                </div>
                            </div>
                            {errors.token && <p className="text-ds-red mt-1 text-[11px]">{errors.token}</p>}
                        </div>

                        {/* OAuth secondary field */}
                        {integration.oauth && (
                            <div className="mb-3">
                                <p className="text-ds-text3 mb-1.5 text-[11px] font-semibold tracking-[0.8px] uppercase">
                                    {t('integrations.token.client_secret')}
                                </p>
                                <input
                                    type="password"
                                    value={data.secondary_token}
                                    onChange={(e) => setData('secondary_token', e.target.value)}
                                    placeholder="GOCSPX-xxxxxxxxxxxx"
                                    className="border-ds-border bg-ds-bg3 text-ds-text placeholder:text-ds-text3 focus:border-ds-accent w-full rounded-lg border px-3 py-2 font-mono text-[12px] transition outline-none"
                                />
                            </div>
                        )}

                        {/* Test result */}
                        {testResult === 'ok' && (
                            <div className="border-badge-active-text/20 bg-badge-active-bg mb-3 flex items-center gap-2 rounded-lg border px-3 py-2">
                                <CheckCircle2 size={13} className="text-ds-green" />
                                <span className="text-badge-active-text text-[12px]">{t('integrations.test_result.ok')}</span>
                            </div>
                        )}
                        {testResult === 'fail' && (
                            <div className="border-ds-red/20 bg-ds-red/10 mb-3 flex items-center gap-2 rounded-lg border px-3 py-2">
                                <WifiOff size={13} className="text-ds-red" />
                                <span className="text-ds-red text-[12px]">{t('integrations.test_result.fail')}</span>
                            </div>
                        )}

                        {/* Action row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="submit"
                                disabled={!data.token || processing}
                                className="bg-ds-accent flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#7C74FF] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing && <Loader2 size={12} className="animate-spin" />}
                                {integration.has_token ? t('integrations.actions.replace') : t('integrations.actions.connect')}
                            </button>

                            <button
                                type="button"
                                onClick={handleTest}
                                disabled={(!data.token && !integration.has_token) || testing}
                                className="border-ds-border text-ds-text2 hover:bg-ds-surface2 hover:text-ds-text flex items-center gap-1.5 rounded-lg border px-4 py-2 text-[12px] transition disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {testing ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                                {t('integrations.actions.test')}
                            </button>

                            {integration.docs_url && (
                                <a
                                    href={safeUrl(integration.docs_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border-ds-border text-ds-text3 hover:text-ds-text2 flex items-center gap-1 rounded-lg border px-3 py-2 text-[12px] transition"
                                >
                                    <ExternalLink size={11} />
                                    {t('integrations.actions.docs')}
                                </a>
                            )}

                            {integration.has_token && (
                                <button
                                    type="button"
                                    onClick={handleRevoke}
                                    className="border-ds-red/20 text-ds-red hover:bg-ds-red/10 ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] transition"
                                >
                                    <Trash2 size={12} />
                                    {t('integrations.actions.revoke')}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function Integrations({ integrations, categoryLabels }: IntegrationsProps) {
    const { t } = useI18n();

    const allIntegrations = Object.values(integrations);
    const byCategory = allIntegrations.reduce<Record<string, Integration[]>>((acc, integration) => {
        if (!acc[integration.category]) {
            acc[integration.category] = [];
        }
        acc[integration.category].push(integration);
        return acc;
    }, {});

    const connectedCount = allIntegrations.filter((i) => i.has_token).length;
    const totalCount = allIntegrations.length;

    return (
        <>
            <Head title={t('integrations.page.title')} />
            <AppLayout>
                <div className="bg-ds-bg min-h-full px-4 py-6 sm:px-6 sm:py-8">
                    {/* Header */}
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="font-heading text-ds-text text-[22px] font-bold sm:text-[26px]">{t('integrations.page.title')}</h1>
                            <p className="text-ds-text2 mt-1 text-[13px] sm:text-[14px]">{t('integrations.page.subtitle')}</p>
                        </div>
                        <div className="border-ds-border bg-ds-surface flex items-center gap-2.5 rounded-xl border px-4 py-2.5">
                            <div className="flex h-8 w-8 items-center justify-center">
                                <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--ds-border)" strokeWidth="3" />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="14"
                                        fill="none"
                                        stroke="var(--ds-accent)"
                                        strokeWidth="3"
                                        strokeDasharray={`${(connectedCount / totalCount) * 88} 88`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="font-heading text-ds-text text-[15px] leading-none font-bold">
                                    {connectedCount}/{totalCount}
                                </p>
                                <p className="text-ds-text3 mt-0.5 text-[11px]">{t('integrations.counter.connected')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-8">
                        {Object.entries(byCategory).map(([category, items]) => (
                            <section key={category}>
                                <div className="mb-3 flex items-center gap-3">
                                    <p className="text-ds-text3 text-[10px] font-bold tracking-[1.2px] uppercase">
                                        {categoryLabels[category] ?? category}
                                    </p>
                                    <div className="border-ds-border flex-1 border-t" />
                                    <span className="text-ds-text3 text-[11px]">
                                        {items.filter((i) => i.has_token).length}/{items.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
                                    {items.map((integration) => (
                                        <IntegrationCard key={integration.provider} integration={integration} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
