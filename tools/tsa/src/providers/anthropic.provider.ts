import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODEL, MAX_TOKENS } from "@/constants/model";
import type { ChatModel, ChatResponse } from "@/providers/providers.types";
import type { Message } from "@/types";

export function createAnthropicModel(model: string = DEFAULT_MODEL): ChatModel {
    const sdk = new Anthropic();

    return async function chat(messages: Message[]): Promise<ChatResponse> {
        const response = await sdk.messages.create({
            model,
            max_tokens: MAX_TOKENS,
            messages: messages.map((message) => ({ role: message.role, content: message.content })),
        });

        const parts: string[] = [];
        for (const block of response.content) {
            if (block.type === "text") parts.push(block.text);
        }

        return {
            text: parts.join(""),
            stopReason: response.stop_reason,
            usage: {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
            },
        };
    };
}
