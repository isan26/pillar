import { createAnthropicModel } from "@/providers/anthropic.provider";
import type { Message } from '@/types';

/*
|--------------------------------------------------------------------------
| SIMPLE 1 QUESTION -> 1 RESPONSE
|--------------------------------------------------------------------------
*/

async function main(): Promise<void> {
    const question = process.argv.slice(2).join(" ").trim() // everything after the script name becomes the question, e.g. `wudup?`

    if (!question) {
        console.error('Type your question after the script name, e.g. ask.ts wudup?')
        process.exit(1)
    }

    const chat = createAnthropicModel();
    const messages: Message[] = [{ role: "user", content: question }]
    const response = await chat(messages);

    console.log(response.text);
    console.log("--- --- --- --- --- --- ---");
    console.log(response.usage);
    if (response.stopReason) console.log(response.stopReason);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});