import { usePage } from '@inertiajs/react';

type Replacements = Record<string, string | number>;
type I18nOptions = { fallback?: string } & Replacements;

export function useI18n() {
    const props = usePage().props as { translations: Record<string, unknown>; locale?: string };
    const { translations, locale } = props;

    const t = (path: string, options: I18nOptions = {}): string => {
        const { fallback, ...replacements } = options;

        const value = path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], translations);

        if (typeof value !== 'string') {
            return fallback ?? path;
        }

        return Object.entries(replacements).reduce((text, [key, replacement]) => text.replaceAll(`{{${key}}}`, String(replacement)), value);
    };

    return { t, locale: locale ?? 'fr' };
}
