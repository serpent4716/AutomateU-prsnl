import json
import os
import textwrap
from collections import defaultdict

import google.generativeai as genai

from app import models
from app.database import SessionLocal
from app.utils import pgvector_rag


def _extract_topic_from_chunk(content: str) -> str:
    first_line = (content or "").split("\n", 1)[0].strip()
    if first_line.startswith("[TOPIC:") and first_line.endswith("]"):
        return first_line[len("[TOPIC:"):-1].strip() or "Introduction"
    return "Introduction"


def _strip_topic_prefix(content: str) -> str:
    if not content:
        return ""
    if content.startswith("[TOPIC:"):
        parts = content.split("\n", 1)
        return parts[1].strip() if len(parts) > 1 else ""
    return content.strip()


def process_quiz_document(file_content: bytes, file_name: str, doc_id: str, user_id: str):
    """
    Backward-compatible placeholder.
    Quiz ingestion now uses the shared pgvector pipeline.
    """
    return []


def run_quiz_ingestion_pipeline(db_url: str, doc_id: str, file_path: str, tag: str, user_id: str):
    """
    PGVector-native quiz ingestion pipeline.
    Keeps the same callable used by Celery/main while avoiding Chroma imports.
    """
    db = SessionLocal()
    try:
        source_filename = os.path.basename(file_path).split("_", 1)[1] if "_" in os.path.basename(file_path) else os.path.basename(file_path)
        chunk_count = pgvector_rag.ingest_document_chunks(
            db=db,
            doc_id=doc_id,
            file_path=file_path,
            tag=tag,
            user_id=user_id,
            source_filename=source_filename,
        )
        db.query(models.Document).filter(models.Document.id == doc_id).update(
            {"status": models.DocumentStatus.COMPLETED, "chroma_ids": [f"pgvector_chunks:{chunk_count}"]}
        )
        db.commit()
    except Exception as e:
        print(f"BACKGROUND TASK: FAILED for quiz doc_id={doc_id}. Error: {e}")
        db.query(models.Document).filter(models.Document.id == doc_id).update(
            {"status": models.DocumentStatus.FAILED}
        )
        db.commit()
        raise
    finally:
        db.close()


def build_prompt(content: str, settings: dict) -> str:
    prompt_template = f"""
        Generate a quiz in JSON format based on the following settings and content. Your entire response must be ONLY the raw JSON object, starting with {{ and ending with }}.
        If you think the content is not accurate enough you can make changes in the content as per your requirement but ensure that the questions are relevant to the content provided and accurate to the best of your knowledge.
        JSON Schema: The root must be a "questions" array. Each object in the array must contain these keys:
        - "question_text": (string) The question.
        - "question_type": (string) Must be one of {settings['question_types']}.
        - "options": (object or null) For "Multiple choice", use  {{"A": "...", "B": "...", ...}}. For "True or false", use {{"A": "True", "B": "False"}}. For other types, this must be null.
        - "correct_answer": (string) The key of the correct option (e.g., "A") for multiple choice, the string "True" or "False" for true/false, or the direct answer for other types.

        ---
        Settings:
        - Questions: {settings['max_questions']}
        - Hard Mode: {settings['hard_mode']}
        - Language: {settings['language']}

        ---
        Content:
        {content}
    """
    return textwrap.dedent(prompt_template)


def quiz_generation(content: str, settings: dict) -> dict:
    model = genai.GenerativeModel("gemini-2.0-flash")
    config = genai.types.GenerationConfig(
        temperature=0.2,
        max_output_tokens=1500
    )
    prompt = build_prompt(content, settings)
    try:
        response = model.generate_content(prompt, generation_config=config)
        cleaned_text = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned_text)
    except json.JSONDecodeError:
        raise ValueError("Failed to decode JSON from the model's response.")
    except Exception as e:
        raise RuntimeError(f"An error occurred during API call: {e}")


def get_representative_chunks_for_quiz(tag: str, source_doc_id: str) -> str:
    """
    Fetch representative chunks for one document from pgvector-backed table.
    Keeps topic-aware sampling (tree/topic context), avoids heavy similarity models.
    """
    db = SessionLocal()
    try:
        rows = (
            db.query(models.DocumentChunk)
            .filter(models.DocumentChunk.document_id == source_doc_id)
            .order_by(models.DocumentChunk.page.asc(), models.DocumentChunk.chunk_index.asc())
            .all()
        )
        if not rows:
            return ""

        grouped = defaultdict(list)
        for row in rows:
            topic = _extract_topic_from_chunk(row.content)
            grouped[topic].append(_strip_topic_prefix(row.content))

        final_chunks = []
        for topic in sorted(grouped.keys()):
            topic_chunks = [c for c in grouped[topic] if c]
            final_chunks.extend(topic_chunks[:2])

        if not final_chunks:
            final_chunks = [_strip_topic_prefix(r.content) for r in rows[:10] if _strip_topic_prefix(r.content)]

        return "\n\n".join(final_chunks)
    finally:
        db.close()
