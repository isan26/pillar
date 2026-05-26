import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { debugSessionsPlugin } from "./src/server/debug-sessions-plugin";

export default defineConfig({
    plugins: [react(), tailwindcss(), debugSessionsPlugin()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
});
