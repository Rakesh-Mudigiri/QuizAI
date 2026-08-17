"""
SQLAlchemy database engine and session management.
Supports both SQLite (local development) and MySQL / TiDB Cloud / PostgreSQL (cloud production).
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Ensure environment variables are loaded
load_dotenv()

# Read from environment or fallback to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./quiz_generator.db")

def _get_engine(url: str):
    connect_args = {}
    engine_kwargs = {"echo": False}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    else:
        # Production Cloud DB (TiDB Cloud / MySQL / PostgreSQL)
        engine_kwargs["pool_pre_ping"] = True
        engine_kwargs["pool_recycle"] = 300
        engine_kwargs["pool_size"] = 10
        engine_kwargs["max_overflow"] = 20
        engine_kwargs["pool_timeout"] = 10
        if "tidbcloud.com" in url.lower() and "ssl" not in url.lower():
            connect_args["ssl"] = {"ssl_mode": "VERIFY_IDENTITY"}
    return create_engine(url, connect_args=connect_args, **engine_kwargs)

try:
    engine = _get_engine(DATABASE_URL)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception:
    # Fallback to local SQLite if cloud DB is unreachable
    DATABASE_URL = "sqlite:///./quiz_generator.db"
    engine = _get_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()



def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables defined in models and ensure migrations."""
    from backend.database import models  # noqa: F401 — import to register models
    from sqlalchemy import inspect, text
    Base.metadata.create_all(bind=engine)

    # Migrations helper: add user_id & answers_json to results table if missing
    try:
        inspector = inspect(engine)
        if "results" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("results")]
            with engine.connect() as conn:
                if "user_id" not in columns:
                    conn.execute(text("ALTER TABLE results ADD COLUMN user_id INTEGER"))
                if "answers_json" not in columns:
                    conn.execute(text("ALTER TABLE results ADD COLUMN answers_json TEXT"))
                conn.commit()
    except Exception:
        pass

    # Ensure initial database seed for student accounts
    try:
        from backend.database.models import User
        from backend.routes.auth_routes import hash_password
        
        db = SessionLocal()
        users_seed = [
            ("Aasrita Sangani", "aasrita@gmail.com", "aasrita123", "Computer Science & Engineering Student", "Institute of Technology", "https://api.dicebear.com/7.x/lorelei/svg?seed=Aasrita"),
            ("Aasrita", "aasrita@university.edu", "aasrita123", "Computer Science Student", "Institute of Engineering", "https://api.dicebear.com/7.x/lorelei/svg?seed=Aasrita"),
            ("Rakesh1", "rakeshmail@gmail.com", "password123", "Software Engineering Student", "College of Computing", "https://api.dicebear.com/7.x/bottts/svg?seed=Rakesh1"),
            ("Alex Johnson", "alex.johnson@university.edu", "password123", "Data Structures Student", "Institute of Technology", "https://api.dicebear.com/7.x/bottts/svg?seed=Alex_Johnson"),
            ("Sarah Miller", "sarah.miller@university.edu", "password123", "Software Engineering Major", "Faculty of Engineering", "https://api.dicebear.com/7.x/bottts/svg?seed=Sarah_Miller"),
            ("David Chen", "david.chen@university.edu", "password123", "AI & Data Science Student", "School of Computing", "https://api.dicebear.com/7.x/bottts/svg?seed=David_Chen"),
            ("Priya Sharma", "priya.sharma@university.edu", "password123", "Algorithms Major", "Department of Engineering", "https://api.dicebear.com/7.x/bottts/svg?seed=Priya_Sharma"),
        ]

        for p_name, p_email, p_pwd, p_role, p_college, p_avatar in users_seed:
            if db.query(User).filter(User.email == p_email).first() is None:
                u = User(
                    name=p_name,
                    email=p_email,
                    password_hash=hash_password(p_pwd),
                    role=p_role,
                    field="Computer Science",
                    college=p_college,
                    avatar=p_avatar,
                    is_verified=1
                )
                db.add(u)
        db.commit()
        db.close()
    except Exception:
        pass


