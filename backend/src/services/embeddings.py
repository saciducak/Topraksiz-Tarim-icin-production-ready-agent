"""
Topraksız Tarım AI Agent - Embeddings Service
Ollama-based text embeddings for RAG.
"""
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Cache for embeddings client
_client: Optional[httpx.AsyncClient] = None


async def get_client() -> httpx.AsyncClient:
    """Get or create async HTTP client."""
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=60.0)
    return _client


async def get_embeddings(
    texts: list[str],
    settings = None
) -> list[list[float]]:
    """
    Generate embeddings using Ollama.
    
    Args:
        texts: List of texts to embed
        settings: Application settings
        
    Returns:
        List of embedding vectors
    """
    from ..config import get_settings
    
    if settings is None:
        settings = get_settings()
    
    client = await get_client()
    embeddings = []
    
    for text in texts:
        try:
            response = await client.post(
                f"{settings.ollama_host}/api/embeddings",
                json={
                    "model": settings.ollama_embed_model,
                    "prompt": text
                }
            )
            response.raise_for_status()
            data = response.json()
            embeddings.append(data.get("embedding", []))
            
        except Exception as e:
            logger.error(f"Embedding failed for text: {str(e)}")
            # Return zero vector on failure
            embeddings.append([0.0] * 768)  # Default dimension
    
    return embeddings


async def get_single_embedding(
    text: str,
    settings = None
) -> list[float]:
    """Get embedding for a single text."""
    embeddings = await get_embeddings([text], settings)
    return embeddings[0] if embeddings else []


async def check_ollama_connection(settings) -> dict:
    """Check if Ollama is accessible."""
    try:
        client = await get_client()
        response = await client.get(f"{settings.ollama_host}/api/tags")
        response.raise_for_status()
        
        data = response.json()
        models = [m.get("name", "") for m in data.get("models", [])]
        
        return {
            "status": "connected",
            "host": settings.ollama_host,
            "models": models,
            "llm_available": settings.ollama_model in str(models),
            "embed_available": settings.ollama_embed_model in str(models)
        }
    except Exception as e:
        return {
            "status": "error",
            "host": settings.ollama_host,
            "error": str(e)
        }
