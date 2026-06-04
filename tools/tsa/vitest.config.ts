import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Make the `@/` alias resolve in tests the same way it does in tsx / tsconfig.
export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
})
