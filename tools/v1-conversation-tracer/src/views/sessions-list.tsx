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

type SortKey = "started_at" | "model" | "turn_count" | "total_tokens" | "estimated_cost_usd";
type SortDir = "asc" | "desc";

export function SessionsListView() {
    const { data: sessions, isLoading, error } = useSessions();
    const [modelFilter, setModelFilter] = useState<string>("all");
    const [sortKey, setSortKey] = useState<SortKey>("started_at");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const models = useMemo(() => {
        if (!sessions) return [];
        return Array.from(new Set(sessions.map((session) => session.model))).sort();
    }, [sessions]);

    const visible = useMemo(() => {
        if (!sessions) return [];
        const filtered =
            modelFilter === "all"
                ? sessions
                : sessions.filter((session) => session.model === modelFilter);
        return [...filtered].sort(compareSessions(sortKey, sortDir));
    }, [sessions, modelFilter, sortKey, sortDir]);

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
                <label className="flex items-center gap-2 text-sm">
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
                            <ThSort
                                label="Model"
                                active={sortKey === "model"}
                                dir={sortDir}
                                onClick={() => toggleSort("model")}
                            />
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Duration</th>
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
            <td className="px-3 py-2">
                <Link
                    to={`/sessions/${session.session_id}`}
                    className="text-[color:var(--color-accent)] no-underline hover:underline"
                    title={formatTimestamp(session.started_at)}
                >
                    {formatRelative(session.started_at)}
                </Link>
            </td>
            <td className="px-3 py-2 font-mono text-xs">{shortenModel(session.model)}</td>
            <td className="px-3 py-2">
                <StatusBadge label={session.status} tone={statusTone(session.status)} />
            </td>
            <td className="px-3 py-2 text-[color:var(--color-text-dim)]">
                {formatDuration(session.started_at, session.completed_at)}
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
