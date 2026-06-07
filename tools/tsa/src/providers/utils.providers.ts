import { PROVIDER, MODELS, MODEL_PRICING } from "@/providers/constants.providers";
import type { Provider } from "@/providers/constants.providers";

export function getModelProvider(model: string): Provider {
	for (const provider of Object.values(PROVIDER)) {
		const models = Object.values(MODELS[provider]) as readonly string[]

		if (models.includes(model)) {
			return provider
		}
	}

	throw new Error(`Unknown model: ${model}`)
}

export function estimateModelCostUsd(
	model: string,
	inputTokens: number | null,
	outputTokens: number | null,
): number | null {
	const price = MODEL_PRICING[model]
	if (!price || price.input === null || price.output === null) return null
	if (inputTokens === null || outputTokens === null) return null
	const cost = (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output
	return Number(cost.toFixed(8))
}
