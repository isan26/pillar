import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/views/layout";
import { SessionsListView } from "@/views/sessions-list";
import { SessionDetailView } from "@/views/session-detail";

export const router = createBrowserRouter([
    {
        path: "/",
        Component: Layout,
        children: [
            { index: true, Component: SessionsListView },
            { path: "sessions/:sessionId", Component: SessionDetailView },
        ],
    },
]);
