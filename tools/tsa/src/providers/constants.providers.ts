import type { ModelPrice } from "@/types"

export const PROVIDER = {
	ANTHROPIC: "anthropic",
	OPENAI: "openai",
} as const

export type Provider = (typeof PROVIDER)[keyof typeof PROVIDER]

export const MODELS = {
	[PROVIDER.ANTHROPIC]: {
		HAIKU_4_5: "claude-haiku-4-5",
		OPUS_4_8: "claude-opus-4-8",
	},
	[PROVIDER.OPENAI]: {
		todo: "todo",
	},
} as const satisfies Record<Provider, Record<string, string>>

export const MODEL_PRICING: Record<string, ModelPrice> = {
	[MODELS.anthropic.OPUS_4_8]: { input: 5, output: 25 },
	[MODELS.anthropic.HAIKU_4_5]: { input: 1, output: 5 },
}