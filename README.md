Final idea, build a configurable chat bot with RAG.

# First iteration.(Done)
- Build a simple Chatbot.

# Second iteration.
- Give memory, a DB should contain the conversation history.
- A conversation has messages.
- No need to store users, just an ID to load all the context.

# Put it behind a FastAPI and give it a UI too.
- The first iterations can happen on console.
- Serve the Agent with an API
- Build a SIMPLE UI
- Should use SSE.

# Add RAG
- It should be possible to process PDFs files.
- The files should be stored using pgvector.
- The agent should have access to the DB.

# Make it extensible.
- Building agents should be simple.
- Use a builder to inject the parts.
- Agent configuration could come from different sources (files, DBs, APIs and so on...)
- For RAG, the schema remains but the engine could vary, after pgsql, we can create other adapters.

# MCP
(PENDING, CANNOT THINK OF A USE CASE FOR MCP NOW)
- Consume a free API somewhere and parce the response.

# Configure multiple agents
- Re using what was built:
- Different agents (with different configs)could be created.

