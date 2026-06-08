import { ask } from "@/calls/ask"
import { runCli, outputRunTurnResultToCli } from "@/cli/utils.cli"
import { DEFAULT_MODEL } from "@/constants/defaults"
import { createFileTracer } from "@/tracer/file-tracer"

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

	const result = await ask({
		input: question,
		model: DEFAULT_MODEL,
		inputSource: "console",
		traceRecorder: createFileTracer({ model: DEFAULT_MODEL, agent: null }),
	})
	outputRunTurnResultToCli(result)
})
