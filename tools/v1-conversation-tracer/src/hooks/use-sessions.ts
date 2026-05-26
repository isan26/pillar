import { useQuery } from "@tanstack/react-query";
import type { SessionSummary } from "@/types";

type SessionsResponse = {
    sessions: SessionSummary[];
};

async function fetchSessions(): Promise<SessionSummary[]> {
    const response = await fetch("/api/sessions");
    if (!response.ok) {
        throw new Error(`/api/sessions failed: ${response.status}`);
    }
    const body = (await response.json()) as SessionsResponse;
    return body.sessions;
}

export function useSessions() {
    return useQuery({
        queryKey: ["sessions"],
        queryFn: fetchSessions,
        refetchOnWindowFocus: true,
        staleTime: 5_000,
    });
}
