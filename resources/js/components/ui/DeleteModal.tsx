import { useI18n } from '@/hooks/useI18n';
import { useState } from 'react';

interface DeleteModalProps {
    label: string;
    i18nPrefix?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteModal({ label, i18nPrefix = 'common.modal.delete', onConfirm, onCancel }: DeleteModalProps) {
    const { t } = useI18n();
    const [submitting, setSubmitting] = useState(false);

    function handleConfirm() {
        if (submitting) return;
        setSubmitting(true);
        onConfirm();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#111118]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>

                {/* Content */}
                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {t(`${i18nPrefix}.title`)}
                </h3>
                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    {t(`${i18nPrefix}.description`)}
                </p>
                <p className="mb-6 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 dark:bg-white/5 dark:text-gray-200">
                    « {label} »
                </p>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
                    >
                        {t(`${i18nPrefix}.cancel`)}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {t(`${i18nPrefix}.confirm`)}
                    </button>
                </div>
            </div>
        </div>
    );
}