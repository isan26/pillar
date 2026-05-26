import { useState } from "react";

type JsonTreeProps = {
    value: unknown;
    initiallyExpanded?: boolean;
};

export function JsonTree({ value, initiallyExpanded = true }: JsonTreeProps) {
    return (
        <div className="font-mono text-xs leading-relaxed">
            <JsonNode value={value} depth={0} initiallyExpanded={initiallyExpanded} />
        </div>
    );
}

type JsonNodeProps = {
    value: unknown;
    depth: number;
    initiallyExpanded: boolean;
};

function JsonNode({ value, depth, initiallyExpanded }: JsonNodeProps) {
    if (value === null) return <span className="text-[color:var(--color-text-dim)]">null</span>;
    if (typeof value === "string")
        return <span className="text-[color:var(--color-ok)]">"{value}"</span>;
    if (typeof value === "number")
        return <span className="text-[color:var(--color-accent)]">{value}</span>;
    if (typeof value === "boolean")
        return <span className="text-[color:var(--color-warn)]">{String(value)}</span>;
    if (Array.isArray(value)) {
        return <JsonArray items={value} depth={depth} initiallyExpanded={initiallyExpanded} />;
    }
    if (typeof value === "object") {
        return (
            <JsonObject
                entries={value as Record<string, unknown>}
                depth={depth}
                initiallyExpanded={initiallyExpanded}
            />
        );
    }
    return <span>{String(value)}</span>;
}

type JsonObjectProps = {
    entries: Record<string, unknown>;
    depth: number;
    initiallyExpanded: boolean;
};

function JsonObject({ entries, depth, initiallyExpanded }: JsonObjectProps) {
    const [isOpen, setIsOpen] = useState(initiallyExpanded || depth < 1);
    const keys = Object.keys(entries);
    if (keys.length === 0) return <span className="text-[color:var(--color-text-dim)]">{"{}"}</span>;

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)]"
            >
                {`{…${keys.length} keys}`}
            </button>
        );
    }

    return (
        <span>
            <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)]"
            >
                {"{"}
            </button>
            <div className="ml-4 border-l border-[color:var(--color-border)] pl-3">
                {keys.map((key, idx) => (
                    <div key={key}>
                        <span className="text-[color:var(--color-text-strong)]">"{key}"</span>
                        <span className="text-[color:var(--color-text-dim)]">: </span>
                        <JsonNode
                            value={entries[key]}
                            depth={depth + 1}
                            initiallyExpanded={false}
                        />
                        {idx < keys.length - 1 && (
                            <span className="text-[color:var(--color-text-dim)]">,</span>
                        )}
                    </div>
                ))}
            </div>
            <span className="text-[color:var(--color-text-dim)]">{"}"}</span>
        </span>
    );
}

type JsonArrayProps = {
    items: unknown[];
    depth: number;
    initiallyExpanded: boolean;
};

function JsonArray({ items, depth, initiallyExpanded }: JsonArrayProps) {
    const [isOpen, setIsOpen] = useState(initiallyExpanded || depth < 1);
    if (items.length === 0) return <span className="text-[color:var(--color-text-dim)]">[]</span>;

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)]"
            >
                {`[…${items.length} items]`}
            </button>
        );
    }

    return (
        <span>
            <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)]"
            >
                {"["}
            </button>
            <div className="ml-4 border-l border-[color:var(--color-border)] pl-3">
                {items.map((item, idx) => (
                    <div key={idx}>
                        <JsonNode value={item} depth={depth + 1} initiallyExpanded={false} />
                        {idx < items.length - 1 && (
                            <span className="text-[color:var(--color-text-dim)]">,</span>
                        )}
                    </div>
                ))}
            </div>
            <span className="text-[color:var(--color-text-dim)]">]</span>
        </span>
    );
}
