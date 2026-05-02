"""
Topraksız Tarım AI Agent - Knowledge Base Ingestion Script

Scans the data/knowledge-base/ directory, loads all supported documents
(PDF, DOCX, TXT, MD), splits them into semantic chunks using
RecursiveCharacterTextSplitter, and upserts them into Qdrant.

Usage:
    cd backend
    python -m src.scripts.ingest
    python -m src.scripts.ingest --dir ../data/knowledge-base
    python -m src.scripts.ingest --chunk-size 800 --chunk-overlap 150
"""
import asyncio
import argparse
import logging
import sys
import os
from pathlib import Path

# Ensure backend/ is on sys.path when running as script
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from src.services.document_loader import load_directory, load_document
from src.services.rag import add_document, add_documents_bulk
from src.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("ingest")


async def ingest_directory(
    directory: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200
):
    """
    Main ingestion routine.
    
    1. Scans the directory for supported documents
    2. Loads each document
    3. Splits into chunks via RecursiveCharacterTextSplitter
    4. Embeds and stores in Qdrant
    """
    settings = get_settings()
    
    logger.info("=" * 60)
    logger.info("🌾 AgroCortex Knowledge Base Ingestion")
    logger.info("=" * 60)
    logger.info(f"  Directory:     {directory}")
    logger.info(f"  Chunk Size:    {chunk_size} chars")
    logger.info(f"  Chunk Overlap: {chunk_overlap} chars")
    logger.info(f"  Qdrant:        {settings.qdrant_host}:{settings.qdrant_port}")
    logger.info(f"  Collection:    {settings.qdrant_collection}")
    logger.info(f"  Embed Model:   {settings.ollama_embed_model}")
    logger.info("=" * 60)
    
    # 1. Load documents
    documents = load_directory(directory)
    
    if not documents:
        logger.warning("No documents found! Add files to the knowledge-base directory.")
        logger.info("Supported formats: .txt, .md, .pdf, .docx")
        return
    
    logger.info(f"\n📄 Loaded {len(documents)} document(s):")
    for i, doc in enumerate(documents, 1):
        preview = doc["content"][:80].replace("\n", " ")
        logger.info(f"  {i}. {doc['title']} ({doc['source']}) - {len(doc['content'])} chars")
        logger.info(f"     Preview: \"{preview}...\"")
    
    # 2. Ingest with chunking
    logger.info(f"\n🔄 Starting ingestion with chunk_size={chunk_size}, overlap={chunk_overlap}...")
    
    doc_ids = await add_documents_bulk(
        documents=documents,
        settings=settings,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    
    # 3. Summary
    success_count = len([d for d in doc_ids if d])
    logger.info("\n" + "=" * 60)
    logger.info("✅ Ingestion Complete!")
    logger.info(f"  Documents processed: {len(documents)}")
    logger.info(f"  Successfully stored: {success_count}")
    logger.info(f"  Failed:              {len(documents) - success_count}")
    
    if success_count > 0:
        logger.info(f"\n  Document IDs:")
        for doc, doc_id in zip(documents, doc_ids):
            status = "✅" if doc_id else "❌"
            logger.info(f"    {status} {doc['title']}: {doc_id or 'FAILED'}")
    
    logger.info("=" * 60)


async def ingest_single_file(
    filepath: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200
):
    """Ingest a single file into the knowledge base."""
    settings = get_settings()
    
    doc = load_document(filepath)
    if not doc:
        logger.error(f"Failed to load: {filepath}")
        return
    
    logger.info(f"📄 Ingesting: {doc['title']} ({len(doc['content'])} chars)")
    
    doc_id = await add_document(
        content=doc["content"],
        title=doc["title"],
        source=doc["source"],
        settings=settings,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    
    logger.info(f"✅ Stored with doc_id: {doc_id}")


def main():
    parser = argparse.ArgumentParser(
        description="🌾 AgroCortex Knowledge Base Ingestion Tool"
    )
    parser.add_argument(
        "--dir",
        default="../data/knowledge-base",
        help="Path to knowledge base directory (default: ../data/knowledge-base)"
    )
    parser.add_argument(
        "--file",
        default=None,
        help="Path to a single file to ingest (overrides --dir)"
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=1000,
        help="Maximum chunk size in characters (default: 1000)"
    )
    parser.add_argument(
        "--chunk-overlap",
        type=int,
        default=200,
        help="Character overlap between chunks (default: 200)"
    )
    
    args = parser.parse_args()
    
    if args.file:
        asyncio.run(ingest_single_file(
            filepath=args.file,
            chunk_size=args.chunk_size,
            chunk_overlap=args.chunk_overlap
        ))
    else:
        asyncio.run(ingest_directory(
            directory=args.dir,
            chunk_size=args.chunk_size,
            chunk_overlap=args.chunk_overlap
        ))


if __name__ == "__main__":
    main()
