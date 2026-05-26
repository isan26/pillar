import { StatusBadge } from "@/components/status-badge";
import { formatTimestamp } from "@/lib/format";
import type { DebugEvent, SessionDetail } from "@/types";

type LifecycleTabProps = {
    detail: SessionDetail;
};

export function LifecycleTab({ detail }: LifecycleTabProps) {
    if (detail.events.length === 0) {
        return (
            <div className="px-6 py-12 text-center text-[color:var(--color-text-dim)]">
                No events recorded.
            </div>
        );
    }
    return (
        <div className="px-6 py-4">
            <ol className="relative border-l border-[color:var(--color-border)]">
                {detail.events.map((event, idx) => (
                    <EventRow key={`${event.timestamp}-${idx}`} event={event} />
                ))}
            </ol>
        </div>
    );
}

type EventRowProps = {
    event: DebugEvent;
};

function EventRow({ event }: EventRowProps) {
    const tone = eventTone(event.event_type);
    return (
        <li className="ml-4 pb-3">
            <span
                className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-[color:var(--color-bg)] ${dotColor(
                    tone,
                )}`}
            />
            <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-[color:var(--color-text-dim)]">
                    {formatTimestamp(event.timestamp)}
                </span>
                <StatusBadge label={event.event_type} tone={tone} />
                <span className="text-xs text-[color:var(--color-text-dim)]">
                    {[event.turn_id, event.run_id, event.message_id, event.purpose, event.status]
                        .filter(Boolean)
                        .join(" · ")}
                </span>
            </div>
        </li>
    );
}

function eventTone(eventType: string): "ok" | "warn" | "err" | "muted" | "accent" {
    if (eventType.endsWith("_failed") || eventType.endsWith("_error")) return "err";
    if (eventType.endsWith("_started")) return "accent";
    if (eventType.endsWith("_completed") || eventType.endsWith("_saved")) return "ok";
    return "muted";
}

function dotColor(tone: "ok" | "warn" | "err" | "muted" | "accent"): string {
    switch (tone) {
        case "ok":
            return "bg-[color:var(--color-ok)]";
        case "warn":
            return "bg-[color:var(--color-warn)]";
        case "err":
            return "bg-[color:var(--color-err)]";
        case "accent":
            return "bg-[color:var(--color-accent)]";
        default:
            return "bg-[color:var(--color-border-strong)]";
    }
}
