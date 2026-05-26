import { Link, Outlet, useLocation } from "react-router-dom";

export function Layout() {
    const location = useLocation();
    const isOnSessionsList = location.pathname === "/";

    return (
        <div className="flex h-screen flex-col">
            <header className="flex items-center gap-4 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-6 py-3">
                <Link to="/" className="flex items-center gap-2 no-underline">
                    <span className="text-lg font-semibold text-[color:var(--color-text-strong)]">
                        v1-conversation-tracer
                    </span>
                    <span className="rounded bg-[color:var(--color-accent-dim)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--color-accent)]">
                        local
                    </span>
                </Link>
                <nav className="ml-6 flex items-center gap-4 text-sm">
                    <Link
                        to="/"
                        className={`no-underline ${
                            isOnSessionsList
                                ? "text-[color:var(--color-text-strong)]"
                                : "text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)]"
                        }`}
                    >
                        Sessions
                    </Link>
                </nav>
            </header>
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
