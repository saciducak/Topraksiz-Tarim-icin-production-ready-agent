"""
Topraksız Tarım AI Agent - Main FastAPI Application
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from .config import get_settings
from .api.routes import router as api_router
from .api.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("🌾 Topraksız Tarım AI Agent starting...")
    logger.info(f"  Ollama: {settings.ollama_host}")
    logger.info(f"  Qdrant: {settings.qdrant_host}:{settings.qdrant_port}")
    logger.info(f"  YOLO Model: {settings.yolo_model_path}")
    
    yield
    
    # Shutdown
    logger.info("🌾 Topraksız Tarım AI Agent shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Topraksız Tarım AI Agent",
    description="Multi-agent tarımsal analiz sistemi - Bitki hastalık tespiti ve akıllı öneriler",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. Please check logs for more details."},
    )

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services={
            "api": "running",
            "ollama": "pending",  # Will be checked in actual implementation
            "qdrant": "pending",
            "yolo": "pending",
        }
    )


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Topraksız Tarım AI Agent",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
