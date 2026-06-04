import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import type { ServerResponse } from "node:http";
import type {
    DebugEvent,
    Message,
    Run,
    Session,
    SessionDetail,
    SessionSummary,
    Turn,
} from "../types";

const HERE = dirname(fileURLToPath(import.meta.url));
// Defaults to tsa's debug folder. Set TRACER_CONVERSATIONS_DIR to override
// (e.g. point at the legacy repo-root debug/ the Python app writes to).
const CONVERSATIONS_DIR = process.env.TRACER_CONVERSATIONS_DIR
    ? resolve(process.env.TRACER_CONVERSATIONS_DIR)
    : resolve(HERE, "../../../tsa/debug/conversations");

async function readJson<T>(path: string, fallback: T): Promise<T> {
    try {
        const raw = await readFile(path, "utf-8");
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function normaliseSession(session: Session): Session {
    return { ...session, agent: session.agent ?? null };
}

const FIRST_MESSAGE_MAX_CHARS = 200;

function extractFirstUserMessage(messages: Message[]): string | null {
    for (const message of messages) {
        if (message.role !== "user") continue;
        const collapsed = message.content.replace(/\s+/g, " ").trim();
        if (collapsed.length === 0) continue;
        if (collapsed.length <= FIRST_MESSAGE_MAX_CHARS) return collapsed;
        return `${collapsed.slice(0, FIRST_MESSAGE_MAX_CHARS)}…`;
    }
    return null;
}

async function readJsonl<T>(path: string): Promise<T[]> {
    try {
        const raw = await readFile(path, "utf-8");
        const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
        const parsed: T[] = [];
        for (const line of lines) {
            try {
                parsed.push(JSON.parse(line) as T);
            } catch {
                // skip malformed line
            }
        }
        return parsed;
    } catch {
        return [];
    }
}

async function listSessionFolders(): Promise<string[]> {
    try {
        const entries = await readdir(CONVERSATIONS_DIR, { withFileTypes: true });
        return entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort()
            .reverse();
    } catch {
        return [];
    }
}

async function loadSummary(folder: string): Promise<SessionSummary | null> {
    const folderPath = join(CONVERSATIONS_DIR, folder);
    const raw = await readJson<Session | null>(join(folderPath, "session.json"), null);
    if (!raw) return null;
    const session = normaliseSession(raw);

    const [turns, runs, messages] = await Promise.all([
        readJson<Turn[]>(join(folderPath, "turns.json"), []),
        readJson<Run[]>(join(folderPath, "runs.json"), []),
        readJson<Message[]>(join(folderPath, "messages.json"), []),
    ]);

    const errorCount =
        turns.filter((turn) => turn.status === "failed").length +
        runs.filter((run) => run.status === "error").length;

    return {
        ...session,
        folder,
        turn_count: turns.length,
        run_count: runs.length,
        message_count: messages.length,
        error_count: errorCount,
        first_user_message: extractFirstUserMessage(messages),
    };
}

async function findFolderById(sessionId: string): Promise<string | null> {
    const folders = await listSessionFolders();
    for (const folder of folders) {
        if (folder.endsWith(`-${sessionId}`)) return folder;
        const session = await readJson<Session | null>(
            join(CONVERSATIONS_DIR, folder, "session.json"),
            null,
        );
        if (session?.session_id === sessionId) return folder;
    }
    return null;
}

async function loadDetail(sessionId: string): Promise<SessionDetail | null> {
    const folder = await findFolderById(sessionId);
    if (!folder) return null;

    const folderPath = join(CONVERSATIONS_DIR, folder);
    const raw = await readJson<Session | null>(join(folderPath, "session.json"), null);
    if (!raw) return null;
    const session = normaliseSession(raw);

    const [messages, turns, runs, events] = await Promise.all([
        readJson<Message[]>(join(folderPath, "messages.json"), []),
        readJson<Turn[]>(join(folderPath, "turns.json"), []),
        readJson<Run[]>(join(folderPath, "runs.json"), []),
        readJsonl<DebugEvent>(join(folderPath, "events.jsonl")),
    ]);

    return { session, folder, messages, turns, runs, events };
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(body));
}

export function debugSessionsPlugin(): Plugin {
    return {
        name: "v1-conversation-tracer:debug-sessions",
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = req.url ?? "";
                if (!url.startsWith("/api/")) return next();

                try {
                    if (url === "/api/sessions") {
                        const folders = await listSessionFolders();
                        const summaries = await Promise.all(folders.map(loadSummary));
                        const filtered = summaries.filter(
                            (entry): entry is SessionSummary => entry !== null,
                        );
                        sendJson(res, 200, { sessions: filtered });
                        return;
                    }

                    if (url === "/api/conversations-dir") {
                        const exists = await stat(CONVERSATIONS_DIR)
                            .then(() => true)
                            .catch(() => false);
                        sendJson(res, 200, { path: CONVERSATIONS_DIR, exists });
                        return;
                    }

                    const detailMatch = url.match(/^\/api\/sessions\/([^/?#]+)/);
                    if (detailMatch) {
                        const sessionId = decodeURIComponent(detailMatch[1] ?? "");
                        const detail = await loadDetail(sessionId);
                        if (!detail) {
                            sendJson(res, 404, { error: "session not found", sessionId });
                            return;
                        }
                        sendJson(res, 200, detail);
                        return;
                    }

                    sendJson(res, 404, { error: "not found", url });
                } catch (error) {
                    sendJson(res, 500, {
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            });
        },
    };
}
