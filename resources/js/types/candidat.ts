import type { Brief } from './brief';
export type CandidatStatus = string;

export interface Candidat {
    id: number;
    full_name: string;
    email: string;
    phone: string | null;
    current_title: string | null;
    current_company: string | null;
    location: string | null;
    experience_years: number | null;
    education_level: string | null;
    source: string | null;
    source_url: string | null;
    source_context: {
        post_author?: string | null;
        post_url?: string | null;
        type?: string;
    } | null;
    status: CandidatStatus;
    linkedin_url: string | null;
    headline: string | null;
    summary: string | null;
    skills: string[] | null;
    open_to_work: boolean;
    raw_data: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    brief_title: string | null;
    brief_id: number | null;
    sourcing_score: number | null;
    profile_photo: string | null;
    score_cv: number | null;
    ai_score: number | null;
    score?: number | null;
    ai_analysis?: string | null;
    recruiter_notes?: string | null;
}

export interface PaginatedCandidats {
    data: Candidat[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface IndexCandidatFilters {
    search?: string;
    status?: CandidatStatus;
}

export interface IndexCandidatProps {
    candidats: PaginatedCandidats;
    filters: IndexCandidatFilters;
    briefs: { id: number; title: string }[];
    params: { status_candidat?: { value: string; label: string }[] };
}

export interface Interviewer {
    id: number;
    name: string;
    email: string;
}

export interface DecisionBy {
    id: number;
    name: string;
}

export interface Report {
    score_global: number;
    verdict: 'recommended' | 'solid' | 'to_deepen' | 'rejected';
    strengths: string;
    watch_points: string | null;
    ai_recommendation: string;
}

export interface Interview {
    id: number;
    platform: 'zoom' | 'meet' | 'teams' | 'presentiel';
    status: 'scheduled' | 'recording_uploaded' | 'transcribing' | 'analyzed' | 'done';
    scheduled_at: string | null;
    completed_at: string | null;
    decision: 'accepted' | 'rejected' | 'pending';
    decision_comment: string | null;
    decision_at: string | null;
    brief: Brief | null;
    interviewer: Interviewer | null;
    decision_by: DecisionBy | null;
    ai_score: number | null;
    ai_verdict: string | null;
    report: Report | null;
}

export interface HistoryCandidat {
    id: number;
    full_name: string;
    headline: string | null;
    location: string | null;
    current_title: string | null;
    current_company: string | null;
    linkedin_url: string | null;
    status: string;
    open_to_work: boolean;
    profile_photo: string | null;
}

export interface CandidatHistoryProps {
    candidat: HistoryCandidat;
    interviews: Interview[];
}
