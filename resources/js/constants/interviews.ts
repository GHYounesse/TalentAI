import { Option, Status } from '@/types/interviews';
import { AlertCircle, Check, Hourglass, Loader2, LucideIcon, Minus } from 'lucide-react';
import { StylesConfig } from 'react-select';
export const PLATFORMS = ['zoom', 'meet', 'teams', 'presentiel'] as const;

export const STATUS_LABEL: Record<Status, string> = {
    idle: '',
    uploading: 'Envoi du fichier…',
    pending: "En file d'attente — en attente d'un worker…",
    processing: 'Transcription en cours…',
    done: 'Terminé',
    failed: 'Échec de la transcription',
};

export const PROGRESS_WIDTH: Partial<Record<Status, string>> = {
    uploading: '30%',
    pending: '55%',
    processing: '80%',
};

export const ACCEPTED = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
export const ACCEPTED_EXT = '.mp3,.wav,.m4a';

export const STATUS_ROW_CONFIG = {
    done: { badge: 'bg-badge-active-bg text-badge-active-text border-badge-active-text/20', label: '✓ Rapport prêt' },
    processing: { badge: 'bg-ds-accent/10 text-ds-accent border-ds-accent/20', label: 'En cours' },
    pending: { badge: 'bg-badge-sourcing-bg text-badge-sourcing-text border-badge-sourcing-text/20', label: 'En attente' },
    failed: { badge: 'bg-ds-red/10 text-ds-red border-ds-red/20', label: 'Échec' },
    none: { badge: 'bg-ds-bg3 text-ds-text3 border-ds-border', label: '—' },
} as const;

export const selectStyles: StylesConfig<Option, false> = {
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        backgroundColor: 'var(--ds-bg)',
        borderColor: state.isFocused ? 'var(--ds-accent)' : 'var(--ds-border)',
        borderRadius: '0.5rem',
        boxShadow: 'none',
        fontSize: '13px',
        '&:hover': {
            borderColor: 'var(--ds-border2)',
        },
    }),
    singleValue: (base) => ({
        ...base,
        color: 'var(--ds-text)',
    }),
    placeholder: (base) => ({
        ...base,
        color: 'var(--ds-text3)',
    }),
    input: (base) => ({
        ...base,
        color: 'var(--ds-text)',
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: 'var(--ds-surface)',
        border: '1px solid var(--ds-border)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        zIndex: 50,
    }),
    option: (base, state) => ({
        ...base,
        cursor: 'pointer',
        fontSize: '13px',
        backgroundColor: state.isSelected
            ? 'color-mix(in srgb, var(--ds-accent) 12%, transparent)'
            : state.isFocused
              ? 'color-mix(in srgb, var(--ds-accent) 8%, transparent)'
              : 'transparent',
        color: state.isSelected ? 'var(--ds-accent)' : 'var(--ds-text2)',
        '&:active': {
            backgroundColor: 'color-mix(in srgb, var(--ds-accent) 12%, transparent)',
        },
    }),
};

export const CRITERIA_COLORS: Record<string, { bar: string; text: string }> = {
    communication_clarte: { bar: 'bg-emerald-400', text: 'text-emerald-400' },
    vision_strategique: { bar: 'bg-violet-500', text: 'text-violet-400' },
    leadership_managerial: { bar: 'bg-cyan-400', text: 'text-cyan-400' },
    gestion_equipe: { bar: 'bg-yellow-400', text: 'text-yellow-400' },
    adequation_culturelle: { bar: 'bg-slate-400', text: 'text-slate-400' },
    coherence_salariale: { bar: 'bg-rose-400', text: 'text-rose-400' },
};

export const CRITERIA_LABELS: Record<string, string> = {
    communication_clarte: 'Communication',
    vision_strategique: 'Vision stratégique',
    leadership_managerial: 'Leadership',
    gestion_equipe: "Gestion d'équipe",
    adequation_culturelle: 'Adéquation culturelle',
    coherence_salariale: 'Prétentions salariales',
};

export const VERDICT_CONFIG: Record<string, { cls: string; label: string }> = {
    Recommandé: {
        cls: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        label: 'Recommandé',
    },
    'Candidature solide': {
        cls: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
        label: 'Candidature solide',
    },
    'À approfondir': {
        cls: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        label: 'À approfondir',
    },
    Écarté: {
        cls: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        label: 'Écarté',
    },
};

export const STATUSES = ['done', 'processing', 'pending', 'failed', 'none'] as const;

export type StatusKey = (typeof STATUSES)[number];

export const STATUS_BADGE: Record<StatusKey, { cls: string; icon: LucideIcon }> = {
    done: { cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Check },
    processing: { cls: 'bg-violet-50 text-violet-700 border-violet-200', icon: Loader2 },
    pending: { cls: 'bg-amber-50 text-amber-800 border-amber-200', icon: Hourglass },
    failed: { cls: 'bg-red-50 text-red-800 border-red-200', icon: AlertCircle },
    none: { cls: 'bg-ds-bg3 text-ds-text3 border-ds-border', icon: Minus },
};

export const PLATFORM_LABEL: Record<string, string> = {
    zoom: 'Zoom',
    meet: 'Google Meet',
    teams: 'Microsoft Teams',
    presentiel: 'Présentiel',
};

export const VERDICT_CFG: Record<string, { label: string; cls: string }> = {
    recommended: { label: 'Recommandé', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    solid: { label: 'Solide', cls: 'bg-blue-500/10   text-blue-400   border-blue-500/20' },
    to_deepen: { label: 'À approfondir', cls: 'bg-amber-500/10  text-amber-400  border-amber-500/20' },
    rejected: { label: 'Non retenu', cls: 'bg-ds-red/10     text-ds-red     border-ds-red/20' },
};

export const STATUS_CFG: Record<string, { label: string; cls: string }> = {
    scheduled: { label: 'Planifié', cls: 'bg-blue-500/10  text-blue-400  border-blue-500/20' },
    recording_uploaded: { label: 'Enregistrement', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    transcribing: { label: 'Transcription…', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    analyzed: { label: 'Analysé', cls: 'bg-ds-accent/10 text-ds-accent border-ds-accent/20' },
    done: { label: 'Terminé', cls: 'bg-ds-text3/10  text-ds-text3  border-ds-text3/20' },
};
