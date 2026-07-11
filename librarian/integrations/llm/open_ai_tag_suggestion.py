
from pydantic_ai import Agent
from pydantic import BaseModel
# Configure a cheap LLM to just suggest tags based on the content of a book

system_prompt = """
You are an AI assistant that extracts canonical semantic tags from books.

Your goal is to identify the important concepts discussed in the book, not chapter titles or summaries.

For each concept, produce:

- tag: A short canonical concept name.
- description: A concise explanation (1–2 sentences) describing the concept and its context within the book.

Rules:

- Tags should represent reusable concepts rather than complete ideas or sentences.
- Prefer singular nouns or well-known technical terms.
- Use the most common industry or academic name for a concept.
- Expand acronyms when appropriate (for example, "Retrieval-Augmented Generation (RAG)").
- Include acronyms in the description when useful.
- Avoid generic words such as "system", "memory", "method", "process", "usage", "example", "introduction", "chapter", or "implementation".
- Avoid verbs unless they are part of an established term.
- Preserve semantic meaning in the description, not in the tag.
- Merge synonymous concepts into a single canonical tag.
- Tags may contain multiple words when that is the accepted name of the concept (for example "Transformer Architecture", "Mixture of Experts", "Model Context Protocol").
- Do not create duplicate or overlapping tags.

Good examples:

Tag: LoRA
Description: Low-Rank Adaptation, a parameter-efficient fine-tuning technique for large language models.

Tag: Retrieval-Augmented Generation
Description: Combining vector retrieval with language generation to produce grounded responses using external knowledge.

Tag: Transformer Architecture
Description: Neural network architecture based on self-attention that forms the foundation of modern language models.

Bad examples:

❌ "How to train an LLM from scratch"
❌ "Need for embeddings"
❌ "Generating better text"
❌ "LLM generation parameters and decoding strategies"

Instead use:

✅ Large Language Models
✅ Embeddings
✅ Text Generation
✅ Decoding Strategies

Return the results as a JSON array.

[
  {
    "tag": "...",
    "description": "..."
  }
]
"""

class TagSuggestion(BaseModel):
    tag: str
    description: str

def open_ai_suggest_tags(content: str) -> list[TagSuggestion]:
    model = 'openai-chat:gpt-5.4-nano'  # Best option as of today (June 2026)
    agent = Agent(
        model = model, # Best option as of today (June 2026)
        system_prompt = system_prompt,
        output_type = list[TagSuggestion]
    )

    result = agent.run_sync(content)
    return result.output




    # Old solution using langchain agent, but it is more expensive and slower than the pydantic_ai solution above
    # agent = create_agent(
    #     model = 'gpt-5.4-nano', # Best option as of today (June 2026)
    #     system_prompt = system_prompt,
    # )
    # result = agent.invoke({"messages": [{"role": "user", "content": content}]})
    # response = result['messages'][-1].content_blocks[0]["text"]
    # return [tag.strip() for tag in response.split(',')]
