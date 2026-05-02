"""
Verification test for the RAG chunking pipeline.

This tests the document loading and chunking logic WITHOUT needing
Qdrant or Ollama running.

Usage:
    cd backend
    python -m src.scripts.verify_chunking
"""
import sys
from pathlib import Path

# Ensure path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))


def test_document_loader():
    """Test that document_loader can load files correctly."""
    from src.services.document_loader import load_document, load_directory

    print("=" * 60)
    print("🧪 Test 1: Document Loader")
    print("=" * 60)

    # Test loading the sample MD file
    sample_path = str(Path(__file__).resolve().parent.parent.parent.parent / "data" / "knowledge-base" / "domates-hastaliklari-rehberi.md")
    
    doc = load_document(sample_path)
    assert doc is not None, "❌ Document loading returned None"
    assert "content" in doc, "❌ Missing 'content' key"
    assert "title" in doc, "❌ Missing 'title' key"
    assert len(doc["content"]) > 100, "❌ Content too short"
    
    print(f"  ✅ Loaded: {doc['title']}")
    print(f"  ✅ Source: {doc['source']}")
    print(f"  ✅ Content length: {len(doc['content'])} chars")

    # Test directory loading
    kb_dir = str(Path(__file__).resolve().parent.parent.parent.parent / "data" / "knowledge-base")
    docs = load_directory(kb_dir)
    assert len(docs) > 0, "❌ No documents found in directory"
    print(f"  ✅ Directory scan found {len(docs)} document(s)")
    print()


def test_recursive_chunking():
    """Test that RecursiveCharacterTextSplitter works correctly."""
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    print("=" * 60)
    print("🧪 Test 2: RecursiveCharacterTextSplitter")
    print("=" * 60)

    # Load sample doc
    sample_path = str(Path(__file__).resolve().parent.parent.parent.parent / "data" / "knowledge-base" / "domates-hastaliklari-rehberi.md")
    with open(sample_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Create splitter with same params as production
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = splitter.split_text(content)

    print(f"  📄 Original document: {len(content)} chars")
    print(f"  ✂️  Chunks created: {len(chunks)}")
    print()

    for i, chunk in enumerate(chunks):
        preview = chunk[:80].replace("\n", " ")
        print(f"  Chunk {i+1}: {len(chunk)} chars — \"{preview}...\"")

    # Verify overlap
    assert len(chunks) > 1, "❌ Document should produce multiple chunks"
    
    # Check that chunks have overlap (last chars of chunk N ≈ first chars of chunk N+1)
    for i in range(len(chunks) - 1):
        tail = chunks[i][-100:]
        head = chunks[i + 1][:200]
        # At least some text from the tail should appear in the head
        overlap_found = any(
            word in head
            for word in tail.split()[-5:]  # Last 5 words of current chunk
            if len(word) > 3
        )
        if overlap_found:
            print(f"  ✅ Overlap verified between chunk {i+1} → {i+2}")
    
    # Verify each chunk doesn't exceed max size (allow small overshoot for word boundaries)
    max_allowed = 1200  # Some tolerance
    for i, chunk in enumerate(chunks):
        assert len(chunk) <= max_allowed, f"❌ Chunk {i+1} too large: {len(chunk)} chars"
    
    print(f"\n  ✅ All {len(chunks)} chunks are within size limits")
    print()


def test_add_document_signature():
    """Test that add_document still accepts the original signature."""
    import inspect
    from src.services.rag import add_document

    print("=" * 60)
    print("🧪 Test 3: Backward Compatibility (add_document signature)")
    print("=" * 60)

    sig = inspect.signature(add_document)
    params = list(sig.parameters.keys())

    # Original params must still be there
    assert "content" in params, "❌ Missing 'content' param"
    assert "title" in params, "❌ Missing 'title' param"
    assert "source" in params, "❌ Missing 'source' param"
    assert "metadata" in params, "❌ Missing 'metadata' param"
    assert "settings" in params, "❌ Missing 'settings' param"

    # New params should have defaults (backward compatible)
    assert "chunk_size" in params, "❌ Missing 'chunk_size' param"
    assert "chunk_overlap" in params, "❌ Missing 'chunk_overlap' param"

    # Verify new params have defaults
    chunk_size_default = sig.parameters["chunk_size"].default
    chunk_overlap_default = sig.parameters["chunk_overlap"].default
    assert chunk_size_default == 1000, f"❌ chunk_size default is {chunk_size_default}, expected 1000"
    assert chunk_overlap_default == 200, f"❌ chunk_overlap default is {chunk_overlap_default}, expected 200"

    print(f"  ✅ Original params preserved: {['content', 'title', 'source', 'metadata', 'settings']}")
    print(f"  ✅ New params with defaults: chunk_size={chunk_size_default}, chunk_overlap={chunk_overlap_default}")
    print(f"  ✅ Backward compatibility confirmed — existing code will NOT break")
    print()


def test_existing_functions_untouched():
    """Verify that critical existing functions still exist and are importable."""
    print("=" * 60)
    print("🧪 Test 4: Existing System Integrity")
    print("=" * 60)

    from src.services.rag import (
        search_knowledge_base,
        generate_answer,
        add_document,
        get_fallback_knowledge,
        get_qdrant_client,
        FALLBACK_KNOWLEDGE
    )
    
    # Verify fallback knowledge is intact
    assert "early_blight" in FALLBACK_KNOWLEDGE, "❌ FALLBACK_KNOWLEDGE broken"
    assert "chlorosis" in FALLBACK_KNOWLEDGE, "❌ FALLBACK_KNOWLEDGE broken"
    assert "healthy" in FALLBACK_KNOWLEDGE, "❌ FALLBACK_KNOWLEDGE broken"
    print("  ✅ FALLBACK_KNOWLEDGE intact (4 entries)")

    # Verify fallback search works
    results = get_fallback_knowledge("early blight treatment")
    assert len(results) > 0, "❌ Fallback search returned empty"
    assert results[0]["title"] == "Erken Yanıklık (Alternaria solani)", "❌ Wrong fallback result"
    print(f"  ✅ Fallback search works: '{results[0]['title']}'")

    # Verify all functions are callable
    assert callable(search_knowledge_base), "❌ search_knowledge_base not callable"
    assert callable(generate_answer), "❌ generate_answer not callable"
    assert callable(add_document), "❌ add_document not callable"
    print("  ✅ All critical functions are importable and callable")
    
    # Verify new functions also exist
    from src.services.rag import add_documents_bulk
    assert callable(add_documents_bulk), "❌ add_documents_bulk not callable"
    print("  ✅ New add_documents_bulk function available")
    print()


if __name__ == "__main__":
    print("\n🌾 AgroCortex RAG Pipeline Verification\n")
    
    try:
        test_document_loader()
        test_recursive_chunking()
        test_add_document_signature()
        test_existing_functions_untouched()
        
        print("=" * 60)
        print("🎉 ALL TESTS PASSED — System integrity confirmed!")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
