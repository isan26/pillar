import { describe, expect, it } from "vitest"
import { splitFrontmatter } from "@/utils/utils"

describe("splitFrontmatter", () => {
	it("extracts frontmatter keys and the body", () => {
		const { meta, body } = splitFrontmatter("---\nmodel: claude-opus-4-8\n---\nYou are helpful.")
		expect(meta.model).toBe("claude-opus-4-8")
		expect(body).toBe("You are helpful.")
	})

	it("returns empty meta and the whole text when there is no frontmatter", () => {
		const { meta, body } = splitFrontmatter("just a prompt, no fences")
		expect(meta).toEqual({})
		expect(body).toBe("just a prompt, no fences")
	})

	it("parses multiple keys and trims whitespace", () => {
		const { meta, body } = splitFrontmatter("---\nmodel:  claude-haiku-4-5 \nname: commit\n---\n\n  body here  ")
		expect(meta).toEqual({ model: "claude-haiku-4-5", name: "commit" })
		expect(body).toBe("body here")
	})

	it("splits only on the first colon", () => {
		const { meta } = splitFrontmatter("---\nbase_url: https://x.test/v1\n---\nbody")
		expect(meta.base_url).toBe("https://x.test/v1")
	})

	it("ignores frontmatter lines without a colon", () => {
		const { meta } = splitFrontmatter("---\nmodel: x\ngarbage line\n---\nbody")
		expect(meta).toEqual({ model: "x" })
	})

	it("tolerates CRLF line endings (Windows files)", () => {
		const { meta, body } = splitFrontmatter("---\r\nmodel: claude-opus-4-8\r\n---\r\nbody")
		expect(meta.model).toBe("claude-opus-4-8")
		expect(body).toBe("body")
	})
})
