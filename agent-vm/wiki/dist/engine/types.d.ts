export type PageType = 'project' | 'research' | 'intent' | 'intent-bundle' | 'task' | 'decision' | 'codebase' | 'config' | 'agent-profile' | 'agent-learning' | 'session-summary' | 'daily-note' | 'playbook' | 'integration' | 'synthesis' | 'knowledge' | 'sprint' | 'skill' | 'template' | 'moc' | string;
export type PageStatus = 'active' | 'draft' | 'archived' | 'deprecated' | 'open' | 'in-progress' | 'done' | 'cancelled' | 'complete' | 'paused' | 'connected' | 'disconnected' | 'pending' | 'superseded' | 'reversed' | 'planned' | string;
export interface PageFrontmatter {
    title: string;
    type: PageType;
    status?: PageStatus;
    created?: string;
    updated?: string;
    summary?: string;
    tags?: string[];
    project?: string;
    agent?: string;
    author?: string;
    source?: string;
    confidence?: number;
    wiki_id?: string;
    imported_from?: string;
    imported_at?: string;
    priority?: string | number;
    owner?: string;
    project_id?: string;
    phase?: number;
    intent_type?: string;
    outcome?: string;
    session_id?: string;
    date?: string;
    domain?: string;
    stack?: string[];
    repo?: string;
    path?: string;
    system?: string;
    sprint_number?: number;
    start?: string;
    end?: string;
    execution_id?: string;
    assigned_to?: string;
    due?: string;
    last_ingested?: string;
    intent_count?: number;
    duration_min?: number;
    channel?: string;
    topic?: string;
    recurrence?: number;
    impact?: string;
    resolved?: boolean;
    impact_score?: number;
    auto_generated?: boolean;
    [key: string]: unknown;
}
export interface WikiPage {
    id: string;
    path: string;
    frontmatter: PageFrontmatter;
    content: string;
    raw: string;
    backlinks: string[];
    forward_links: string[];
    created_at: string;
    updated_at: string;
    word_count: number;
}
export interface PageSummary {
    id: string;
    path: string;
    title: string;
    type: PageType;
    status?: PageStatus;
    summary?: string;
    tags: string[];
    project?: string;
    agent?: string;
    created_at: string;
    updated_at: string;
    word_count: number;
    backlink_count: number;
}
export interface SearchResult {
    id: string;
    path: string;
    title: string;
    type: PageType;
    snippet: string;
    rank: number;
}
export interface GraphNode {
    id: string;
    title: string;
    type: PageType;
    path: string;
}
export interface GraphEdge {
    from_id: string;
    to_id: string;
    link_text: string;
}
export interface GraphResult {
    page: GraphNode;
    backlinks: GraphNode[];
    forward_links: GraphNode[];
}
export interface ListPagesQuery {
    type?: string;
    space?: string;
    project?: string;
    agent?: string;
    tags?: string[];
    status?: string;
    created_after?: string;
    updated_before?: string;
    updated_after?: string;
    backlink_count?: number;
    impact_score_gte?: number;
    sort?: string;
    limit?: number;
    offset?: number;
}
export interface CreatePageRequest {
    path?: string;
    frontmatter: Partial<PageFrontmatter> & {
        title: string;
        type: PageType;
    };
    content: string;
}
export interface UpdatePageRequest {
    frontmatter?: Partial<PageFrontmatter>;
    content?: string;
}
//# sourceMappingURL=types.d.ts.map