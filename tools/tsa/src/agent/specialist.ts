import { resolve } from "node:path"
import { readFileSync } from "node:fs"
import { splitFrontmatter } from "@/utils/utils"
import { DEFAULT_MODEL } from "@/constants/defaults"

const SPECIALIST_DIR = "personal/calls/ask-specialist"

// A specialist is a system prompt-only agent, with no tools and no loop — the minimal, degenerate end of the agent spectrum. Loaded from <SPECIALIST_DIR>/<id>.md
export type Specialist = {
    id: string; // filename without .md
    name: string; // display name from frontmatter; falls back to id
    systemPrompt: string
    model: string;
}

export function loadSpecialist(id: string): Specialist {
    const path = resolve(process.cwd(), SPECIALIST_DIR, `${id}.md`)

    let raw: string

    try {
        raw = readFileSync(path, "utf-8")
    } catch {
        throw new Error(`@agent/specialist: id ${id} not found`)
    }

    const { meta, body } = splitFrontmatter(raw)

    if (!body) throw new Error(`@agent/specialist: specialist requires a system prompt. Please add body to ${id}.md file.`)

    return {
        id,
        name: meta.name ?? id,
        model: meta.model ?? DEFAULT_MODEL,
        systemPrompt: body
    }
}