import { useQuery } from "@tanstack/react-query";
import type { SessionDetail } from "@/types";

async function fetchSession(sessionId: string): Promise<SessionDetail> {
    const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`);
    if (response.status === 404) {
        throw new Error(`session ${sessionId} not found`);
    }
    if (!response.ok) {
        throw new Error(`/api/sessions/${sessionId} failed: ${response.status}`);
    }
    return (await response.json()) as SessionDetail;
}

export function useSession(sessionId: string | undefined) {
    return useQuery({
        queryKey: ["session", sessionId],
        queryFn: () => {
            if (!sessionId) throw new Error("sessionId is required");
            return fetchSession(sessionId);
        },
        enabled: Boolean(sessionId),
        refetchOnWindowFocus: true,
        staleTime: 5_000,
    });
}
