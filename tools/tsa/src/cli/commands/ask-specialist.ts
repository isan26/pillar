import { loadSpecialist } from "@/agent/specialist"
import { askSpecialist } from "@/calls/ask-specialist"
import { runCli, outputRunTurnResultToCli } from "@/cli/utils.cli"
import { createFileTracer } from "@/tracer/file-tracer"

/*
|--------------------------------------------------------------------------
| ASK A SPECIALIST: `as <specialist> <input...>` loads a personal specialist
|--------------------------------------------------------------------------
*/

runCli(async () => {
	const [id, ...rest] = process.argv.slice(2)
	const input = rest.join(" ").trim()

	if (!id || !input) {
		console.error('Usage: as <specialist> <input>   e.g. as md "metallica 83-91"')
		process.exit(1)
	}

	const specialist = loadSpecialist(id)
	const agentName = `Specialist: ${specialist.name}`
	const result = await askSpecialist({
		input,
		model: specialist.model,
		systemPrompt: specialist.systemPrompt,
		inputSource: "console",
		traceRecorder: createFileTracer({ model: specialist.model, agent: agentName }),
	})

	outputRunTurnResultToCli(result, { agentName })
})
