import type { Message } from "@/types"

export type TokenUsage = {
	inputTokens: number
	outputTokens: number
}

export type ChatResponse = {
	text: string
	usage: TokenUsage
	stopReason: string | null
}

// A chat-capable language model. Each provider implements this.
export type ChatModel = (messages: Message[]) => Promise<ChatResponse>

// Full per-call detail emitted by a provider for observability. The provider
// stays independent of the tracer: it just calls `onTrace` if one is supplied.
export type ProviderTrace = {
	provider: string
	request: unknown
	response: unknown | null
	requestId: string | null
	latencyMs: number
	error: { type: string; message: string } | null
}

export type ProviderOptions = {
	systemPrompt?: string
	onTrace?: (trace: ProviderTrace) => void
}
