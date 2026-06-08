import type { AgentRunTurnResult } from "@/agent/run-turn"
import type { TraceLocation, TraceWarning } from "@/tracer/tracer"
import { assertNever } from "@/utils/utils"

// Runs a CLI entrypoint: invoke the main fn, print any uncaught error to stderr, exit non-zero.
export function runCli(main: () => Promise<void>): void {
	main().catch((error: unknown) => {
		console.error(error)
		process.exit(1)
	})
}

// CLI presentation for one completed turn. The reusable call layer returns
// data only; this is where stdout/stderr decisions live.
export function outputRunTurnResultToCli(
	result: AgentRunTurnResult,
	options: { agentName?: string | null } = {},
): void {
	console.log(result.text)

	if (result.trace) {
		const agentName = options.agentName ? ` (${options.agentName})` : ""
		const location = formatTraceLocation(result.trace.location)
		const locationText = location ? ` -> ${location}` : ""
		console.error(`[trace] ${result.trace.sessionId}${agentName}${locationText}`)
	}

	console.error(result.usage)
	if (result.stopReason) console.error(`stop: ${result.stopReason}`)
	for (const warning of result.traceWarnings) outputTraceWarningToCli(warning)
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function formatTraceLocation(location: TraceLocation | null): string | null {
	if (!location) return null
	switch (location.kind) {
		case "file":
			return location.path
		case "remote":
			return location.url
		default:
			return assertNever(
				location,
				`outputRunTurnResultToCli: unhandled trace location ${JSON.stringify(location)}`,
			)
	}
}

function outputTraceWarningToCli(warning: TraceWarning): void {
	console.error(`[trace warning] ${warning.operation}: ${warning.message}`)
}
