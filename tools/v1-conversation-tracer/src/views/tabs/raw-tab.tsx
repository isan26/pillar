import { JsonTree } from "@/components/json-tree";
import type { SessionDetail } from "@/types";

type RawTabProps = {
    detail: SessionDetail;
};

export function RawTab({ detail }: RawTabProps) {
    return (
        <div className="space-y-4 px-6 py-4">
            <Section title="session.json" value={detail.session} />
            <Section title={`turns.json (${detail.turns.length})`} value={detail.turns} />
            <Section title={`runs.json (${detail.runs.length})`} value={detail.runs} />
            <Section title={`events.jsonl (${detail.events.length})`} value={detail.events} />
            <Section title={`messages.json (${detail.messages.length})`} value={detail.messages} />
        </div>
    );
}

type SectionProps = {
    title: string;
    value: unknown;
};

function Section({ title, value }: SectionProps) {
    return (
        <details className="overflow-hidden rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)]">
            <summary className="cursor-pointer border-b border-[color:var(--color-border)] bg-[color:var(--color-bg-elev-2)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-dim)]">
                {title}
            </summary>
            <div className="overflow-auto p-3">
                <JsonTree value={value} initiallyExpanded={false} />
            </div>
        </details>
    );
}
