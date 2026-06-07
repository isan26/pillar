Web tool to upload documents and do searches and resumes from those books with references included


To Run the library:
`uvicorn librarian.main:app` from the root folder, project will run on the default port 8000


We use alembic to handle migrations, read alembic/README to see how to create and execute the migrations

Next steps:
Backend API to store CRUD Documents, add metadata to the docs on the edit page.
Agent that will get prompts from the user, given agent should be able to answer questions based on the stored documents, look for techniques where we filter the dataset effectively reducing costs.
Agent should be able to generate PDF Files out of the research, to generate the pdfs for download, we can ask the agent to generate markdown and have tool create a pdf from it.
Build the integration using Python Protocols so we can implement other versions of the protocol to run the agent with S3 or similar tool from other providers.


check on the repo:
https://github.com/ed-donner/agents/tree/main/2_openai
https://www.gradio.app/


created basic Crud schema, 
Files, Books, Tags and Jobs.
Next step is to execute jobs and vectorize the whole thing.
From a vector data the user should be able to select pages so the LLM can suggest tags
Then a book will have content and tags associated
