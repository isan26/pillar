import { runTurn, type AgentRunTurnResult } from "@/agent/run-turn"
import { DEFAULT_MODEL } from "@/constants/defaults"
import type { TraceRecorder, TraceRecorderFactory } from "@/tracer/tracer"
import type { MessageSource } from "@/tracer/types"

export type AskSpecialistCallOptions = {
	input: string
	model?: string
	systemPrompt: string
	inputSource?: MessageSource
	traceRecorder?: TraceRecorder | null
}

export function askSpecialist(options: AskSpecialistCallOptions): Promise<AgentRunTurnResult> {
	const model = options.model ?? DEFAULT_MODEL
	return runTurn({
		input: options.input,
		model,
		systemPrompt: options.systemPrompt,
		inputSource: options.inputSource,
		traceRecorder: options.traceRecorder,
	})
}

/*
|--------------------------------------------------------------------------
| Ask Specialist Factory
|--------------------------------------------------------------------------
| Captures stable specialist config once, then each turn supplies only input.
| The optional trace factory lets the initializer decide where/how each fresh
| trace session is stored.
*/

export type CreateAskSpecialistTraceRecorder = TraceRecorderFactory<{
	input: string
	model: string
	systemPrompt: string
}>

export type CreateAskSpecialistOptions = Pick<
	AskSpecialistCallOptions,
	"model" | "systemPrompt" | "inputSource"
> & {
	createTraceRecorder?: CreateAskSpecialistTraceRecorder
}

export function createAskSpecialist(
	options: CreateAskSpecialistOptions,
): (input: string) => Promise<AgentRunTurnResult> {
	return function askSpecialistTurn(input: string): Promise<AgentRunTurnResult> {
		const model = options.model ?? DEFAULT_MODEL
		return askSpecialist({
			input,
			model,
			systemPrompt: options.systemPrompt,
			inputSource: options.inputSource,
			traceRecorder:
				options.createTraceRecorder?.({
					input,
					model,
					systemPrompt: options.systemPrompt,
				}) ?? null,
		})
	}
}
