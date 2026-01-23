"""
Topraksız Tarım AI Agent - LangGraph Workflow Definition
"""
from langgraph.graph import StateGraph, END
from typing import Literal
import logging
import time

from .state import AgentState, create_initial_state
from .vision_agent import vision_node
from .rag_agent import rag_node
from .decision_agent import decision_node
from ..config import Settings, get_settings

logger = logging.getLogger(__name__)


def should_use_rag(state: AgentState) -> Literal["rag", "decision"]:
    """
    Determine if RAG should be invoked based on vision results.
    
    Rules:
    - If disease detected → Use RAG to get treatment info
    - If user provided query → Use RAG
    - Otherwise → Skip to decision
    """
    if state.get("has_disease"):
        logger.info("Disease detected, routing to RAG agent")
        return "rag"
    
    if state.get("query"):
        logger.info("User query provided, routing to RAG agent")
        return "rag"
    
    # NEW: Always use RAG to provide comprehensive care guide even for healthy plants
    logger.info("No disease detected, but routing to RAG for general care guide")
    return "rag"


def response_node(state: AgentState) -> AgentState:
    """
    Generate final response combining all agent outputs.
    """
    # Build summary based on available information
    parts = []
    
    # Vision summary
    if state.get("vision_summary"):
        parts.append(f"📷 **Görsel Analiz:**\n{state['vision_summary']}")
    
    # RAG answer
    if state.get("rag_answer"):
        parts.append(f"📚 **Bilgi Tabanı:**\n{state['rag_answer']}")
    
    # Recommendations
    if state.get("recommendations"):
        rec_text = "\n".join([
            f"• **{r.get('action', 'Öneri')}** ({r.get('priority', 'normal')}): {r.get('details', '')}"
            for r in state["recommendations"]
        ])
        parts.append(f"✅ **Öneriler:**\n{rec_text}")
    
    final_summary = "\n\n".join(parts) if parts else "Analiz tamamlandı, herhangi bir sorun tespit edilmedi."
    
    state["final_summary"] = final_summary
    return state


def create_analysis_graph() -> StateGraph:
    """
    Create the LangGraph workflow for agricultural analysis.
    
    Workflow:
    1. Vision Agent → Analyze image with YOLO
    2. (Conditional) RAG Agent → Search knowledge base
    3. Decision Agent → Generate recommendations
    4. Response → Compile final response
    """
    # Create graph
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("vision", vision_node)
    graph.add_node("rag", rag_node)
    graph.add_node("decision", decision_node)
    graph.add_node("response", response_node)
    
    # Define edges
    graph.set_entry_point("vision")
    
    # Conditional routing after vision
    graph.add_conditional_edges(
        "vision",
        should_use_rag,
        {
            "rag": "rag",
            "decision": "decision"
        }
    )
    
    # RAG → Decision
    graph.add_edge("rag", "decision")
    
    # Decision → Response
    graph.add_edge("decision", "response")
    
    # Response → END
    graph.add_edge("response", END)
    
    return graph.compile()


# Compile the graph once
analysis_graph = create_analysis_graph()


async def run_analysis_pipeline(
    image_bytes: bytes,
    query: str = None,
    sensor_data: dict = None,
    settings: Settings = None
) -> dict:
    """
    Run the full analysis pipeline.
    
    Args:
        image_bytes: Raw image bytes
        query: Optional user query
        sensor_data: Optional IoT sensor readings
        settings: Application settings
        
    Returns:
        dict with vision, rag, recommendations, and summary
    """
    if settings is None:
        settings = get_settings()
    
    start_time = time.time()
    
    # Create initial state
    initial_state = create_initial_state(
        image_bytes=image_bytes,
        query=query,
        sensor_data=sensor_data
    )
    
    # Add settings to state for agents to use
    initial_state["_settings"] = settings
    
    try:
        # Run the graph
        final_state = await analysis_graph.ainvoke(initial_state)
        
        processing_time = time.time() - start_time
        logger.info(f"Analysis completed in {processing_time:.2f}s")
        
        # Format output
        return {
            "vision": {
                "detections": final_state.get("detections", []),
                "summary": final_state.get("vision_summary", ""),
                "has_disease": final_state.get("has_disease", False)
            } if final_state.get("detections") else None,
            "rag": {
                "query": final_state.get("rag_query", ""),
                "answer": final_state.get("rag_answer", ""),
                "sources": final_state.get("rag_results", []),
                "confidence": 0.85  # Placeholder
            } if final_state.get("rag_answer") else None,
            "recommendations": final_state.get("recommendations", []),
            "summary": final_state.get("final_summary", "Analiz tamamlandı.")
        }
        
    except Exception as e:
        logger.error(f"Pipeline error: {str(e)}")
        raise
