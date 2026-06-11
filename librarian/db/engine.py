from sqlalchemy import create_engine

connection_string = "postgresql+psycopg://pillar:pillar@localhost:5434/pillar"
engine = create_engine(connection_string)
