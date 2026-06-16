
from langchain.agents import create_agent
# Configure a cheap LLM to just suggest tags based on the content of a book

system_prompt = """
You are an AI assistant that suggests tags for books based on their content.
Given the content of a book, provide a list of relevant tags that accurately describe the book's themes, topics, and key elements.
Extract keywords as a comma separated string, the key words should be a single term when ever possible, 
for example "need for LLMs" becomes just LLM which is the key term. 
Avoid general use words like size, memory, need and so on, just terms that are rare and pack a lot of meaning.
The terms can contain spaces if they are composed by multiple words.
"""


def open_ai_suggest_tags(content: str) -> list[str]:
    agent = create_agent(
        model = 'gpt-5.4-nano', # Best option as of today (June 2026)
        system_prompt = system_prompt,
    )
    result = agent.invoke({"messages": [{"role": "user", "content": content}]})
    response = result['messages'][-1].content_blocks[0]["text"]
    return [tag.strip() for tag in response.split(',')]
