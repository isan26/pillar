import { runTurn } from "@/agent/run-turn";
import { runCli } from "@/cli/run-cli";
import { DEFAULT_MODEL } from "@/constants/model"

/*
|--------------------------------------------------------------------------
| SIMPLE 1 QUESTION -> 1 RESPONSE, NO AGENT
|--------------------------------------------------------------------------
*/

runCli(async () => {
	const question = process.argv.slice(2).join(" ").trim()
	if (!question) {
		console.error("Type your question after the script name, e.g. ask.ts wudup?")
		process.exit(1)
	}
	await runTurn({ input: question, model: DEFAULT_MODEL, agentName: null })
})
