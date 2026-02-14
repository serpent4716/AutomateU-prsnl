import os
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import List

import fitz
import google.generativeai as genai
from google.cloud import vision
from docx import Document as DocxDocument
from sqlalchemy.orm import Session

from app import models


EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "models/text-embedding-004")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "768"))
MAX_CHUNK_CHARS = int(os.getenv("PGVECTOR_CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("PGVECTOR_CHUNK_OVERLAP", "80"))


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


def _clean_and_flatten(text: str) -> str:
    text = re.sub(r"(?i)Page No\.?\s*\d*", "", text)
    text = re.sub(r"(?i)Date[:\s]*", "", text)
    text = re.sub(r"(?<!\.)\n(?!\n)", " ", text)
    text = re.sub(r"\n{2,}", "\n\n", text)
    text = re.sub(r"[^\x00-\x7F]+", "", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def _format_text_for_chunking(text: str) -> str:
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"\t+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ ]{2,}", " ", text)
    text = re.sub(r"\n([A-Z][A-Z0-9\s\-]{4,})\n", r"\n\n\1\n", text)
    return text.strip()


def _remove_repeating_headers_footers(pages: list[str], threshold: float = 0.7) -> list[str]:
    if not pages:
        return pages
    header_lines = [p.split("\n")[0].strip() for p in pages if p.strip()]
    footer_lines = [p.strip().split("\n")[-1] for p in pages if p.strip()]
    total = len(pages) or 1

    def _blacklist(lines: list[str]) -> set[str]:
        counts: dict[str, int] = {}
        for line in lines:
            counts[line] = counts.get(line, 0) + 1
        return {line for line, count in counts.items() if count / total >= threshold}

    header_blacklist = _blacklist(header_lines)
    footer_blacklist = _blacklist(footer_lines)

    cleaned = []
    for page in pages:
        lines = page.strip().split("\n")
        if lines and lines[0].strip() in header_blacklist:
            lines = lines[1:]
        if lines and lines[-1].strip() in footer_blacklist:
            lines = lines[:-1]
        cleaned.append("\n".join(lines))
    return cleaned


def _build_page_topic_map(toc: list, total_pages: int) -> list[str]:
    page_map = ["Introduction"] * total_pages
    if not toc:
        return page_map

    sparse_topic_map = {}
    current_headings = {}
    for level, title, page_num in toc:
        page_index = page_num - 1
        if page_index < 0 or page_index >= total_pages:
            continue
        current_headings[level] = title
        composite_title = ": ".join(current_headings[i] for i in sorted(current_headings.keys()) if i <= level)
        sparse_topic_map[page_index] = composite_title

    current_topic = "Introduction"
    for i in range(total_pages):
        if i in sparse_topic_map:
            current_topic = sparse_topic_map[i]
        page_map[i] = current_topic
    return page_map


def _ocr_page_with_vision(page: fitz.Page) -> str:
    try:
        pix = page.get_pixmap(dpi=300)
        img_byte_arr = pix.tobytes("png")
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=img_byte_arr)
        response = client.document_text_detection(image=image)
        if response.error.message:
            raise RuntimeError(response.error.message)
        return response.full_text_annotation.text or ""
    except Exception as e:
        print(f"Vision OCR failed: {e}")
        return ""


def _attach_topic_to_chunk(topic: str, chunk: str) -> str:
    topic_clean = (topic or "Introduction").strip()
    return f"[TOPIC:{topic_clean}]\n{chunk.strip()}"


def _extract_topic_from_chunk(content: str) -> str:
    first_line = (content or "").split("\n", 1)[0]
    if first_line.startswith("[TOPIC:") and first_line.endswith("]"):
        return first_line[len("[TOPIC:"):-1]
    return ""


def _extract_pages(file_path: str, source_filename: str | None = None) -> list[tuple[int, str]]:
    suffix = Path(source_filename or file_path).suffix.lower()
    if suffix == ".pdf":
        raw_pages = []
        pdf = fitz.open(file_path)
        try:
            toc = pdf.get_toc()
            total_pages = pdf.page_count
            page_topic_map = _build_page_topic_map(toc, total_pages)
            for idx, page in enumerate(pdf, start=1):
                text = page.get_text() or ""
                if len(text.strip()) < 100:
                    text = _ocr_page_with_vision(page)
                text = _format_text_for_chunking(_clean_and_flatten(text))
                topic = page_topic_map[idx - 1] if idx - 1 < len(page_topic_map) else "Introduction"
                raw_pages.append((idx, text, topic))
        finally:
            pdf.close()
        cleaned_texts = _remove_repeating_headers_footers([t for _, t, _ in raw_pages])
        return [(raw_pages[i][0], f"[TOPIC:{raw_pages[i][2]}]\n{cleaned_texts[i]}") for i in range(len(raw_pages))]

    if suffix == ".docx":
        doc = DocxDocument(file_path)
        text = "\n".join(p.text for p in doc.paragraphs if p.text and p.text.strip())
        text = _format_text_for_chunking(_clean_and_flatten(text))
        return [(1, _attach_topic_to_chunk("Introduction", text))]

    with open(file_path, "rb") as f:
        text = f.read().decode("utf-8", errors="ignore")
    text = _format_text_for_chunking(_clean_and_flatten(text))
    return [(1, _attach_topic_to_chunk("Introduction", text))]


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
            if not chunk.strip():
                continue
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
    tags = [tag] if tag == "central" else [tag, "central"]

    rows = (
        db.query(models.DocumentChunk)
        .filter(models.DocumentChunk.user_id == user_id)
        .filter(models.DocumentChunk.tag.in_(tags))
        .all()
    )

    q_tokens = re.findall(r"[a-zA-Z0-9]+", (question or "").lower())
    if not q_tokens:
        return []

    scored: list[tuple[float, models.DocumentChunk]] = []
    for row in rows:
        body = (row.content or "").lower()
        source = (row.source or "").lower()
        topic = _extract_topic_from_chunk(row.content).lower()
        score = 0.0
        for tok in q_tokens:
            if tok in body:
                score += 1.0
            if tok in topic:
                score += 1.2
            if tok in source:
                score += 0.5
        try:
            score += 1.0 / (1.0 + math.log(int(row.page) + 1))
        except Exception:
            pass
        if score > 0:
            scored.append((score, row))

    if not scored:
        return []
    scored.sort(key=lambda x: x[0], reverse=True)
    top_rows = [row for _, row in scored[: max(1, top_k)]]

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
