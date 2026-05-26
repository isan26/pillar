export type SessionStatus = "running" | "completed" | "failed";
export type TurnStatus = "running" | "completed" | "failed";
export type RunStatus = "running" | "success" | "error";
export type Role = "system" | "user" | "assistant";

export type Session = {
    session_id: string;
    model: string;
    agent: string | null;
    debug_path: string;
    started_at: string;
    completed_at: string | null;
    status: SessionStatus;
    total_input_tokens: number | null;
    total_output_tokens: number | null;
    total_tokens: number | null;
    estimated_cost_usd: number | null;
};

export type Message = {
    session_id: string;
    message_id: string;
    turn_id: string | null;
    role: Role;
    content: string;
    source: string;
    created_at: string;
};

export type Turn = {
    session_id: string;
    turn_id: string;
    status: TurnStatus;
    started_at: string;
    completed_at: string | null;
    latency_ms: number | null;
    user_message: string;
    assistant_message_id: string | null;
    error_type: string | null;
    error_message: string | null;
};

export type Run = {
    session_id: string;
    run_id: string;
    turn_id: string | null;
    provider: string | null;
    model: string;
    purpose: string;
    status: RunStatus;
    started_at: string;
    completed_at: string | null;
    input_tokens: number | null;
    output_tokens: number | null;
    total_tokens: number | null;
    latency_ms: number | null;
    estimated_cost_usd: number | null;
    raw_usage_metadata: Record<string, unknown>;
    raw_response_metadata: Record<string, unknown>;
    error_type: string | null;
    error_message: string | null;
};

export type DebugEvent = {
    session_id: string;
    event_type: string;
    timestamp: string;
    turn_id?: string;
    run_id?: string;
    message_id?: string;
    purpose?: string;
    status?: string;
};

export type SessionSummary = Session & {
    folder: string;
    turn_count: number;
    run_count: number;
    message_count: number;
    error_count: number;
    first_user_message: string | null;
};

export type SessionDetail = {
    session: Session;
    folder: string;
    messages: Message[];
    turns: Turn[];
    runs: Run[];
    events: DebugEvent[];
};
