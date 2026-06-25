import { FilterEntry } from '@/components/ui/FilterPanel';

export type Status = 'idle' | 'uploading' | 'pending' | 'processing' | 'done' | 'failed';

export interface InterviewRecord {
    id: number;
    candidate_name: string;
    brief_id: number | null;
    brief_title: string;
    duration_minutes: number | null;
    platform: string;
    recruiter_notes: string | null;
    scheduled_at: string;
    transcription_status: string;
    transcription_id: number | null;
    analysis_status: string;
    audio_url: string | null;
}

interface Candidate {
    id: string;
    full_name: string;
}

interface Brief {
    id: string;
    title: string;
}

export interface CreateInterviewProps {
    candidates: Candidate[];
    briefs: Brief[];
    interviews: InterviewRecord[];
}

export type Option = { value: string; label: string };

export interface Criterion {
    score: number;
    comment: string;
}

export interface KeyExcerpt {
    speaker: 'Interviewer' | 'Candidate';
    text: string;
    timestamp: string | null;
    criterion: string;
}

export interface DiarizedSegment {
    speaker: string;
    text: string;
    start?: number;
    end?: number;
}

interface TranscriptionData {
    id: number;
    status: string;
    analysis_status: string;
    analysis_score: number | null;
    analysis_verdict: string | null;
    global_score: number | null;
    verdict: string | null;
    criteria: Record<string, Criterion>;
    strengths: string[];
    red_flags: string[];
    key_excerpts: KeyExcerpt[];
    diarized_transcript: DiarizedSegment[];
    summary: string | null;
    recommendation: string | null;
}

export interface InterviewData {
    id: number;
    candidate_name: string;
    brief_title: string;
    platform: string;
    recruiter_notes: string | null;
    scheduled_at: string;
    interviewer: string;
    duration_minutes: number | null;
}

export interface PeerInterview {
    id: number;
    candidate_name: string;
    global_score: number | null;
    verdict: string | null;
    criteria: Record<string, Criterion>;
}

export interface ShowInterviewProps {
    interview: InterviewData;
    transcription: TranscriptionData | null;
    peers: PeerInterview[];
}

interface PaginatedInterviews {
    data: InterviewRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

export interface IndexInterviewsProps {
    interviews: PaginatedInterviews;
    filters?: FilterEntry[];
}
