import { runTurn } from "@/agent/run-turn";
import { loadSpecialist } from "@/agent/specialist";
import { runCli } from "@/cli/run-cli";

/*
|--------------------------------------------------------------------------
|  ASK A SPECIALIST: `as <specialist> <input...>`: loads a personal specialist
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
    
	await runTurn({
		input,
		model: specialist.model,
		systemPrompt: specialist.systemPrompt,
		agentName: specialist.name,
	})
})
