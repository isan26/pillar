import { useMemo, useState } from "react";
import { JsonTree } from "@/components/json-tree";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { formatLatency, formatTimeOnly, formatTokens } from "@/lib/format";
import type { Message, Role, Run, SessionDetail, Turn } from "@/types";

type ConversationTabProps = {
    detail: SessionDetail;
};

export function ConversationTab({ detail }: ConversationTabProps) {
    const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
    const runsByTurn = useMemo(() => groupRunsByTurn(detail.runs), [detail.runs]);
    const turnsById = useMemo(() => {
        const map = new Map<string, Turn>();
        for (const turn of detail.turns) map.set(turn.turn_id, turn);
        return map;
    }, [detail.turns]);

    const visibleMessages = detail.messages.filter((message) => message.role !== "system");
    const selectedTurn = selectedTurnId ? turnsById.get(selectedTurnId) ?? null : null;
    const selectedRuns = selectedTurnId ? runsByTurn.get(selectedTurnId) ?? [] : [];

    return (
        <div className="grid h-full grid-cols-[1fr_360px]">
            <div className="overflow-auto px-6 py-4">
                <div className="space-y-3">
                    {visibleMessages.map((message) => (
                        <MessageBubble
                            key={message.message_id}
                            message={message}
                            turn={message.turn_id ? turnsById.get(message.turn_id) ?? null : null}
                            runs={
                                message.turn_id ? runsByTurn.get(message.turn_id) ?? [] : []
                            }
                            isSelected={message.turn_id === selectedTurnId}
                            onSelect={() => setSelectedTurnId(message.turn_id ?? null)}
                        />
                    ))}
                </div>
            </div>
            <aside className="overflow-auto border-l border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-4 py-4">
                {selectedTurn ? (
                    <TurnInspector turn={selectedTurn} runs={selectedRuns} />
                ) : (
                    <div className="text-xs text-[color:var(--color-text-dim)]">
                        Click an assistant message to inspect its turn.
                    </div>
                )}
            </aside>
        </div>
    );
}

function groupRunsByTurn(runs: Run[]): Map<string, Run[]> {
    const map = new Map<string, Run[]>();
    for (const run of runs) {
        const key = run.turn_id ?? "_no_turn";
        const list = map.get(key) ?? [];
        list.push(run);
        map.set(key, list);
    }
    return map;
}

const ROLE_STYLES: Record<Role, string> = {
    user: "border-[color:var(--color-border-strong)] bg-[color:var(--color-bg-elev)]",
    assistant: "border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent-dim)]/40",
    system: "border-[color:var(--color-border)] bg-[color:var(--color-bg-elev-2)]",
};

const ROLE_LABEL: Record<Role, string> = {
    user: "User",
    assistant: "Assistant",
    system: "System",
};

type MessageBubbleProps = {
    message: Message;
    turn: Turn | null;
    runs: Run[];
    isSelected: boolean;
    onSelect: () => void;
};

function MessageBubble({ message, turn, runs, isSelected, onSelect }: MessageBubbleProps) {
    const isAssistant = message.role === "assistant";
    const aggregatedRun = pickRunForMessage(runs);

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`block w-full rounded-lg border px-4 py-3 text-left transition ${
                ROLE_STYLES[message.role]
            } ${isSelected ? "ring-2 ring-[color:var(--color-accent)]" : ""}`}
        >
            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-[color:var(--color-text-dim)]">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-[color:var(--color-text-strong)]">
                        {ROLE_LABEL[message.role]}
                    </span>
                    {message.turn_id && <span>· {message.turn_id}</span>}
                    {message.source !== "user" && message.source !== "model" && (
                        <StatusBadge label={message.source} tone="warn" />
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isAssistant && turn && (
                        <span title="turn latency">{formatLatency(turn.latency_ms)}</span>
                    )}
                    <span>{formatTimeOnly(message.created_at)}</span>
                </div>
            </div>
            <div className="whitespace-pre-wrap font-sans text-sm text-[color:var(--color-text-strong)]">
                {message.content}
            </div>
            {isAssistant && aggregatedRun && (
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono text-[color:var(--color-text-dim)]">
                    <Pill label={`in ${formatTokens(aggregatedRun.input_tokens)}`} />
                    <Pill label={`out ${formatTokens(aggregatedRun.output_tokens)}`} />
                    {reasoningTokens(aggregatedRun) != null && (
                        <Pill label={`reasoning ${formatTokens(reasoningTokens(aggregatedRun))}`} />
                    )}
                    <Pill label={`run ${formatLatency(aggregatedRun.latency_ms)}`} />
                    <Pill label={aggregatedRun.purpose} />
                </div>
            )}
        </button>
    );
}

function Pill({ label }: { label: string }) {
    return (
        <span className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev-2)] px-1.5 py-0.5">
            {label}
        </span>
    );
}

function pickRunForMessage(runs: Run[]): Run | null {
    if (runs.length === 0) return null;
    const successful = runs.find((run) => run.status === "success");
    return successful ?? runs[0] ?? null;
}

function reasoningTokens(run: Run): number | null {
    const raw = run.raw_usage_metadata;
    if (typeof raw !== "object" || raw === null) return null;
    const details = (raw as Record<string, unknown>).output_token_details;
    if (typeof details !== "object" || details === null) return null;
    const value = (details as Record<string, unknown>).reasoning;
    return typeof value === "number" ? value : null;
}

type TurnInspectorProps = {
    turn: Turn;
    runs: Run[];
};

function TurnInspector({ turn, runs }: TurnInspectorProps) {
    return (
        <div className="space-y-4 text-xs">
            <section>
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[color:var(--color-text-strong)]">
                        {turn.turn_id}
                    </h3>
                    <StatusBadge label={turn.status} tone={statusTone(turn.status)} />
                </div>
                <dl className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <Field label="started" value={formatTimeOnly(turn.started_at)} />
                    <Field
                        label="completed"
                        value={turn.completed_at ? formatTimeOnly(turn.completed_at) : "—"}
                    />
                    <Field label="latency" value={formatLatency(turn.latency_ms)} />
                    <Field
                        label="msg id"
                        value={turn.assistant_message_id ?? "—"}
                    />
                </dl>
                {turn.error_message && (
                    <div className="mt-2 rounded border border-[color:var(--color-err)]/40 bg-[color:var(--color-err)]/10 px-2 py-1 text-[color:var(--color-err)]">
                        <div className="font-semibold">{turn.error_type}</div>
                        <div className="whitespace-pre-wrap">{turn.error_message}</div>
                    </div>
                )}
            </section>

            {runs.map((run) => (
                <section
                    key={run.run_id}
                    className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev-2)] p-2"
                >
                    <div className="mb-2 flex items-center justify-between">
                        <span className="font-mono text-[color:var(--color-text-strong)]">
                            {run.run_id} · {run.purpose}
                        </span>
                        <StatusBadge label={run.status} tone={statusTone(run.status)} />
                    </div>
                    <dl className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <Field label="model" value={shortenModelOrEmpty(run.model)} />
                        <Field label="latency" value={formatLatency(run.latency_ms)} />
                        <Field label="in" value={formatTokens(run.input_tokens)} />
                        <Field label="out" value={formatTokens(run.output_tokens)} />
                    </dl>
                    <details className="mt-2">
                        <summary className="cursor-pointer text-[color:var(--color-text-dim)]">
                            usage_metadata
                        </summary>
                        <div className="mt-1 rounded bg-[color:var(--color-bg)] p-2">
                            <JsonTree value={run.raw_usage_metadata} initiallyExpanded={false} />
                        </div>
                    </details>
                    <details className="mt-1">
                        <summary className="cursor-pointer text-[color:var(--color-text-dim)]">
                            response_metadata
                        </summary>
                        <div className="mt-1 rounded bg-[color:var(--color-bg)] p-2">
                            <JsonTree value={run.raw_response_metadata} initiallyExpanded={false} />
                        </div>
                    </details>
                    {run.error_message && (
                        <div className="mt-2 rounded border border-[color:var(--color-err)]/40 bg-[color:var(--color-err)]/10 px-2 py-1 text-[color:var(--color-err)]">
                            <div className="font-semibold">{run.error_type}</div>
                            <div className="whitespace-pre-wrap">{run.error_message}</div>
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
}

function shortenModelOrEmpty(model: string): string {
    const idx = model.indexOf(":");
    return idx === -1 ? model : model.slice(idx + 1);
}

type FieldProps = {
    label: string;
    value: string;
};

function Field({ label, value }: FieldProps) {
    return (
        <div>
            <dt className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-dim)]">
                {label}
            </dt>
            <dd className="text-[color:var(--color-text)]">{value}</dd>
        </div>
    );
}
