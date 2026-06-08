import { DEFAULT_MODEL } from "@/constants/defaults"
import { createAnthropicModel } from "@/providers/anthropic.providers"
import { PROVIDER } from "@/providers/constants.providers"
import type { ChatModel, ProviderOptions } from "@/providers/types.providers"
import { getModelProvider } from "@/providers/utils.providers"
import { assertNever } from "@/utils/utils"

export function createChat(model: string = DEFAULT_MODEL, options: ProviderOptions = {}): ChatModel {
	const provider = getModelProvider(model)

	switch (provider) {
		case PROVIDER.ANTHROPIC:
			return createAnthropicModel(model, options)
		case PROVIDER.OPENAI:
			throw new Error("createChat: openai provider not implemented yet")
		default:
			return assertNever(provider, `@createChat: unhandled provider "${provider}"`)
	}
}
