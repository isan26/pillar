import type { Message } from "@/types";

export type TokenUsage = {
    inputTokens: number;
    outputTokens: number;
};

export type ChatResponse = {
    text: string;
    usage: TokenUsage;
    stopReason: null | string;
};

// A chat-capable language model. Each provider implements this.
export type ChatModel = (messages: Message[]) => Promise<ChatResponse>;