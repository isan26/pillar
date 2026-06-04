export function splitFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
	const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
	if (!match) return { meta: {}, body: raw.trim() }
	const meta: Record<string, string> = {}
	for (const line of (match[1] ?? "").split("\n")) {
		const i = line.indexOf(":")
		if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
	}
	return { meta, body: (match[2] ?? "").trim() }
}
