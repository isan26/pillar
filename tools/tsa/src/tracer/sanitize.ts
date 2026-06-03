// Recursive redaction of secret-like values before anything is written to disk.
// Redacts keys such as api_key / authorization / *_token, but never token-COUNT
// fields like input_tokens / output_tokens.

const REDACTED = "[redacted]"

const SECRET_KEYS = new Set([
	"api_key",
	"apikey",
	"authorization",
	"bearer",
	"cookie",
	"password",
	"secret",
	"access_token",
	"refresh_token",
	"client_secret",
])

const TOKEN_COUNT_KEYS = new Set([
	"input_tokens",
	"output_tokens",
	"total_tokens",
	"cache_creation_input_tokens",
	"cache_read_input_tokens",
])

function isSecretKey(key: string): boolean {
	const lower = key.toLowerCase()
	if (TOKEN_COUNT_KEYS.has(lower)) return false
	if (SECRET_KEYS.has(lower)) return true
	if (lower === "token") return true
	return lower.endsWith("_token") || lower.endsWith("-token")
}

export function sanitize(value: unknown): unknown {
	if (Array.isArray(value)) {
		return (value as unknown[]).map((item) => sanitize(item))
	}
	if (value !== null && typeof value === "object") {
		const result: Record<string, unknown> = {}
		for (const [key, item] of Object.entries(value)) {
			result[key] = isSecretKey(key) ? REDACTED : sanitize(item)
		}
		return result
	}
	return value
}
