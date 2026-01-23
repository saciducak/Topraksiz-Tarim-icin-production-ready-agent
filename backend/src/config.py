"""
Topraksız Tarım AI Agent - Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True
    
    # Ollama Settings
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_embed_model: str = "nomic-embed-text"
    
    # Qdrant Settings
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "agricultural_knowledge"
    
    # YOLO Settings
    yolo_model_path: str = "./models/yolov8_tomato.pt"
    yolo_confidence_threshold: float = 0.5
    
    # Upload Settings
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: list[str] = ["jpg", "jpeg", "png", "webp"]
    
    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore unknown env vars like NEXT_PUBLIC_API_URL


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
