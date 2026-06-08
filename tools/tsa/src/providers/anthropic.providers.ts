import Anthropic from "@anthropic-ai/sdk"
import { DEFAULT_MODEL, MAX_TOKENS } from "@/constants/defaults"
import { PROVIDER } from "@/providers/constants.providers"
import type { ChatModel, ChatResponse, ProviderOptions } from "@/providers/types.providers"
import type { Message } from "@/types"

export function createAnthropicModel(
	model: string = DEFAULT_MODEL,
	options: ProviderOptions = {},
): ChatModel {
	const sdk = new Anthropic()

	return async function chat(messages: Message[]): Promise<ChatResponse> {
		const request: Anthropic.MessageCreateParamsNonStreaming = {
			model,
			max_tokens: MAX_TOKENS,
			system: options.systemPrompt,
			messages: messages.map((message) => ({
				role: message.role,
				content: message.content,
			})),
		}
		
		const startedMs = Date.now()

		try {
			const response = await sdk.messages.create(request)
			const requestId = response._request_id ?? null

			await options.onTrace?.({
				provider: PROVIDER.ANTHROPIC,
				request,
				response,
				requestId,
				latencyMs: Date.now() - startedMs,
				error: null,
			})

			const parts: string[] = []
			for (const block of response.content) {
				if (block.type === "text") parts.push(block.text)
			}

			return {
				text: parts.join(""),
				stopReason: response.stop_reason,
				usage: {
					inputTokens: response.usage.input_tokens,
					outputTokens: response.usage.output_tokens,
				},
			}
		} catch (error) {
			await options.onTrace?.({
				provider: PROVIDER.ANTHROPIC,
				request,
				response: null,
				requestId: null,
				latencyMs: Date.now() - startedMs,
				error:
					error instanceof Error
						? { type: error.name, message: error.message }
						: { type: "Error", message: String(error) },
			})
			throw error
		}
	}
}
