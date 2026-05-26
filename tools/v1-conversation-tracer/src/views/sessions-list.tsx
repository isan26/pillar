import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSessions } from "@/hooks/use-sessions";
import { StatusBadge, statusTone } from "@/components/status-badge";
import {
    formatCost,
    formatDuration,
    formatRelative,
    formatTimestamp,
    formatTokens,
    shortenModel,
} from "@/lib/format";
import type { SessionSummary } from "@/types";

type SortKey =
    | "started_at"
    | "model"
    | "agent"
    | "turn_count"
    | "total_tokens"
    | "estimated_cost_usd";
type SortDir = "asc" | "desc";

const DEFAULT_AGENT_VALUE = "__default__";
const DEFAULT_AGENT_LABEL = "(default agent.md)";

export function SessionsListView() {
    const { data: sessions, isLoading, error } = useSessions();
    const [modelFilter, setModelFilter] = useState<string>("all");
    const [agentFilter, setAgentFilter] = useState<string>("all");
    const [sortKey, setSortKey] = useState<SortKey>("started_at");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const models = useMemo(() => {
        if (!sessions) return [];
        return Array.from(new Set(sessions.map((session) => session.model))).sort();
    }, [sessions]);

    const agents = useMemo(() => {
        if (!sessions) return [];
        const unique = new Set<string>();
        let hasDefault = false;
        for (const session of sessions) {
            if (session.agent == null) hasDefault = true;
            else unique.add(session.agent);
        }
        const sorted = Array.from(unique).sort();
        return hasDefault ? [DEFAULT_AGENT_VALUE, ...sorted] : sorted;
    }, [sessions]);

    const visible = useMemo(() => {
        if (!sessions) return [];
        const byModel =
            modelFilter === "all"
                ? sessions
                : sessions.filter((session) => session.model === modelFilter);
        const byAgent =
            agentFilter === "all"
                ? byModel
                : byModel.filter((session) =>
                      agentFilter === DEFAULT_AGENT_VALUE
                          ? session.agent == null
                          : session.agent === agentFilter,
                  );
        return [...byAgent].sort(compareSessions(sortKey, sortDir));
    }, [sessions, modelFilter, agentFilter, sortKey, sortDir]);

    function toggleSort(key: SortKey): void {
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
            return;
        }
        setSortKey(key);
        setSortDir("desc");
    }

    if (isLoading) return <PageMessage label="Loading sessions…" />;
    if (error)
        return <PageMessage label={`Failed to load: ${(error as Error).message}`} tone="err" />;
    if (!sessions || sessions.length === 0)
        return <PageMessage label="No sessions yet. Run agent.py to create one." />;

    return (
        <div className="px-6 py-6">
            <div className="mb-4 flex items-end justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[color:var(--color-text-strong)]">
                        Sessions
                    </h1>
                    <p className="text-sm text-[color:var(--color-text-dim)]">
                        {visible.length} of {sessions.length}
                    </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2">
                        <span className="text-[color:var(--color-text-dim)]">Agent</span>
                        <select
                            value={agentFilter}
                            onChange={(event) => setAgentFilter(event.target.value)}
                            className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-2 py-1 text-[color:var(--color-text)]"
                        >
                            <option value="all">all</option>
                            {agents.map((agent) => (
                                <option key={agent} value={agent}>
                                    {agent === DEFAULT_AGENT_VALUE ? DEFAULT_AGENT_LABEL : agent}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="text-[color:var(--color-text-dim)]">Model</span>
                        <select
                            value={modelFilter}
                            onChange={(event) => setModelFilter(event.target.value)}
                            className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-2 py-1 text-[color:var(--color-text)]"
                        >
                            <option value="all">all</option>
                            {models.map((model) => (
                                <option key={model} value={model}>
                                    {model}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <div className="overflow-x-auto rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)]">
                <table className="w-full text-sm">
                    <thead className="border-b border-[color:var(--color-border)] bg-[color:var(--color-bg-elev-2)] text-left text-xs uppercase tracking-wide text-[color:var(--color-text-dim)]">
                        <tr>
                            <ThSort
                                label="Started"
                                active={sortKey === "started_at"}
                                dir={sortDir}
                                onClick={() => toggleSort("started_at")}
                            />
                            <th className="px-3 py-2">Prompt</th>
                            <ThSort
                                label="Agent"
                                active={sortKey === "agent"}
                                dir={sortDir}
                                onClick={() => toggleSort("agent")}
                            />
                            <ThSort
                                label="Model"
                                active={sortKey === "model"}
                                dir={sortDir}
                                onClick={() => toggleSort("model")}
                            />
                            <th className="px-3 py-2">Status</th>
                            <ThSort
                                label="Turns"
                                active={sortKey === "turn_count"}
                                dir={sortDir}
                                onClick={() => toggleSort("turn_count")}
                                align="right"
                            />
                            <ThSort
                                label="Tokens"
                                active={sortKey === "total_tokens"}
                                dir={sortDir}
                                onClick={() => toggleSort("total_tokens")}
                                align="right"
                            />
                            <ThSort
                                label="Cost"
                                active={sortKey === "estimated_cost_usd"}
                                dir={sortDir}
                                onClick={() => toggleSort("estimated_cost_usd")}
                                align="right"
                            />
                            <th className="px-3 py-2 text-right">Errors</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((session) => (
                            <SessionRow key={session.session_id} session={session} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

type ThSortProps = {
    label: string;
    active: boolean;
    dir: SortDir;
    onClick: () => void;
    align?: "left" | "right";
};

function ThSort({ label, active, dir, onClick, align = "left" }: ThSortProps) {
    const indicator = active ? (dir === "asc" ? " ↑" : " ↓") : "";
    return (
        <th className={`px-3 py-2 ${align === "right" ? "text-right" : ""}`}>
            <button
                type="button"
                onClick={onClick}
                className={`uppercase tracking-wide ${
                    active
                        ? "text-[color:var(--color-text-strong)]"
                        : "hover:text-[color:var(--color-text)]"
                }`}
            >
                {label}
                {indicator}
            </button>
        </th>
    );
}

type SessionRowProps = {
    session: SessionSummary;
};

function SessionRow({ session }: SessionRowProps) {
    return (
        <tr className="border-b border-[color:var(--color-border)] last:border-0 hover:bg-[color:var(--color-bg-elev-2)]">
            <td className="px-3 py-2 whitespace-nowrap">
                <Link
                    to={`/sessions/${session.session_id}`}
                    className="text-[color:var(--color-accent)] no-underline hover:underline"
                    title={formatTimestamp(session.started_at)}
                >
                    {formatRelative(session.started_at)}
                </Link>
            </td>
            <td className="px-3 py-2">
                {session.first_user_message ? (
                    <div
                        className="max-w-[420px] truncate text-[color:var(--color-text)]"
                        title={session.first_user_message}
                    >
                        {session.first_user_message}
                    </div>
                ) : (
                    <span className="text-[color:var(--color-text-dim)]">—</span>
                )}
            </td>
            <td className="px-3 py-2 font-mono text-xs">
                {session.agent ?? (
                    <span className="text-[color:var(--color-text-dim)]">{DEFAULT_AGENT_LABEL}</span>
                )}
            </td>
            <td className="px-3 py-2 font-mono text-xs">{shortenModel(session.model)}</td>
            <td className="px-3 py-2 whitespace-nowrap">
                <StatusDurationCell session={session} />
            </td>
            <td className="px-3 py-2 text-right">{session.turn_count}</td>
            <td className="px-3 py-2 text-right">{formatTokens(session.total_tokens)}</td>
            <td className="px-3 py-2 text-right">{formatCost(session.estimated_cost_usd)}</td>
            <td className="px-3 py-2 text-right">
                {session.error_count > 0 ? (
                    <span className="text-[color:var(--color-err)]">{session.error_count}</span>
                ) : (
                    <span className="text-[color:var(--color-text-dim)]">0</span>
                )}
            </td>
        </tr>
    );
}

function StatusDurationCell({ session }: { session: SessionSummary }) {
    if (session.status === "running") {
        return <StatusBadge label="running" tone={statusTone(session.status)} />;
    }
    const duration = formatDuration(session.started_at, session.completed_at);
    return (
        <div className="flex items-center gap-2">
            <StatusBadge label={session.status} tone={statusTone(session.status)} />
            <span className="font-mono text-xs text-[color:var(--color-text-dim)]">
                {duration}
            </span>
        </div>
    );
}

function compareSessions(
    key: SortKey,
    dir: SortDir,
): (a: SessionSummary, b: SessionSummary) => number {
    const sign = dir === "asc" ? 1 : -1;
    return (a, b) => {
        const left = a[key];
        const right = b[key];
        if (left == null && right == null) return 0;
        if (left == null) return 1;
        if (right == null) return -1;
        if (typeof left === "number" && typeof right === "number") return (left - right) * sign;
        return String(left).localeCompare(String(right)) * sign;
    };
}

type PageMessageProps = {
    label: string;
    tone?: "default" | "err";
};

function PageMessage({ label, tone = "default" }: PageMessageProps) {
    const color =
        tone === "err"
            ? "text-[color:var(--color-err)]"
            : "text-[color:var(--color-text-dim)]";
    return <div className={`px-6 py-12 text-center ${color}`}>{label}</div>;
}
