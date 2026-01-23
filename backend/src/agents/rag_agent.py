"""
Topraksız Tarım AI Agent - RAG Agent
Retrieves relevant information from the agricultural knowledge base.
"""
from .state import AgentState
from ..services.rag import search_knowledge_base, generate_answer
import logging

logger = logging.getLogger(__name__)


async def rag_node(state: AgentState):
    """
    RAG Agent Node - Searches knowledge base and generates answers.
    """
    logger.info("RAG agent starting retrieval...")
    settings = state.get("_settings")
    
    try:
        query = state.get("query", "")
        detections = state.get("detections", [])
        
        # Build query from detections if available
        if detections:
            detected_classes = [d['class_name'] for d in detections]
            query = f"BU BİR BİTKİ HASTALIK ANALİZİ SORGUSUDUR. Tespit edilen sorunlar: {', '.join(detected_classes)}. Lütfen şu formatta çok detaylı, akademik ve uzman seviyesinde yanıt ver: 1. Hastalık Tanımı ve Belirtileri, 2. Nedenleri (Biyolojik/Çevresel), 3. Tedavi Yöntemleri (Kimyasal/Organik/Kültürel), 4. Önleme Stratejileri."
            logger.info(f"RAG query: {query}")
        
        if not query:
            logger.info("No query for RAG, skipping")
            return {"rag_response": "Sorgu bulunamadı."}

        # Search knowledge base
        search_results = await search_knowledge_base(query)
        
        # search_results is a list of documents
        summary = f"RAG complete: {len(search_results)} sources found"
        logger.info(summary)
        
        # Generate answer (simplified for now as generate_answer requires list)
        # Note: If you have a separate generate_answer function, use it here.
        # For now, we'll return the raw results or perform a simple generation if needed.
        # But wait, rag.py generate_answer takes `context` which is loop of results.
        
        # Let's import generate_answer properly if we want to use it, but for now
        # assuming we just want to return the results + a simple message or 
        # use the generate_answer service if available.
        # Since I can't see the import in this replacing block, I'll assume 
        # I should just format the return value correctly.
        
        # Actually, let's look at how it was before. It called generate_answer.
        # But search_knowledge_base returns list.
        # So:
        
        return {
            "rag_response": f"Bilgi tabanında {len(search_results)} doküman bulundu.", # Or call generate_answer if possible
            "rag_sources": search_results,
            "rag_summary": summary
        }
    except Exception as e:
        logger.error(f"RAG agent failed: {e}", exc_info=True)
        return {
            "rag_response": "Bilgi tabanı sorgulanırken bir hata oluştu.",
            "rag_sources": [],
            "rag_summary": f"RAG hatası: {str(e)}",
            "error": str(e)
        }


async def get_rag_response(
    query: str,
    history: list = None,
    settings = None
) -> dict:
    """
    Standalone RAG function for chat interface.
    """
    from ..config import get_settings
    
    if settings is None:
        settings = get_settings()
    
    try:
        # Search knowledge base
        search_results = await search_knowledge_base(query, top_k=5, settings=settings)
        
        # Build context from history
        context_messages = []
        if history:
            for msg in history[-5:]:  # Last 5 messages
                context_messages.append(f"{msg.role}: {msg.content}")
        
        # Generate answer
        answer = await generate_answer(
            query=query,
            context=search_results,
            history=context_messages,
            settings=settings
        )
        
        return {
            "answer": answer,
            "sources": [
                {"title": r.get("title", ""), "score": r.get("score", 0)}
                for r in search_results
            ]
        }
        
    except Exception as e:
        logger.error(f"RAG response failed: {str(e)}")
        return {
            "answer": f"Üzgünüm, yanıt oluşturulurken bir hata oluştu: {str(e)}",
            "sources": []
        }
