import { createAnthropicModel } from "@/providers/anthropic.provider";
import { createFileTracer } from "@/tracer/file-tracer";
import type { Message } from '@/types';

export type AgentRunTurnOptions = {
    input: string
    model: string
    systemPrompt?: string // omit for a bare call
    agentName?: string | null // name to stamp on the session
}

export async function runTurn(options: AgentRunTurnOptions): Promise<void> {
    const tracer = createFileTracer({ model: options.model, agent: options.agentName ?? null })
    const chat = createAnthropicModel(options.model, {
        systemPrompt: options.systemPrompt,
        onTrace: trace => tracer.recordRun(trace)
    })

    tracer.startTurn(options.input)
    tracer.addMessage("user", options.input, "console")

    const messages: Message[] = [{ role: "user", content: options.input }]

    try {
        const response = await chat(messages)
        const assistantId = tracer.addMessage("assistant", response.text, "model")

        tracer.completeTurn(assistantId)
        tracer.close("completed")

        console.log(response.text)
        const agentName = options.agentName ? ` (${options.agentName})` : ""
		console.error(`[trace] ${tracer.sessionId}${agentName} -> ${tracer.sessionPath}`)
		console.error(response.usage)
		if (response.stopReason) console.error(`stop: ${response.stopReason}`)
    } catch (err) {
        tracer.failTurn(err, null)
        tracer.close("failed")
        throw err
    }
}

