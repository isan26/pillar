import { DEFAULT_MODEL } from "@/constants/model"
import { createAnthropicModel } from "@/providers/anthropic.provider"
import { createFileTracer } from "@/tracer/file-tracer"
import type { Message } from "@/types"

/*
|--------------------------------------------------------------------------
| SIMPLE 1 QUESTION -> 1 RESPONSE (a single-call command, not an agent)
|--------------------------------------------------------------------------
*/

async function main(): Promise<void> {
	const question = process.argv.slice(2).join(" ").trim()

	if (!question) {
		console.error("Type your question after the script name, e.g. ask.ts wudup?")
		process.exit(1)
	}

	const tracer = createFileTracer({ model: DEFAULT_MODEL })
	const chat = createAnthropicModel(DEFAULT_MODEL, {
		onTrace: (trace) => tracer.recordRun(trace),
	})

	tracer.startTurn(question)
	tracer.addMessage("user", question, "console")
	const messages: Message[] = [{ role: "user", content: question }]

	try {
		const response = await chat(messages)
		const assistantId = tracer.addMessage("assistant", response.text, "model")
		tracer.completeTurn(assistantId)
		tracer.close("completed")

		console.log(response.text)
		// Diagnostics go to stderr so stdout stays just the answer (pipeable).
		console.error(`[trace] ${tracer.sessionId} -> ${tracer.sessionPath}`)
		console.error(response.usage)
		if (response.stopReason) console.error(`stop: ${response.stopReason}`)
	} catch (error) {
		tracer.failTurn(error, null)
		tracer.close("failed")
		throw error
	}
}

main().catch((error: unknown) => {
	console.error(error)
	process.exit(1)
})
