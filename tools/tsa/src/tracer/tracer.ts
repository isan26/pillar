import type { ProviderTrace } from "@/providers/types.providers"
import type { MessageSource, SessionStatus, TracerRole } from "@/tracer/types"

type MaybePromise<T> = T | Promise<T>

export type TraceLocation =
	| { kind: "file"; path: string }
	| { kind: "remote"; url: string | null }

export type TraceWarning = {
	operation: string
	message: string
}

export type TraceSummary = {
	sessionId: string
	location: TraceLocation | null
}

// Best-effort facade for app code. It mirrors TraceRecorder, but converts
// adapter failures into warnings so tracing never blocks the model response.
export type TraceCapture = {
	readonly warnings: TraceWarning[]
	summary(): TraceSummary | null
	startTurn(userMessage: string): Promise<void>
	completeTurn(assistantMessageId: string | null): Promise<void>
	failTurn(error: unknown, assistantMessageId: string | null): Promise<void>
	addMessage(role: TracerRole, content: string, source: MessageSource): Promise<string | null>
	recordRun(trace: ProviderTrace, purpose?: string): Promise<void>
	close(status?: SessionStatus): Promise<void>
}

// The seam between the app and any debug-logging backend. A future endpoint,
// SQLite, or Postgres tracer can implement this type and the app won't change.
//
// Lifecycle for one user input: startTurn -> addMessage("user") -> (provider
// fires onTrace -> recordRun) -> addMessage("assistant") -> completeTurn.
export type TraceRecorder = {
	readonly sessionId: string
	readonly location?: TraceLocation
	startTurn(userMessage: string): MaybePromise<void>
	completeTurn(assistantMessageId: string | null): MaybePromise<void>
	failTurn(error: unknown, assistantMessageId: string | null): MaybePromise<void>
	addMessage(role: TracerRole, content: string, source: MessageSource): MaybePromise<string>
	recordRun(trace: ProviderTrace, purpose?: string): MaybePromise<void>
	close(status?: SessionStatus): MaybePromise<void>
}

export type TraceRecorderFactory<TContext> = (context: TContext) => TraceRecorder | null

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error)
}

function summarizeTraceRecorder(traceRecorder: TraceRecorder | null): TraceSummary | null {
	if (!traceRecorder) return null
	return {
		sessionId: traceRecorder.sessionId,
		location: traceRecorder.location ?? null,
	}
}

export function createTraceCapture(traceRecorder: TraceRecorder | null): TraceCapture {
	const warnings: TraceWarning[] = []

	// Void trace writes are fire-and-capture: failures become warnings.
	async function capture(operation: string, action: () => void | Promise<void>): Promise<void> {
		try {
			await action()
		} catch (error) {
			warnings.push({ operation, message: errorMessage(error) })
		}
	}

	// Message writes return ids used later to complete/fail the turn.
	async function captureValue<T>(
		operation: string,
		action: () => T | Promise<T>,
		fallback: T,
	): Promise<T> {
		try {
			return await action()
		} catch (error) {
			warnings.push({ operation, message: errorMessage(error) })
			return fallback
		}
	}

	return {
		warnings,
		summary() {
			return summarizeTraceRecorder(traceRecorder)
		},
		startTurn(userMessage) {
			return capture("startTurn", () => traceRecorder?.startTurn(userMessage))
		},
		completeTurn(assistantMessageId) {
			return capture("completeTurn", () => traceRecorder?.completeTurn(assistantMessageId))
		},
		failTurn(error, assistantMessageId) {
			return capture("failTurn", () => traceRecorder?.failTurn(error, assistantMessageId))
		},
		addMessage(role, content, source) {
			return captureValue(
				`add${role.charAt(0).toUpperCase()}${role.slice(1)}Message`,
				() => traceRecorder?.addMessage(role, content, source) ?? null,
				null,
			)
		},
		recordRun(trace, purpose) {
			return capture("recordRun", () => traceRecorder?.recordRun(trace, purpose))
		},
		close(status) {
			return capture("close", () => traceRecorder?.close(status))
		},
	}
}

export type Tracer = TraceRecorder & {
	readonly sessionPath: string
}
