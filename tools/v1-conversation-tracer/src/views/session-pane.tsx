import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import { StatusBadge, statusTone } from "@/components/status-badge";
import {
    formatCost,
    formatDuration,
    formatTimestamp,
    formatTokens,
    shortenModel,
} from "@/lib/format";
import { ConversationTab } from "@/views/tabs/conversation-tab";
import { LifecycleTab } from "@/views/tabs/lifecycle-tab";
import { RawTab } from "@/views/tabs/raw-tab";
import type { SessionDetail } from "@/types";

type Tab = "conversation" | "lifecycle" | "raw";
const TABS: { id: Tab; label: string }[] = [
    { id: "conversation", label: "Conversation" },
    { id: "lifecycle", label: "Lifecycle" },
    { id: "raw", label: "Raw" },
];

type SessionPaneProps = {
    sessionId: string;
    canClose: boolean;
    onClose: () => void;
};

export function SessionPane({ sessionId, canClose, onClose }: SessionPaneProps) {
    const { data, isLoading, error } = useSession(sessionId);
    const [activeTab, setActiveTab] = useState<Tab>("conversation");

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col">
            {isLoading && (
                <div className="px-6 py-12 text-center text-[color:var(--color-text-dim)]">
                    Loading {sessionId}…
                </div>
            )}
            {error && (
                <div className="px-6 py-12 text-center text-[color:var(--color-err)]">
                    {(error as Error).message}
                </div>
            )}
            {data && (
                <>
                    <PaneHeader detail={data} canClose={canClose} onClose={onClose} />
                    <div className="flex items-center gap-1 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-6">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`border-b-2 px-3 py-2 text-sm ${
                                    activeTab === tab.id
                                        ? "border-[color:var(--color-accent)] text-[color:var(--color-text-strong)]"
                                        : "border-transparent text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)]"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-auto">
                        {activeTab === "conversation" && <ConversationTab detail={data} />}
                        {activeTab === "lifecycle" && <LifecycleTab detail={data} />}
                        {activeTab === "raw" && <RawTab detail={data} />}
                    </div>
                </>
            )}
        </div>
    );
}

type PaneHeaderProps = {
    detail: SessionDetail;
    canClose: boolean;
    onClose: () => void;
};

function PaneHeader({ detail, canClose, onClose }: PaneHeaderProps) {
    const { session } = detail;
    return (
        <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-6 py-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-[color:var(--color-text-strong)]">
                            {session.session_id}
                        </span>
                        <StatusBadge label={session.status} tone={statusTone(session.status)} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[color:var(--color-text-dim)]">
                        <span className="font-mono text-[color:var(--color-text)]">
                            {session.agent ?? "(default agent.md)"}
                        </span>
                        <span>·</span>
                        <span>{shortenModel(session.model)}</span>
                        <span>·</span>
                        <span>{formatTimestamp(session.started_at)}</span>
                    </div>
                </div>
                {canClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        title="Remove from comparison"
                        className="text-[color:var(--color-text-dim)] hover:text-[color:var(--color-err)]"
                    >
                        ×
                    </button>
                )}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <Metric label="duration" value={formatDuration(session.started_at, session.completed_at)} />
                <Metric label="turns" value={detail.turns.length.toString()} />
                <Metric label="tokens" value={formatTokens(session.total_tokens)} />
                <Metric label="cost" value={formatCost(session.estimated_cost_usd)} />
            </div>
        </div>
    );
}

type MetricProps = {
    label: string;
    value: string;
};

function Metric({ label, value }: MetricProps) {
    return (
        <div className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev-2)] px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-dim)]">
                {label}
            </div>
            <div className="font-mono text-sm text-[color:var(--color-text-strong)]">{value}</div>
        </div>
    );
}
