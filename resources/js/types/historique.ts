interface Candidat {
    id: number;
    full_name: string;
    headline: string | null;
    current_title: string | null;
    current_company: string | null;
    linkedin_url: string | null;
    profile_photo: string | null;
}

interface Brief {
    id: number;
    title: string;
    sector: string;
    contract_type: string;
}

interface Interview {
    id: number;
    platform: string;
    status: string;
    scheduled_at: string | null;
    decision: 'accepted' | 'rejected' | 'pending';
    decision_comment: string | null;
    decision_at: string | null;
    candidat: Candidat | null;
    brief: Brief | null;
    interviewer: { id: number; name: string } | null;
    decision_by: { id: number; name: string } | null;
    ai_score: number | null;
    ai_verdict: string | null;
}

export interface PaginatedInterviews {
    data: Interview[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

interface BriefOption {
    id: number;
    title: string;
}

export interface Filters {
    decision?: string;
    candidat_name?: string;
    brief_id?: string;
    date_from?: string;
    date_to?: string;
}

export interface Props {
    interviews: PaginatedInterviews;
    briefs: BriefOption[];
    filters: Filters;
}
