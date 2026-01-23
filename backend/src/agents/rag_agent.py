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
        
        # 1. Build Search Query (Short & Focused)
        search_query = query
        if detections:
            # Create a simple search query based on detections
            detected_classes = [d['class_name'] for d in detections]
            search_query = f"{', '.join(detected_classes)} treatment symptoms control"
            logger.info(f"Targeted search query: {search_query}")
        
        if not search_query:
            # Fallback for empty state
            search_query = "tomato plant diseases general care"

        # 2. Search Knowledge Base
        search_results = await search_knowledge_base(search_query)
        summary = f"Found {len(search_results)} sources for: {search_query}"
        logger.info(summary)
        
        # 3. Build Comprehensive Analysis Prompt (The "System" Logic)
        # We use strict formatting to ensure the UI renders it beautifully
        detected_str = ', '.join([d['class_name'] for d in detections]) if detections else "belirtilmeyen durum"
        
        # Prepare sensor context
        sensor_data = state.get("sensor_data")
        sensor_context = ""
        if sensor_data:
            sensor_context = "\n**🌡️ IoT Sensör Verileri:**\n"
            if sensor_data.get('ph'): 
                ph = float(sensor_data['ph'])
                note = "(Yüksek - Demir alımını engeller)" if ph > 7.5 else "(Düşük)" if ph < 5.5 else "(Normal)"
                sensor_context += f"- pH: {ph} {note}\n"
            
            if sensor_data.get('ec'):
                ec = float(sensor_data['ec'])
                note = "(Yüksek Tuzluluk - Yanıklara sebep olabilir)" if ec > 2.5 else "(Normal)"
                sensor_context += f"- EC: {ec} mS/cm {note}\n"
                
            if sensor_data.get('temperature'):
                t = float(sensor_data['temperature'])
                sensor_context += f"- Su Sıcaklığı: {t}°C\n"

        analysis_prompt = (
            f"Sen uzman bir Ziraat Mühendisisin. Analiz edilen bitkide şu durumlar tespit edildi: {detected_str}.\n"
            f"{sensor_context}\n"
            "Aşağıdaki **REFERANS BAĞLAM** bilgisini ve (varsa) SENSÖR verilerini kullanarak, bu durumla ilgili ÇOK KAPSAMLI, AKADEMİK ve PRATİK bir rapor hazırla.\n"
            "Örneğin: Eğer görselde 'Kloroz' (sararma) varsa VE pH yüksekse, teşhisi 'Yüksek pH kaynaklı Demir Eksikliği' olarak koy.\n"
            "Eğer spesifik bir hastalık yoksa, genel bitki sağlığı ve bakım önerileri ver.\n\n"
            "**KESİN FORMAT KURALLARI (Buna Uyulmalı):**\n"
            "1. Yanıtın SADECE Markdown formatında olacak.\n"
            "2. Asla JSON bloğu içine alma.\n"
            "3. Asla 'İşte raporunuz' gibi giriş cümleleri kurma. Direkt başlıkla başla.\n"
            "4. Şu başlıkları kullan:\n\n"
            "# 🩺 Hastalık/Durum Analizi\n"
            "[Durumun bilimsel ve pratik açıklaması]\n\n"
            "# 🧬 Biyolojik Nedenler\n"
            "[Hastalığı/Sorunu tetikleyen faktörler]\n\n"
            "# 💊 Tedavi Planı\n"
            "- **Kimyasal Mücadele:** [İlaç/Aktif madde önerileri]\n"
            "- **Organik Mücadele:** [Doğal yöntemler]\n"
            "- **Kültürel Önlemler:** [Bakım teknikleri]\n\n"
            "# 🛡️ Gelecek İçin Koruma\n"
            "[Stratejik önlemler]\n"
        )

        # 4. Generate Answer using LLM
        generated_answer = await generate_answer(
            query=search_query,
            context=search_results,
            settings=settings,
            custom_user_prompt=analysis_prompt
        )
        
        return {
            "rag_query": search_query,
            "rag_answer": generated_answer,  # Crucial: This maps to state['rag_answer']
            "rag_results": search_results,
            "error": None
        }

    except Exception as e:
        logger.error(f"RAG agent failed: {e}", exc_info=True)
        return {
            "rag_answer": "Analiz raporu oluşturulurken bir hata meydana geldi.",
            "rag_results": [],
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
