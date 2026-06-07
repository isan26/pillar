export type Role = 
    | "user" // messages supplied by the human/user.
    | "assistant" // messages produced by the assistant/model.

export type Message = {
    role: Role;
    content: string; // plain text body of the message.
}

// USD per 1,000,000 tokens. null when unknown.
export type ModelPrice = {
	input: number | null
	output: number | null
}