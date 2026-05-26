import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useSessions } from "@/hooks/use-sessions";
import { SessionPane } from "@/views/session-pane";

export function SessionDetailView() {
    const params = useParams<{ sessionId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const primaryId = params.sessionId;
    const compareParam = searchParams.get("with");
    const compareIds = compareParam ? compareParam.split(",").filter(Boolean) : [];
    const { data: allSessions } = useSessions();
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    if (!primaryId) return null;

    const allIds = [primaryId, ...compareIds];
    const availableForCompare = (allSessions ?? []).filter(
        (session) => !allIds.includes(session.session_id),
    );

    function addCompare(sessionId: string): void {
        const next = [...compareIds, sessionId];
        setSearchParams({ with: next.join(",") });
        setIsPickerOpen(false);
    }

    function removeCompare(sessionId: string): void {
        const next = compareIds.filter((id) => id !== sessionId);
        if (next.length === 0) {
            searchParams.delete("with");
            setSearchParams(searchParams);
        } else {
            setSearchParams({ with: next.join(",") });
        }
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-6 py-2 text-sm">
                <Link
                    to="/"
                    className="text-[color:var(--color-text-dim)] no-underline hover:text-[color:var(--color-text)]"
                >
                    ← All sessions
                </Link>
                <div className="relative flex items-center gap-2">
                    {compareIds.length > 0 && (
                        <span className="text-xs text-[color:var(--color-text-dim)]">
                            comparing {allIds.length} sessions
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsPickerOpen((open) => !open)}
                        disabled={availableForCompare.length === 0}
                        className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev-2)] px-3 py-1 text-xs hover:border-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        + Add comparison
                    </button>
                    {isPickerOpen && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-72 max-h-80 overflow-auto rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] shadow-lg">
                            {availableForCompare.map((session) => (
                                <button
                                    key={session.session_id}
                                    type="button"
                                    onClick={() => addCompare(session.session_id)}
                                    className="block w-full px-3 py-2 text-left text-xs hover:bg-[color:var(--color-bg-elev-2)]"
                                >
                                    <div className="text-[color:var(--color-text-strong)]">
                                        {session.session_id}
                                    </div>
                                    <div className="text-[color:var(--color-text-dim)]">
                                        {session.model} · {session.turn_count} turns
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-1 divide-x divide-[color:var(--color-border)] overflow-hidden">
                {allIds.map((sessionId) => (
                    <SessionPane
                        key={sessionId}
                        sessionId={sessionId}
                        canClose={sessionId !== primaryId}
                        onClose={() => removeCompare(sessionId)}
                    />
                ))}
            </div>
        </div>
    );
}
