"""
Topraksız Tarım AI Agent - Decision Agent
Generates actionable recommendations based on analysis.
"""
from .state import AgentState
import logging

logger = logging.getLogger(__name__)

# Template recommendations for common issues
RECOMMENDATION_TEMPLATES = {
    "early_blight": {
        "action": "Erken Yanıklık Tedavisi",
        "priority": "high",
        "details": "Enfekte yaprakları hemen uzaklaştırın. Bakır bazlı fungisit uygulayın. Sulama sırasında yaprakların ıslanmasından kaçının.",
        "timeframe": "Hemen başlayın, 7-10 gün boyunca tekrarlayın"
    },
    "late_blight": {
        "action": "Geç Yanıklık Acil Müdahale",
        "priority": "high",
        "details": "Tüm enfekte bitki parçalarını toplayın ve imha edin. Sistemik fungisit uygulayın. Diğer bitkilere yayılmayı önlemek için karantina uygulayın.",
        "timeframe": "Acil - 24 saat içinde"
    },
    "leaf_spot": {
        "action": "Yaprak Lekesi Tedavisi",
        "priority": "medium",
        "details": "Hava sirkülasyonunu artırın. Fungisit püskürtün. Yaprakları kuru tutun.",
        "timeframe": "2-3 gün içinde başlayın"
    },
    "healthy": {
        "action": "Koruyucu Önlemler",
        "priority": "low",
        "details": "Bitkiniz sağlıklı görünüyor. Düzenli sulama ve gübrelemeye devam edin. Hastalık belirtileri için haftalık kontrol yapın.",
        "timeframe": "Rutin bakım"
    },
    "nutrient_deficiency": {
        "action": "Besin Takviyesi",
        "priority": "medium",
        "details": "Yaprak analizi yaptırın. Eksik besine göre uygun gübre uygulayın. Toprak pH'ını kontrol edin.",
        "timeframe": "1 hafta içinde"
    }
}


async def decision_node(state: AgentState):
    """
    Decision Agent Node - Generates actionable recommendations.
    
    Input: detections, vision_summary, rag_answer, has_disease
    Output: recommendations
    """
    logger.info("Decision agent generating recommendations...")
    
    try:
        detections = state.get("detections", [])
        rag_response = state.get("rag_response", "")
        has_disease = state.get("has_disease", False)
        
        recommendations = []
        
        if detections:
            for det in detections:
                cls = det.get('class_name', 'Unknown')
                confidence = det.get('confidence', 0)
                # Clean string cleaning to avoid "jkh" or quotes
                display_name = cls.replace('_', ' ').title().strip()
                confidence_pct = int(confidence * 100)
                
                rec = {
                    "action": f"{display_name} Müdahalesi",
                    "priority": "high" if confidence > 0.5 else "medium",
                    "details": (
                        f"**Teşhis:** {display_name} (Güven: %{confidence_pct})\n\n"
                        "Bu hastalık bitki sağlığını ciddi şekilde tehdit etmektedir. "
                        "Aşağıdaki detaylı analiz raporundaki adımları dikkatle uygulayınız. "
                        "Özellikle etkilenen yaprakların uzaklaştırılması ve uygun tedavi (kimyasal/organik) uygulanması önerilir."
                    ),
                    "timeframe": "Acil (24-48 Saat)"
                }
                recommendations.append(rec)
        elif "sağlıklı" in rag_response.lower() or not has_disease:
             recommendations.append({
                "action": "Düzenli Kontrol",
                "priority": "low",
                "details": "Bitkiniz sağlıklı görünüyor. Düzenli sulama ve gübrelemeye devam edin.",
                "timeframe": "Haftalık"
            })
        else:
             recommendations.append({
                "action": "Detaylı İnceleme",
                "priority": "medium",
                "details": "Hastalık tam teşhis edilemedi, ancak belirtiler var. Ziraat mühendisine danışın.",
                "timeframe": "24 Saat"
            })

        logger.info(f"Generated {len(recommendations)} recommendations")
        
        return {
            "recommendations": recommendations,
            "final_report": "Analiz tamamlandı."
        }
    except Exception as e:
        logger.error(f"Decision agent failed: {e}", exc_info=True)
        return {
            "recommendations": [{
                "action": "Sistem Hatası",
                "priority": "high",
                "details": "Karar mekanizması çalışırken bir hata oluştu.",
                "timeframe": "Hemen"
            }],
            "final_report": f"Analiz hatası: {str(e)}",
            "error": str(e)
        }
