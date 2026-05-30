To play with Rag:

1- Use docker-compose to start the server, this will nstall pgvector and leave the server running at port 5434.
2- Run the import_files.py so it imports both pdfs documents.
3- then you can run python rag_agent.py


Notice that there are more python files related to rag, these are to query the DB without an agent to see what comes out of it, as a way of just playing with vector dbs.

One of the files has 3 made up stories with fictional characters so there is no way the llm has knowledge about them, we cannot use commonly known characters like Harry Potter because the LLM already has context. Next there is a document called stories_questions.txt, these are questions related to the histories so we make sure the agent is indeed retrieving from pgvector. There are also logs that will show us that the tool is being called.

The agent retrieves the information from pgvector by using another tool called rag_search, the name of the tool could be better but for now it works. Sometimes we have to give it a little push to the agent and tell it to search it's own documents.

Remember to do pip install since there are new dependencies
