#!/usr/bin/env python3
"""
Test the agent workflow - standalone test without Qdrant.
Tests the LangGraph agent pipeline with mock data.
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from PIL import Image
import io
import httpx


async def test_ollama_connection():
    """Test Ollama connection."""
    print("\n🔍 Ollama Bağlantı Testi")
    print("-" * 40)
    
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{ollama_host}/api/tags", timeout=10.0)
            resp.raise_for_status()
            models = resp.json().get("models", [])
            print(f"✅ Ollama bağlantısı başarılı: {ollama_host}")
            print(f"📦 Yüklü modeller:")
            for m in models:
                print(f"   - {m['name']}")
            return True
        except Exception as e:
            print(f"❌ Ollama bağlantı hatası: {e}")
            print(f"💡 Çözüm: Terminal'de 'ollama serve' komutunu çalıştırın")
            return False


async def test_llm_response():
    """Test LLM response."""
    print("\n🧠 LLM Yanıt Testi")
    print("-" * 40)
    
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    model = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    prompt = """Sen bir tarım uzmanısın. Domates bitkisinde erken yanıklık hastalığı tespit edildi.
    Kısa ve öz olarak (3 cümle) ne yapılması gerektiğini açıkla."""
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"📤 Model: {model}")
            print(f"📤 Prompt gönderiliyor...")
            
            resp = await client.post(
                f"{ollama_host}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60.0
            )
            resp.raise_for_status()
            
            answer = resp.json().get("response", "")
            print(f"✅ LLM yanıtı alındı:")
            print(f"   {answer[:300]}...")
            return True
        except Exception as e:
            print(f"❌ LLM hatası: {e}")
            print(f"💡 Çözüm: 'ollama pull {model}' komutunu çalıştırın")
            return False


async def test_embedding():
    """Test embedding generation."""
    print("\n🔢 Embedding Testi")
    print("-" * 40)
    
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    model = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
    
    text = "Domates bitkisinde yaprak hastalığı tedavisi nasıl yapılır?"
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"📤 Model: {model}")
            print(f"📤 Metin: {text[:50]}...")
            
            resp = await client.post(
                f"{ollama_host}/api/embeddings",
                json={
                    "model": model,
                    "prompt": text
                },
                timeout=30.0
            )
            resp.raise_for_status()
            
            embedding = resp.json().get("embedding", [])
            print(f"✅ Embedding alındı:")
            print(f"   Boyut: {len(embedding)}")
            print(f"   İlk 5 değer: {embedding[:5]}")
            return True
        except Exception as e:
            print(f"❌ Embedding hatası: {e}")
            print(f"💡 Çözüm: 'ollama pull {model}' komutunu çalıştırın")
            return False


async def test_yolo_import():
    """Test YOLO import."""
    print("\n🎯 YOLO Import Testi")
    print("-" * 40)
    
    try:
        from ultralytics import YOLO
        print("✅ Ultralytics import başarılı")
        
        # Test with default model
        print("📦 Varsayılan YOLOv8n modeli yükleniyor...")
        model = YOLO("yolov8n.pt")
        print(f"✅ YOLO modeli yüklendi: {model.task}")
        return True
    except Exception as e:
        print(f"❌ YOLO hatası: {e}")
        return False


async def test_agent_state():
    """Test agent state creation."""
    print("\n📊 Agent State Testi")
    print("-" * 40)
    
    try:
        from src.agents.state import AgentState, create_initial_state
        
        state = create_initial_state(
            image_bytes=b"test_image_bytes",
            query="Domates bitkimde lekeler var"
        )
        
        print("✅ AgentState oluşturuldu:")
        print(f"   - image_bytes: {len(state['image_bytes'])} bytes")
        print(f"   - query: {state['query']}")
        print(f"   - has_disease: {state['has_disease']}")
        return True
    except Exception as e:
        print(f"❌ State hatası: {e}")
        return False


async def test_decision_agent():
    """Test decision agent logic."""
    print("\n🎯 Decision Agent Testi")
    print("-" * 40)
    
    try:
        from src.agents.decision_agent import decision_node
        from src.agents.state import create_initial_state
        
        # Create state with mock detections
        state = create_initial_state()
        state["detections"] = [
            {"class_name": "early_blight", "confidence": 0.85, "bbox": [100, 100, 200, 200]},
            {"class_name": "leaf_spot", "confidence": 0.72, "bbox": [150, 150, 250, 250]},
        ]
        state["has_disease"] = True
        state["rag_answer"] = "Erken yanıklık için bakır bazlı fungisit önerilir."
        
        # Run decision agent
        result = await decision_node(state)
        
        print("✅ Decision Agent çalıştı:")
        print(f"   Öneriler: {len(result.get('recommendations', []))} adet")
        for rec in result.get("recommendations", [])[:3]:
            print(f"   - [{rec['priority']}] {rec['action']}")
        return True
    except Exception as e:
        print(f"❌ Decision Agent hatası: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_full_workflow():
    """Test full agent workflow with mock data."""
    print("\n🔄 TAM WORKFLOW TESTİ")
    print("=" * 50)
    
    try:
        from src.agents.graph import create_analysis_graph
        from src.agents.state import create_initial_state
        
        print("📦 LangGraph workflow oluşturuluyor...")
        graph = create_analysis_graph()
        print("✅ Graph derlendi")
        
        # Create test image (1x1 red pixel)
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        
        # Create initial state
        state = create_initial_state(
            image_bytes=img_bytes.getvalue(),
            query="Bu bitkide hastalık var mı?"
        )
        
        print("🚀 Workflow başlatılıyor...")
        print("   [Vision Agent] -> [RAG Agent] -> [Decision Agent] -> [Response]")
        
        # Note: This might fail without actual YOLO model and Qdrant
        # But it will test the graph structure
        try:
            final_state = await graph.ainvoke(state)
            print("✅ Workflow tamamlandı!")
            print(f"   final_summary: {final_state.get('final_summary', 'N/A')[:100]}...")
            return True
        except Exception as e:
            print(f"⚠️ Workflow hata verdi (beklenen olabilir): {e}")
            print("   YOLO modeli veya Qdrant olmadan tam çalışmaz.")
            return False
            
    except Exception as e:
        print(f"❌ Workflow oluşturma hatası: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("=" * 50)
    print("🌾 TOPRAKSIZ TARIM AI - AGENT WORKFLOW TESTİ")
    print("=" * 50)
    
    results = {}
    
    # Core tests
    results["ollama"] = await test_ollama_connection()
    if results["ollama"]:
        results["llm"] = await test_llm_response()
        results["embedding"] = await test_embedding()
    
    results["yolo"] = await test_yolo_import()
    results["state"] = await test_agent_state()
    results["decision"] = await test_decision_agent()
    
    # Full workflow (may fail without all dependencies)
    if all([results.get("state"), results.get("decision")]):
        results["workflow"] = await test_full_workflow()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST ÖZETİ")
    print("=" * 50)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test, result in results.items():
        status = "✅" if result else "❌"
        print(f"  {status} {test}")
    
    print(f"\n  Sonuç: {passed}/{total} test başarılı")
    
    if passed == total:
        print("\n🎉 Tüm testler geçti! Sistem çalışmaya hazır.")
    else:
        print("\n⚠️ Bazı testler başarısız. Yukarıdaki önerileri uygulayın.")


if __name__ == "__main__":
    asyncio.run(main())
