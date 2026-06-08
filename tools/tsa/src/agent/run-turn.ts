import { createChat } from "@/providers/providers";
import type { ChatResponse } from "@/providers/types.providers"
import {
	createTraceCapture,
	type TraceRecorder,
	type TraceSummary,
	type TraceWarning,
} from "@/tracer/tracer"
import type { MessageSource } from "@/tracer/types"
import type { Message } from "@/types"

export type AgentRunTurnOptions = {
	input: string
	model: string
	systemPrompt?: string // omit for a bare call
	inputSource?: MessageSource
	traceRecorder?: TraceRecorder | null
}

export type AgentRunTurnResult = ChatResponse & {
	trace: TraceSummary | null
	traceWarnings: TraceWarning[]
}

export async function runTurn(options: AgentRunTurnOptions): Promise<AgentRunTurnResult> {
	const traceCapture = createTraceCapture(options.traceRecorder ?? null)

	const chat = createChat(options.model, {
		systemPrompt: options.systemPrompt,
		onTrace: (trace) => traceCapture.recordRun(trace),
	})
	
	const inputSource = options.inputSource ?? "user"

	await traceCapture.startTurn(options.input)
	await traceCapture.addMessage("user", options.input, inputSource)

	const messages: Message[] = [{ role: "user", content: options.input }]

	try {
		const response = await chat(messages)
		const assistantId = await traceCapture.addMessage("assistant", response.text, "model")

		await traceCapture.completeTurn(assistantId)
		await traceCapture.close("completed")

		return {
			...response,
			trace: traceCapture.summary(),
			traceWarnings: traceCapture.warnings,
		}
	} catch (err) {
		await traceCapture.failTurn(err, null)
		await traceCapture.close("failed")
		throw err
	}
}
