// Filesystem primitives and the conversation.md renderer. Stateless: every
// function takes the session folder and a payload and writes it. Everything is
// run through sanitize() first so secrets never reach disk.

import { appendFileSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { sanitize } from "@/tracer/sanitize"
import type { MessageRecord, SessionRecord } from "@/tracer/types"

const ENCODING = "utf-8"

export function utcNow(): string {
	return new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
}

export function ensureSessionFolder(baseDir: string, sessionId: string): { folder: string; timestamp: string } {
	const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
	const folder = join(baseDir, "conversations", `${timestamp}-${sessionId}`)
	mkdirSync(folder, { recursive: true })
	return { folder, timestamp }
}

export function writeJson(folder: string, name: string, payload: unknown): void {
	const safe = sanitize(payload)
	writeFileSync(join(folder, name), `${JSON.stringify(safe, null, 2)}\n`, ENCODING)
}

export function appendJsonl(folder: string, name: string, payload: unknown): void {
	const safe = sanitize(payload)
	appendFileSync(join(folder, name), `${JSON.stringify(safe)}\n`, ENCODING)
}

export function renderConversationMarkdown(session: SessionRecord, messages: MessageRecord[]): string {
	const lines = [
		"# Conversation",
		"",
		`Session: ${session.session_id}`,
		`Model: ${session.model}`,
		`Started: ${session.started_at}`,
		"",
	]
	for (const message of messages) {
		const role = message.role.charAt(0).toUpperCase() + message.role.slice(1)
		const turnId = message.turn_id ?? "session"
		lines.push(`## ${role} - ${turnId}`, "", message.content, "")
	}
	return lines.join("\n")
}

export function writeConversationMarkdown(folder: string, session: SessionRecord, messages: MessageRecord[]): void {
	writeFileSync(join(folder, "conversation.md"), renderConversationMarkdown(session, messages), ENCODING)
}
