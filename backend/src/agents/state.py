"""
Topraksız Tarım AI Agent - Agent State Definition
"""
from typing import TypedDict, Optional, Any
from dataclasses import dataclass, field


class AgentState(TypedDict):
    """
    State shared between all agents in the LangGraph workflow.
    
    This state flows through:
    1. Input Processing → 
    2. Vision Agent → 
    3. RAG Agent → 
    4. Decision Agent → 
    5. Response Generation
    """
    # Input
    image_bytes: Optional[bytes]
    query: Optional[str]
    sensor_data: Optional[dict]  # New: IoT Sensor Data
    
    # Vision Agent Output
    detections: list[dict]
    vision_summary: str
    has_disease: bool
    
    # RAG Agent Output
    rag_query: str
    rag_results: list[dict]
    rag_answer: str
    
    # Decision Agent Output
    recommendations: list[dict]
    
    # Final Output
    final_summary: str
    
    # Metadata
    error: Optional[str]
    processing_time: float


def create_initial_state(
    image_bytes: Optional[bytes] = None,
    query: Optional[str] = None,
    sensor_data: Optional[dict] = None
) -> AgentState:
    """Create initial state for the agent workflow."""
    return AgentState(
        # Input
        image_bytes=image_bytes,
        query=query,
        sensor_data=sensor_data,
        
        # Vision Agent Output
        detections=[],
        vision_summary="",
        has_disease=False,
        
        # RAG Agent Output
        rag_query="",
        rag_results=[],
        rag_answer="",
        
        # Decision Agent Output
        recommendations=[],
        
        # Final Output
        final_summary="",
        
        # Metadata
        error=None,
        processing_time=0.0
    )
