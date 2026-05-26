type Tone = "ok" | "warn" | "err" | "muted" | "accent";

type StatusBadgeProps = {
    label: string;
    tone?: Tone;
};

const TONE_CLASSES: Record<Tone, string> = {
    ok: "bg-[color:var(--color-ok)]/15 text-[color:var(--color-ok)] border-[color:var(--color-ok)]/30",
    warn: "bg-[color:var(--color-warn)]/15 text-[color:var(--color-warn)] border-[color:var(--color-warn)]/30",
    err: "bg-[color:var(--color-err)]/15 text-[color:var(--color-err)] border-[color:var(--color-err)]/30",
    muted: "bg-[color:var(--color-bg-elev-2)] text-[color:var(--color-text-dim)] border-[color:var(--color-border)]",
    accent: "bg-[color:var(--color-accent-dim)] text-[color:var(--color-accent)] border-[color:var(--color-accent)]/30",
};

export function StatusBadge({ label, tone = "muted" }: StatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${TONE_CLASSES[tone]}`}
        >
            {label}
        </span>
    );
}

export function statusTone(status: string): Tone {
    if (status === "completed" || status === "success") return "ok";
    if (status === "running") return "accent";
    if (status === "failed" || status === "error") return "err";
    return "muted";
}
