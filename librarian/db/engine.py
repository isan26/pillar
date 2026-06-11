from sqlalchemy import create_engine

connection_string = "postgresql+psycopg://pillar:pillar@localhost:5434/librarian"
engine = create_engine(connection_string)
