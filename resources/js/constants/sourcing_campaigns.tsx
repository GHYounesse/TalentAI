import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
export const SOURCING_CAMPAIGN_STATUS_CONFIG: Record<string, { classes: string; dot: string }> = {
    pending: {
        classes: 'bg-amber-50 text-amber-700 border border-amber-200',
        dot: 'bg-amber-400',
    },
    running: {
        classes: 'bg-blue-50 text-blue-700 border border-blue-200',
        dot: 'bg-blue-500 animate-pulse',
    },
    completed: {
        classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        dot: 'bg-emerald-500',
    },
    failed: {
        classes: 'bg-red-50 text-red-700 border border-red-200',
        dot: 'bg-red-500',
    },
};

export const SHOW_SOURCING_CAMPAIGN_STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; Icon: React.ElementType }> = {
    pending: {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        text: 'text-amber-700 dark:text-amber-400',
        dot: 'bg-amber-400',
        Icon: Clock,
    },
    running: {
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        text: 'text-blue-700 dark:text-blue-400',
        dot: 'bg-blue-400',
        Icon: Loader2,
    },
    completed: {
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        text: 'text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-400',
        Icon: CheckCircle2,
    },
    failed: {
        bg: 'bg-red-50 dark:bg-red-500/10',
        text: 'text-red-700 dark:text-red-400',
        dot: 'bg-red-400',
        Icon: AlertCircle,
    },
};
