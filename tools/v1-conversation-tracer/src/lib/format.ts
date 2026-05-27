export function formatLatency(latencyMs: number | null | undefined): string {
    if (latencyMs == null) return "—";
    if (latencyMs < 1000) return `${Math.round(latencyMs)}ms`;
    return `${(latencyMs / 1000).toFixed(2)}s`;
}

export function formatTokens(tokens: number | null | undefined): string {
    if (tokens == null) return "—";
    if (tokens < 1000) return tokens.toString();
    return `${(tokens / 1000).toFixed(1)}k`;
}

export function formatCost(cost: number | null | undefined): string {
    if (cost == null) return "—";
    if (cost < 0.01) return `$${cost.toFixed(6)}`;
    return `$${cost.toFixed(4)}`;
}

export function formatDuration(startedAt: string, completedAt: string | null): string {
    if (!completedAt) return "running";
    const startMs = Date.parse(startedAt);
    const endMs = Date.parse(completedAt);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "—";
    const totalSeconds = Math.round((endMs - startMs) / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
}

export function formatRelative(timestamp: string): string {
    const ms = Date.parse(timestamp);
    if (Number.isNaN(ms)) return timestamp;
    const diffSeconds = Math.round((Date.now() - ms) / 1000);
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.round(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.round(diffSeconds / 3600)}h ago`;
    return `${Math.round(diffSeconds / 86400)}d ago`;
}

export function formatTimestamp(timestamp: string): string {
    const ms = Date.parse(timestamp);
    if (Number.isNaN(ms)) return timestamp;
    return new Date(ms).toLocaleString();
}

export function formatTimeOnly(timestamp: string): string {
    const ms = Date.parse(timestamp);
    if (Number.isNaN(ms)) return timestamp;
    return new Date(ms).toLocaleTimeString();
}

export function shortenModel(model: string): string {
    const colonIdx = model.indexOf(":");
    return colonIdx === -1 ? model : model.slice(colonIdx + 1);
}
