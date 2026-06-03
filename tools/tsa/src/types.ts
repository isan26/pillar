export type Role = 
    | "user" // messages supplied by the human/user.
    | "assistant" // messages produced by the assistant/model.

export type Message = {
    role: Role;
    content: string; // plain text body of the message.
}