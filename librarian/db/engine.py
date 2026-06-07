from sqlalchemy import create_engine

engine = create_engine("postgresql+psycopg://pillar:pillar@localhost:5434/pillar")
