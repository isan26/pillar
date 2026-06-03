import type { ProviderTrace } from "@/providers/providers.types"
import type { SessionStatus, TracerRole } from "@/tracer/types"

// The seam between the app and any debug-logging backend. A future SQLite /
// Postgres tracer can implement this same type and the app won't change.
//
// Lifecycle for one user input: startTurn -> addMessage("user") -> (provider
// fires onTrace -> recordRun) -> addMessage("assistant") -> completeTurn.
export type Tracer = {
	readonly sessionId: string
	readonly sessionPath: string
	startTurn(userMessage: string): void
	completeTurn(assistantMessageId: string | null): void
	failTurn(error: unknown, assistantMessageId: string | null): void
	addMessage(role: TracerRole, content: string, source: string): string
	recordRun(trace: ProviderTrace, purpose?: string): void
	close(status?: SessionStatus): void
}
