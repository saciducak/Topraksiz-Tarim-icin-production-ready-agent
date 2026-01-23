"""
Topraksız Tarım AI Agent - RAG Service
Vector search and answer generation with fallback knowledge.
"""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import httpx
import logging
from typing import Optional
import uuid

from .embeddings import get_single_embedding

logger = logging.getLogger(__name__)

# Global Qdrant client
_qdrant_client: Optional[QdrantClient] = None
_qdrant_available: bool = False

# Fallback knowledge when Qdrant is not available
FALLBACK_KNOWLEDGE = {
    "early_blight": {
        "title": "Erken Yanıklık (Alternaria solani)",
        "content": """Erken yanıklık domates bitkilerinde yaygın bir fungal hastalıktır.
        
Belirtiler: Alt yapraklarda halka şeklinde kahverengi lekeler.

Tedavi:
1. Enfekte yaprakları hemen temizleyin
2. Bakır bazlı fungisit (Bordö bulamacı %1) uygulayın
3. Mancozeb içeren fungisitler kullanın
4. 7-10 gün arayla tekrarlayın

Önleme: Damla sulama, bitki aralığı, münavebe."""
    },
    "chlorosis": {
        "title": "Kloroz / Sararma",
        "content": """Yapraklarda sararma genellikle beslenme eksikliğini gösterir.

Olası Nedenler:
- Azot eksikliği: Genel sararma, alt yapraklardan başlar
- Demir eksikliği: Genç yapraklarda damarlar arası sararma
- Magnezyum eksikliği: Yaşlı yapraklarda damarlar arası sararma

Tedavi:
- Yaprak analizi yaptırın
- Eksik besin elementini uygulayın
- pH kontrolü yapın (ideal: 6.0-6.8)"""
    },
    "necrosis": {
        "title": "Nekroz / Kahverengileşme",
        "content": """Doku ölümü (nekroz) çeşitli hastalıkların belirtisi olabilir.

Olası Nedenler:
- Geç yanıklık (Phytophthora)
- Bakteriyel leke
- Güneş yanığı
- Tuz stresi

Acil Önlemler:
1. Enfekte kısımları uzaklaştırın
2. Havalandırmayı artırın
3. Uzman görüşü alın"""
    },
    "healthy": {
        "title": "Sağlıklı Bitki Bakımı",
        "content": """Bitkilerinizi sağlıklı tutmak için:

Düzenli Bakım:
- Günde 2-4 litre su (mevsime göre)
- Haftada bir yaprak kontrolü
- Ayda bir gübreleme

Koruyucu Önlemler:
- İyi havalandırma sağlayın
- Yaprakları kuru tutun
- Temiz bahçe aletleri kullanın"""
    }
}


def get_qdrant_client(settings) -> Optional[QdrantClient]:
    """Get or create Qdrant client with connection check."""
    global _qdrant_client, _qdrant_available
    
    if _qdrant_client is None:
        try:
            _qdrant_client = QdrantClient(
                host=settings.qdrant_host,
                port=settings.qdrant_port,
                timeout=5.0
            )
            # Test connection
            _qdrant_client.get_collections()
            _qdrant_available = True
            logger.info("Qdrant connection established")
            
            # Ensure collection exists
            try:
                _qdrant_client.get_collection(settings.qdrant_collection)
            except Exception:
                logger.info(f"Creating collection: {settings.qdrant_collection}")
                _qdrant_client.create_collection(
                    collection_name=settings.qdrant_collection,
                    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
                )
        except Exception as e:
            logger.warning(f"Qdrant not available: {e}. Using fallback knowledge.")
            _qdrant_available = False
    
    return _qdrant_client if _qdrant_available else None


def get_fallback_knowledge(query: str, detections: list = None) -> list[dict]:
    """Get relevant knowledge from fallback database."""
    results = []
    query_lower = query.lower()
    
    # Match based on query keywords and detections
    keywords_to_topics = {
        ("blight", "yanık", "early"): "early_blight",
        ("yellow", "sarı", "chlor", "kloroz"): "chlorosis",
        ("brown", "kahve", "nekroz", "necrosis", "dark"): "necrosis",
        ("healthy", "sağlık", "bakım", "care"): "healthy",
    }
    
    matched_topics = set()
    
    # Check detection class names
    if detections:
        for det in detections:
            class_name = det.get("class_name", "").lower()
            if "blight" in class_name or "early" in class_name:
                matched_topics.add("early_blight")
            elif "chlor" in class_name or "yellow" in class_name:
                matched_topics.add("chlorosis")
            elif "necro" in class_name or "dark" in class_name:
                matched_topics.add("necrosis")
    
    # Check query keywords
    for keywords, topic in keywords_to_topics.items():
        if any(kw in query_lower for kw in keywords):
            matched_topics.add(topic)
    
    # If no matches, return healthy tips
    if not matched_topics:
        matched_topics.add("healthy")
    
    # Build results
    for topic in matched_topics:
        if topic in FALLBACK_KNOWLEDGE:
            info = FALLBACK_KNOWLEDGE[topic]
            results.append({
                "id": topic,
                "score": 0.85,
                "title": info["title"],
                "content": info["content"],
                "source": "fallback_knowledge",
            })
    
    return results


async def search_knowledge_base(
    query: str,
    top_k: int = 5,
    settings = None,
    detections: list = None
) -> list[dict]:
    """
    Search the agricultural knowledge base with Qdrant fallback.
    
    Args:
        query: Search query
        top_k: Number of results
        settings: Application settings
        detections: Vision detections for context
        
    Returns:
        List of relevant documents
    """
    from ..config import get_settings
    
    if settings is None:
        settings = get_settings()
    
    # Try Qdrant first
    client = get_qdrant_client(settings)
    
    if client and _qdrant_available:
        try:
            # Get query embedding
            query_embedding = await get_single_embedding(query, settings)
            
            if query_embedding and not all(v == 0 for v in query_embedding):
                try:
                    results = client.query_points(
                        collection_name=settings.qdrant_collection,
                        query=query_embedding,
                        limit=top_k
                    )
                    
                    if results.points:
                        documents = []
                        for result in results.points:
                            payload = result.payload or {}
                            documents.append({
                                "id": str(result.id),
                                "score": result.score,
                                "title": payload.get("title", ""),
                                "content": payload.get("content", ""),
                                "source": "qdrant"
                            })
                        return documents
                except Exception as e:
                    logger.error(f"Error querying Qdrant: {e}")
                    # Continue to fallback
        except Exception as e:
            logger.warning(f"Qdrant search failed: {e}")
    
    # Fallback to local knowledge
    logger.info("Using fallback knowledge base")
    return get_fallback_knowledge(query, detections)


async def generate_answer(
    query: str,
    context: list[dict],
    history: list[str] = None,
    settings = None,
    custom_user_prompt: str = None,
    custom_system_prompt: str = None
) -> str:
    """
    Generate an answer using Ollama LLM.
    """
    from ..config import get_settings
    
    if settings is None:
        settings = get_settings()
    
    # Build context string
    context_parts = []
    for i, doc in enumerate(context[:5], 1):
        content = doc.get("content", "")[:800]
        title = doc.get("title", f"Kaynak {i}")
        context_parts.append(f"[{title}]:\n{content}")
    
    context_str = "\n\n".join(context_parts) if context_parts else "Bilgi tabanında özel bir kaynak bulunamadı, genel bilgi kullanılıyor."
    
    # Use custom system prompt if provided
    system_prompt = custom_system_prompt or """Sen tarım alanında uzman bir yapay zeka asistanısın. 
Çiftçilere bitki hastalıkları, zararlılar, gübreleme ve tarım uygulamaları konusunda yardımcı oluyorsun.
Verilen bağlam bilgilerini kullanarak doğru ve pratik öneriler sun.
Yanıtlarını Türkçe ver ve öz tut.
Emin olmadığın konularda bir uzmana danışmayı öner."""

    # Use custom user prompt if provided, otherwise default format
    if custom_user_prompt:
        user_prompt = f"{custom_user_prompt}\n\nREFERANS BAĞLAM:\n{context_str}"
    else:
        user_prompt = f"""Bağlam:
{context_str}

Soru: {query}

Lütfen yukarıdaki bağlamı kullanarak kısa ve pratik bir yanıt ver."""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.ollama_host}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": user_prompt,
                    "system": system_prompt,
                    "stream": False
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "Yanıt oluşturulamadı.")
            
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        # Return context directly as fallback
        if context:
            return context[0].get("content", "Yanıt oluşturulamadı.")
        return "Yanıt oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin."


async def add_document(
    content: str,
    title: str = None,
    source: str = None,
    metadata: dict = None,
    settings = None
) -> str:
    """Add a document to the knowledge base."""
    from ..config import get_settings
    
    if settings is None:
        settings = get_settings()
    
    client = get_qdrant_client(settings)
    if not client:
        raise Exception("Qdrant is not available")
    
    try:
        embedding = await get_single_embedding(content, settings)
        doc_id = str(uuid.uuid4())
        
        client.upsert(
            collection_name=settings.qdrant_collection,
            points=[
                PointStruct(
                    id=doc_id,
                    vector=embedding,
                    payload={
                        "title": title or "Adsız Belge",
                        "content": content,
                        "source": source or "",
                        "metadata": metadata or {}
                    }
                )
            ]
        )
        
        logger.info(f"Added document: {doc_id}")
        return doc_id
        
    except Exception as e:
        logger.error(f"Failed to add document: {e}")
        raise
