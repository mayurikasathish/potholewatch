"""
Database initialization script for Render deployment
Creates tables and ensures PostGIS extension is enabled
"""
import os
from sqlalchemy import create_engine, text
from main import Base

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

# Create engine
engine = create_engine(DATABASE_URL)

# Enable PostGIS extension
with engine.connect() as conn:
    try:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.commit()
        print("✅ PostGIS extension enabled")
    except Exception as e:
        print(f"⚠️  PostGIS extension setup: {e}")

# Create all tables
Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully")
