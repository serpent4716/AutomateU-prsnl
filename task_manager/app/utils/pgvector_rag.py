import os
from dataclasses import dataclass
from pathlib import Path
from typing import List

import fitz
import google.generativeai as genai
from docx import Document as DocxDocument
from sqlalchemy.orm import Session

from app import models


EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "models/text-embedding-004")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "768"))
MAX_CHUNK_CHARS = int(os.getenv("PGVECTOR_CHUNK_SIZE", "1200"))
CHUNK_OVERLAP = int(os.getenv("PGVECTOR_CHUNK_OVERLAP", "150"))


@dataclass
class RetrievedChunk:
    content: str
    source: str
    page: int
    doc_id: str
    user_id: int
    tag: str


def _configure_genai() -> None:
    api_key = os.getenv("GOOGLE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY is not configured.")
    genai.configure(api_key=api_key)


def _embed_text(text: str, task_type: str) -> list[float]:
    _configure_genai()
    response = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type=task_type,
    )
    embedding = response.get("embedding", []) if isinstance(response, dict) else []
    if not embedding:
        raise RuntimeError("Embedding API returned an empty vector.")
    if len(embedding) != EMBEDDING_DIM:
        raise RuntimeError(f"Unexpected embedding dimension: {len(embedding)} (expected {EMBEDDING_DIM})")
    return embedding


def _split_with_overlap(text: str) -> list[str]:
    clean = " ".join((text or "").split())
    if not clean:
        return []
    if len(clean) <= MAX_CHUNK_CHARS:
        return [clean]

    chunks: list[str] = []
    start = 0
    step = max(1, MAX_CHUNK_CHARS - CHUNK_OVERLAP)
    while start < len(clean):
        end = min(len(clean), start + MAX_CHUNK_CHARS)
        chunk = clean[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += step
    return chunks


def _extract_pages(file_path: str, source_filename: str | None = None) -> list[tuple[int, str]]:
    suffix = Path(source_filename or file_path).suffix.lower()
    if suffix == ".pdf":
        pages = []
        pdf = fitz.open(file_path)
        try:
            for idx, page in enumerate(pdf, start=1):
                pages.append((idx, page.get_text() or ""))
        finally:
            pdf.close()
        return pages

    if suffix == ".docx":
        doc = DocxDocument(file_path)
        text = "\n".join(p.text for p in doc.paragraphs if p.text and p.text.strip())
        return [(1, text)]

    with open(file_path, "rb") as f:
        text = f.read().decode("utf-8", errors="ignore")
    return [(1, text)]


def ingest_document_chunks(
    db: Session,
    *,
    doc_id: str,
    file_path: str,
    tag: str,
    user_id: str,
    source_filename: str | None = None,
) -> int:
    page_texts = _extract_pages(file_path, source_filename=source_filename)
    if not page_texts:
        return 0

    source_name = source_filename or Path(file_path).name
    user_id_int = int(user_id)

    db.query(models.DocumentChunk).filter(models.DocumentChunk.document_id == doc_id).delete()
    db.flush()

    rows: list[models.DocumentChunk] = []
    chunk_counter = 0
    for page_num, text in page_texts:
        for chunk in _split_with_overlap(text):
            embedding = _embed_text(chunk, task_type="retrieval_document")
            rows.append(
                models.DocumentChunk(
                    document_id=doc_id,
                    user_id=user_id_int,
                    tag=tag,
                    source=source_name,
                    page=page_num,
                    chunk_index=chunk_counter,
                    content=chunk,
                    embedding=embedding,
                )
            )
            chunk_counter += 1

    if rows:
        db.bulk_save_objects(rows)
    return len(rows)


def retrieve_context(
    db: Session,
    *,
    question: str,
    user_id: int,
    tag: str,
    top_k: int = 3,
) -> List[RetrievedChunk]:
    query_vec = _embed_text(question, task_type="retrieval_query")
    tags = [tag] if tag == "central" else [tag, "central"]

    query = (
        db.query(models.DocumentChunk)
        .filter(models.DocumentChunk.user_id == user_id)
        .filter(models.DocumentChunk.tag.in_(tags))
        .order_by(models.DocumentChunk.embedding.cosine_distance(query_vec))
        .limit(max(1, top_k))
    )
    rows = query.all()
    return [
        RetrievedChunk(
            content=row.content,
            source=row.source,
            page=row.page,
            doc_id=row.document_id,
            user_id=row.user_id,
            tag=row.tag,
        )
        for row in rows
    ]


def format_sources(chunks: List[RetrievedChunk]) -> list[str]:
    seen = set()
    output = []
    for c in chunks:
        key = (c.source, c.page, c.doc_id)
        if key in seen:
            continue
        seen.add(key)
        output.append(f"{c.source} (page {c.page}, doc {c.doc_id})")
    return output
