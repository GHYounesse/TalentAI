export interface Brief {
    id: number;
    title: string;
}

export interface FormData {
    search_queries: string[];
    author_urls: string[];
    max_posts: string;
    posted_limit_date: string;
    brief_id: string;
    [key: string]: string | string[];
}

export interface SelectOption {
    value: string;
    label: string;
}

export interface Props {
    briefs: Brief[];
    params: {
        sourcing_social_platforms: SelectOption[];
    };
}

interface SourcingCampaign {
    id: number;
    created_at: string;
    search_queries: string[];
    posts_count: number;
    comments_count: number;
    status: string;
    brief?: { title: string } | null;
}

export interface IndexProps {
    sourcingCampaigns: {
        data: SourcingCampaign[];
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
    };
}

export interface Candidat {
    id: number;
    full_name: string | null;
    current_title: string | null;
    status: string;
}

export interface Mention {
    name: string;
    linkedinUrl: string | null;
}

export interface Comment {
    id: number;
    commenter_name: string | null;
    commenter_linkedin_url: string | null;
    commenter_position: string | null;
    commentary: string;
    commented_at: string | null;
    mentions: Mention[] | null;
    candidat: Candidat | null;
}

export interface Post {
    id: number;
    author_name: string | null;
    author_linkedin_url: string | null;
    author_info: string | null;
    content: string;
    linkedin_url: string | null;
    comments: Comment[];
}

export interface ShowSourcingCampaign {
    id: number;
    status: string;
    search_queries: string[];
    author_urls: string[];
    max_posts: number;
    posted_limit_date: string | null;
    posts: Post[];
    error_message: string | null;
    brief?: { title: string } | null;
}

export interface EnrichmentStats {
    total: number;
    enriched: number;
    done: boolean;
}

export interface ShowProps {
    sourcingCampaign: ShowSourcingCampaign;
    enrichment: EnrichmentStats;
}
