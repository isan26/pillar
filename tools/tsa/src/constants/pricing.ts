import { MODEL_ANTHROPIC } from "@/constants/model"

// USD per 1,000,000 tokens. null when unknown.
type Price = {
	input: number | null
	output: number | null
}

const PRICING: Record<string, Price> = {
	[MODEL_ANTHROPIC.OPUS_4_8]: { input: 5, output: 25 },
	[MODEL_ANTHROPIC.HAIKU_4_5]: { input: 1, output: 5 },
}

export function estimateCostUsd(
	model: string,
	inputTokens: number | null,
	outputTokens: number | null,
): number | null {
	const price = PRICING[model]
	if (!price || price.input === null || price.output === null) return null
	if (inputTokens === null || outputTokens === null) return null
	const cost = (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output
	return Number(cost.toFixed(8))
}
