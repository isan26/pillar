// On-disk record shapes for the debug tracer.
//
// These are snake_case ON PURPOSE: they mirror the contract that
// tools/v1-conversation-tracer reads. tsa's camelCase domain types are mapped
// into these at the tracer boundary (same anti-corruption move as the provider
// seam) so the existing UI keeps working unchanged.

export type SessionStatus = "running" | "completed" | "failed"
export type TurnStatus = "running" | "completed" | "failed"
export type RunStatus = "running" | "success" | "error"
export type TracerRole = "system" | "user" | "assistant"

export type SessionRecord = {
	session_id: string
	model: string
	agent: string | null
	debug_path: string
	started_at: string
	completed_at: string | null
	status: SessionStatus
	total_input_tokens: number | null
	total_output_tokens: number | null
	total_tokens: number | null
	estimated_cost_usd: number | null
}

export type MessageRecord = {
	session_id: string
	message_id: string
	turn_id: string | null
	role: TracerRole
	content: string
	source: string
	created_at: string
}

export type TurnRecord = {
	session_id: string
	turn_id: string
	status: TurnStatus
	started_at: string
	completed_at: string | null
	latency_ms: number | null
	user_message: string
	assistant_message_id: string | null
	error_type: string | null
	error_message: string | null
}

export type RunRecord = {
	session_id: string
	run_id: string
	turn_id: string | null
	provider: string | null
	model: string
	purpose: string
	status: RunStatus
	started_at: string
	completed_at: string | null
	input_tokens: number | null
	output_tokens: number | null
	total_tokens: number | null
	latency_ms: number | null
	estimated_cost_usd: number | null
	raw_usage_metadata: Record<string, unknown>
	raw_response_metadata: Record<string, unknown>
	error_type: string | null
	error_message: string | null
}

// `data` is our extension over the UI's DebugEvent: a free-form payload bag the
// raw request rides in. The UI ignores keys it doesn't type, so this is safe.
export type EventRecord = {
	session_id: string
	event_type: string
	timestamp: string
	turn_id?: string
	run_id?: string
	message_id?: string
	purpose?: string
	status?: string
	data?: unknown
}
