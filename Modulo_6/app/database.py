from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./modulo6.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
sesion_local = sessionmaker(bind=engine)
Base = declarative_base()


def get_db():
    db = sesion_local()
    try:
        yield db
    finally:
        db.close()