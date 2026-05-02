"""
Topraksız Tarım AI Agent - Document Loader
Multi-format document loading for the RAG knowledge base.

Supports: .txt, .pdf, .docx, .md
"""
import os
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def load_text_file(filepath: str) -> str:
    """Load a plain text or markdown file."""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def load_pdf_file(filepath: str) -> str:
    """
    Load a PDF file using pypdf.
    Extracts text from all pages and joins them.
    """
    try:
        from pypdf import PdfReader
    except ImportError:
        logger.error("pypdf not installed. Run: pip install pypdf")
        raise

    reader = PdfReader(filepath)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text and text.strip():
            pages.append(text.strip())
    
    full_text = "\n\n".join(pages)
    logger.info(f"Loaded PDF: {filepath} ({len(reader.pages)} pages, {len(full_text)} chars)")
    return full_text


def load_docx_file(filepath: str) -> str:
    """
    Load a Word (.docx) file using python-docx.
    Extracts text from all paragraphs.
    """
    try:
        from docx import Document
    except ImportError:
        logger.error("python-docx not installed. Run: pip install python-docx")
        raise

    doc = Document(filepath)
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    
    full_text = "\n\n".join(paragraphs)
    logger.info(f"Loaded DOCX: {filepath} ({len(paragraphs)} paragraphs, {len(full_text)} chars)")
    return full_text


# ── File extension → loader mapping ──
LOADERS = {
    ".txt": load_text_file,
    ".md": load_text_file,
    ".pdf": load_pdf_file,
    ".docx": load_docx_file,
}

SUPPORTED_EXTENSIONS = set(LOADERS.keys())


def load_document(filepath: str) -> Optional[dict]:
    """
    Load a single document from disk.
    
    Returns:
        dict with keys: content, title, source
        None if the file format is unsupported or loading fails
    """
    path = Path(filepath)
    ext = path.suffix.lower()
    
    if ext not in SUPPORTED_EXTENSIONS:
        logger.warning(f"Unsupported file format: {ext} ({filepath})")
        return None
    
    try:
        loader = LOADERS[ext]
        content = loader(filepath)
        
        if not content or not content.strip():
            logger.warning(f"Empty document: {filepath}")
            return None
        
        return {
            "content": content.strip(),
            "title": path.stem.replace("_", " ").replace("-", " ").title(),
            "source": path.name,
        }
    except Exception as e:
        logger.error(f"Failed to load {filepath}: {e}")
        return None


def load_directory(directory: str) -> list[dict]:
    """
    Scan a directory and load all supported documents.
    
    Args:
        directory: Path to the knowledge base directory
        
    Returns:
        List of document dicts (content, title, source)
    """
    dir_path = Path(directory)
    
    if not dir_path.exists():
        logger.error(f"Directory not found: {directory}")
        return []
    
    documents = []
    supported_files = []
    
    # Collect all supported files (recursive)
    for ext in SUPPORTED_EXTENSIONS:
        supported_files.extend(dir_path.rglob(f"*{ext}"))
    
    # Sort for consistent ordering
    supported_files.sort()
    
    logger.info(f"Found {len(supported_files)} supported file(s) in {directory}")
    
    for filepath in supported_files:
        doc = load_document(str(filepath))
        if doc:
            documents.append(doc)
    
    logger.info(f"Successfully loaded {len(documents)}/{len(supported_files)} document(s)")
    return documents
