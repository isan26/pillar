import { afterEach, describe, expect, it, vi } from "vitest"
import { runTurn } from "@/agent/run-turn"
import { createChat } from "@/providers/providers"
import type { ChatModel, ChatResponse, ProviderOptions, ProviderTrace } from "@/providers/types.providers"
import type { TraceRecorder } from "@/tracer/tracer"
import type { Message } from "@/types"

vi.mock("@/providers/providers", () => ({
	createChat: vi.fn(),
}))

const createChatMock = vi.mocked(createChat)

const providerTrace: ProviderTrace = {
	provider: "test",
	request: { messages: [] },
	response: { usage: { input_tokens: 1, output_tokens: 2 } },
	requestId: "req_1",
	latencyMs: 12,
	error: null,
}

const response: ChatResponse = {
	text: "hello back",
	usage: { inputTokens: 1, outputTokens: 2 },
	stopReason: "end_turn",
}

function createFakeRecorder(failMethods: Set<string> = new Set()): {
	recorder: TraceRecorder
	calls: string[]
} {
	const calls: string[] = []
	let messageCount = 0

	function failIfNeeded(method: string): void {
		if (failMethods.has(method)) throw new Error(`${method} failed`)
	}

	const recorder: TraceRecorder = {
		sessionId: "session_1",
		location: { kind: "file", path: "debug/conversations/session_1" },
		startTurn(userMessage) {
			calls.push(`startTurn:${userMessage}`)
			failIfNeeded("startTurn")
		},
		completeTurn(assistantMessageId) {
			calls.push(`completeTurn:${assistantMessageId ?? "null"}`)
			failIfNeeded("completeTurn")
		},
		failTurn(error, assistantMessageId) {
			const message = error instanceof Error ? error.message : String(error)
			calls.push(`failTurn:${assistantMessageId ?? "null"}:${message}`)
			failIfNeeded("failTurn")
		},
		addMessage(role, content, source) {
			calls.push(`addMessage:${role}:${content}:${source}`)
			failIfNeeded("addMessage")
			messageCount += 1
			return `msg_${String(messageCount).padStart(3, "0")}`
		},
		recordRun(trace, purpose = "chat_response") {
			calls.push(`recordRun:${trace.provider}:${purpose}`)
			failIfNeeded("recordRun")
		},
		close(status = "completed") {
			calls.push(`close:${status}`)
			failIfNeeded("close")
		},
	}

	return { recorder, calls }
}

function mockChat(chatResponse: ChatResponse, trace: ProviderTrace = providerTrace): {
	messages: Message[][]
} {
	const messages: Message[][] = []
	createChatMock.mockImplementation((_: string | undefined, options?: ProviderOptions): ChatModel => {
		return async (nextMessages: Message[]): Promise<ChatResponse> => {
			messages.push(nextMessages)
			await options?.onTrace?.(trace)
			return chatResponse
		}
	})

	return { messages }
}

afterEach(() => {
	vi.restoreAllMocks()
	createChatMock.mockReset()
})

describe("runTurn", () => {
	it("returns the chat response with trace metadata and records the turn lifecycle", async () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => undefined)
		const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
		const { recorder, calls } = createFakeRecorder()
		const { messages } = mockChat(response)

		const result = await runTurn({
			input: "hello",
			model: "test:model",
			systemPrompt: "be kind",
			inputSource: "api",
			traceRecorder: recorder,
		})

		expect(result).toEqual({
			...response,
			trace: {
				sessionId: "session_1",
				location: { kind: "file", path: "debug/conversations/session_1" },
			},
			traceWarnings: [],
		})
		expect(messages).toEqual([[{ role: "user", content: "hello" }]])
		expect(createChatMock).toHaveBeenCalledWith(
			"test:model",
			expect.objectContaining({ systemPrompt: "be kind" }),
		)
		expect(calls).toEqual([
			"startTurn:hello",
			"addMessage:user:hello:api",
			"recordRun:test:chat_response",
			"addMessage:assistant:hello back:model",
			"completeTurn:msg_002",
			"close:completed",
		])
		expect(log).not.toHaveBeenCalled()
		expect(error).not.toHaveBeenCalled()
	})

	it("keeps returning the model response when trace recording fails", async () => {
		const { recorder } = createFakeRecorder(
			new Set(["startTurn", "addMessage", "recordRun", "completeTurn", "close"]),
		)
		mockChat(response)

		const result = await runTurn({
			input: "hello",
			model: "test:model",
			traceRecorder: recorder,
		})

		expect(result.text).toBe("hello back")
		expect(result.traceWarnings.map((warning) => warning.operation)).toEqual([
			"startTurn",
			"addUserMessage",
			"recordRun",
			"addAssistantMessage",
			"completeTurn",
			"close",
		])
	})

	it("records a failed turn best-effort and rethrows the original model error", async () => {
		const modelError = new Error("model down")
		const { recorder, calls } = createFakeRecorder()
		createChatMock.mockImplementation((_: string | undefined, options?: ProviderOptions): ChatModel => {
			return async (): Promise<ChatResponse> => {
				await options?.onTrace?.({
					...providerTrace,
					response: null,
					error: { type: "Error", message: "model down" },
				})
				throw modelError
			}
		})

		await expect(
			runTurn({
				input: "hello",
				model: "test:model",
				traceRecorder: recorder,
			}),
		).rejects.toThrow("model down")

		expect(calls).toEqual([
			"startTurn:hello",
			"addMessage:user:hello:user",
			"recordRun:test:chat_response",
			"failTurn:null:model down",
			"close:failed",
		])
	})
})
