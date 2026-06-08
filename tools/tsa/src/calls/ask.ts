import { runTurn, type AgentRunTurnResult } from "@/agent/run-turn"
import { DEFAULT_MODEL } from "@/constants/defaults"
import type { TraceRecorder } from "@/tracer/tracer"
import type { MessageSource } from "@/tracer/types"

export type AskCallOptions = {
	input: string
	model?: string
	inputSource?: MessageSource
	traceRecorder?: TraceRecorder | null
}

export function ask(options: AskCallOptions): Promise<AgentRunTurnResult> {
	const model = options.model ?? DEFAULT_MODEL
	return runTurn({
		input: options.input,
		model,
		inputSource: options.inputSource,
		traceRecorder: options.traceRecorder,
	})
}
