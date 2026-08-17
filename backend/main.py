"""
FastAPI application entry point.
Serves both the REST API and the static frontend files.
"""
import logging
import os
from pathlib import Path
import dotenv

dotenv.load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config import get_settings
from backend.database.database import create_tables
from backend.routes import quiz_routes, result_routes, auth_routes

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
settings = get_settings()

app = FastAPI(
    title="AI Quiz Generator",
    description="Transform study materials into interactive academic practice quizzes using Groq Cloud AI.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — configurable for production domain security
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Include routers
# ---------------------------------------------------------------------------
app.include_router(auth_routes.router)
app.include_router(quiz_routes.router)
app.include_router(result_routes.router)

# ---------------------------------------------------------------------------
# Static files — serve the React UI Single Page Application
# ---------------------------------------------------------------------------
REACT_DIST_DIR = Path(__file__).parent.parent / "react-ui" / "dist"

if REACT_DIST_DIR.exists():
    assets_dir = REACT_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/favicon.svg")
    def serve_favicon():
        fav = REACT_DIST_DIR / "favicon.svg"
        if fav.exists():
            return FileResponse(str(fav))
        return HTMLResponse(status_code=404, content="")

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    def serve_react_spa(full_path: str):
        target_file = REACT_DIST_DIR / full_path
        if full_path and target_file.is_file():
            return FileResponse(str(target_file))
        index_file = REACT_DIST_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return HTMLResponse(
            "<h2>React UI dist folder not found. Run 'npm run build' in react-ui/ directory.</h2>"
        )



# ---------------------------------------------------------------------------
# Startup event
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    # Ensure uploads directory exists
    uploads_dir = Path(settings.uploads_dir)
    uploads_dir.mkdir(exist_ok=True)

    # Create database tables
    create_tables()
    logger.info("✅ Database tables created / verified.")
    logger.info("🚀 AI Quiz Generator started — http://localhost:8000")

    if not settings.groq_api_key:
        logger.warning(
            "⚠️  GROQ_API_KEY is not set! "
            "Quiz generation will fail. Add it to your .env file."
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
