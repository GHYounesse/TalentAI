import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function safeUrl(url: string | null | undefined): string {
    if (!url) return '#';
    return /^https?:\/\//i.test(url) ? url : '#';
}
