// File-backed implementation of the Tracer seam. Owns per-session state
// (session metadata, messages, turns, runs, counters, current turn) and writes
// the folder of JSON/JSONL files that tools/v1-conversation-tracer consumes.

import { randomUUID } from "node:crypto"
import { estimateCostUsd } from "@/constants/pricing"
import type { ProviderTrace } from "@/providers/providers.types"
import {
	appendJsonl,
	ensureSessionFolder,
	utcNow,
	writeConversationMarkdown,
	writeJson,
} from "@/tracer/storage"
import type { Tracer } from "@/tracer/tracer"
import type {
	EventRecord,
	MessageRecord,
	MessageSource,
	RunRecord,
	SessionRecord,
	SessionStatus,
	TracerRole,
	TurnRecord,
	TurnStatus,
} from "@/tracer/types"

type FileTracerOptions = {
	model: string
	agent?: string | null
	baseDir?: string
}

const DEFAULT_BASE_DIR = "debug"

function toRecord(value: unknown): Record<string, unknown> {
	if (value !== null && typeof value === "object" && !Array.isArray(value)) {
		return value as Record<string, unknown>
	}
	return {}
}

function toOptionalInt(value: unknown): number | null {
	return typeof value === "number" && Number.isInteger(value) ? value : null
}

function toErrorInfo(error: unknown): { type: string; message: string } {
	if (error instanceof Error) return { type: error.name, message: error.message }
	return { type: "Error", message: String(error) }
}

type Usage = {
	inputTokens: number | null
	outputTokens: number | null
	totalTokens: number | null
	raw: Record<string, unknown>
}

function extractUsage(response: unknown): Usage {
	const usage = toRecord(toRecord(response).usage)
	const inputTokens = toOptionalInt(usage.input_tokens)
	const outputTokens = toOptionalInt(usage.output_tokens)
	const totalTokens = inputTokens !== null && outputTokens !== null ? inputTokens + outputTokens : null
	return { inputTokens, outputTokens, totalTokens, raw: usage }
}

export function createFileTracer(options: FileTracerOptions): Tracer {
	const sessionId = randomUUID().replace(/-/g, "").slice(0, 8)
	const baseDir = options.baseDir ?? DEFAULT_BASE_DIR
	const { folder } = ensureSessionFolder(baseDir, sessionId)

	const session: SessionRecord = {
		session_id: sessionId,
		model: options.model,
		agent: options.agent ?? null,
		debug_path: folder,
		started_at: utcNow(),
		completed_at: null,
		status: "running",
		total_input_tokens: null,
		total_output_tokens: null,
		total_tokens: null,
		estimated_cost_usd: null,
	}

	const messages: MessageRecord[] = []
	const turns: TurnRecord[] = []
	const runs: RunRecord[] = []
	let turnCounter = 0
	let runCounter = 0
	let currentTurnId: string | null = null

	function emitEvent(eventType: string, extra: Partial<EventRecord> = {}): void {
		const event: EventRecord = {
			session_id: sessionId,
			event_type: eventType,
			timestamp: utcNow(),
			...extra,
		}
		appendJsonl(folder, "events.jsonl", event)
	}

	function saveSession(): void {
		writeJson(folder, "session.json", session)
	}

	function saveMessages(): void {
		writeJson(folder, "messages.json", messages)
		writeConversationMarkdown(folder, session, messages)
	}

	function saveTurns(): void {
		writeJson(folder, "turns.json", turns)
	}

	function saveRuns(): void {
		writeJson(folder, "runs.json", runs)
	}

	function updateTotals(): void {
		let input = 0
		let output = 0
		let total = 0
		let cost = 0
		let hasInput = false
		let hasOutput = false
		let hasTotal = false
		let hasCost = false
		for (const run of runs) {
			if (run.input_tokens !== null) {
				input += run.input_tokens
				hasInput = true
			}
			if (run.output_tokens !== null) {
				output += run.output_tokens
				hasOutput = true
			}
			if (run.total_tokens !== null) {
				total += run.total_tokens
				hasTotal = true
			}
			if (run.estimated_cost_usd !== null) {
				cost += run.estimated_cost_usd
				hasCost = true
			}
		}
		session.total_input_tokens = hasInput ? input : null
		session.total_output_tokens = hasOutput ? output : null
		session.total_tokens = hasTotal ? total : null
		session.estimated_cost_usd = hasCost ? Number(cost.toFixed(8)) : null
	}

	function startTurn(userMessage: string): void {
		turnCounter += 1
		const turnId = `turn_${String(turnCounter).padStart(3, "0")}`
		currentTurnId = turnId
		turns.push({
			session_id: sessionId,
			turn_id: turnId,
			status: "running",
			started_at: utcNow(),
			completed_at: null,
			latency_ms: null,
			user_message: userMessage,
			assistant_message_id: null,
			error_type: null,
			error_message: null,
		})
		saveTurns()
		emitEvent("turn_started", { turn_id: turnId })
	}

	function finishTurn(status: TurnStatus, assistantMessageId: string | null, error: unknown): void {
		const turn = turns.find((candidate) => candidate.turn_id === currentTurnId)
		if (turn) {
			turn.status = status
			turn.completed_at = utcNow()
			turn.assistant_message_id = assistantMessageId
			if (status === "failed") {
				const info = toErrorInfo(error)
				turn.error_type = info.type
				turn.error_message = info.message
			}
			saveTurns()
			emitEvent(status === "completed" ? "turn_completed" : "turn_failed", { turn_id: turn.turn_id })
		}
		currentTurnId = null
	}

	function addMessage(role: TracerRole, content: string, source: MessageSource): string {
		const messageId = `msg_${String(messages.length + 1).padStart(3, "0")}`
		messages.push({
			session_id: sessionId,
			message_id: messageId,
			turn_id: currentTurnId,
			role,
			content,
			source,
			created_at: utcNow(),
		})
		saveMessages()
		emitEvent(`${role}_message_saved`, { message_id: messageId, turn_id: currentTurnId ?? undefined })
		return messageId
	}

	function recordRun(trace: ProviderTrace, purpose = "chat_response"): void {
		runCounter += 1
		const runId = `run_${String(runCounter).padStart(3, "0")}`
		// Raw wire request rides the event stream (the run record has no field for it).
		emitEvent("llm_run_started", {
			run_id: runId,
			turn_id: currentTurnId ?? undefined,
			purpose,
			data: { request: trace.request },
		})

		const usage = extractUsage(trace.response)
		const startedAt = new Date(Date.now() - trace.latencyMs).toISOString().replace(/\.\d{3}Z$/, "Z")
		runs.push({
			session_id: sessionId,
			run_id: runId,
			turn_id: currentTurnId,
			provider: trace.provider,
			model: session.model,
			purpose,
			status: trace.error ? "error" : "success",
			started_at: startedAt,
			completed_at: utcNow(),
			input_tokens: usage.inputTokens,
			output_tokens: usage.outputTokens,
			total_tokens: usage.totalTokens,
			latency_ms: trace.latencyMs,
			estimated_cost_usd: estimateCostUsd(session.model, usage.inputTokens, usage.outputTokens),
			raw_usage_metadata: usage.raw,
			raw_response_metadata: toRecord(trace.response),
			error_type: trace.error?.type ?? null,
			error_message: trace.error?.message ?? null,
		})
		updateTotals()
		saveRuns()
		saveSession()
		emitEvent(trace.error ? "llm_run_failed" : "llm_run_completed", {
			run_id: runId,
			turn_id: currentTurnId ?? undefined,
		})
	}

	function completeTurn(assistantMessageId: string | null): void {
		finishTurn("completed", assistantMessageId, null)
	}

	function failTurn(error: unknown, assistantMessageId: string | null): void {
		finishTurn("failed", assistantMessageId, error)
	}

	function close(status: SessionStatus = "completed"): void {
		session.status = status
		session.completed_at = utcNow()
		updateTotals()
		emitEvent("session_closed", { status })
		saveSession()
	}

	saveSession()
	saveMessages()
	saveTurns()
	saveRuns()

	return {
		sessionId,
		sessionPath: folder,
		startTurn,
		completeTurn,
		failTurn,
		addMessage,
		recordRun,
		close,
	}
}
