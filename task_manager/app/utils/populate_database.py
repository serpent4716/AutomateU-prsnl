from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema.document import Document
from langchain_huggingface import HuggingFaceEmbeddings
import google.generativeai as genai
import os
import re
import math
import fitz
from google.cloud import vision
from collections import Counter
from dotenv import load_dotenv
from nltk.corpus import words
import nltk
from rapidfuzz import process
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import app.models as models
from app.database import DATABASE_URL

load_dotenv()

_ENGLISH_VOCAB = None
_CROSS_ENCODER_MODEL = None
_EMBEDDING_FN = None


def _get_english_vocab():
    global _ENGLISH_VOCAB
    if _ENGLISH_VOCAB is None:
        try:
            _ = words.words()
        except LookupError:
            nltk.download("words")
        _ENGLISH_VOCAB = set(w.lower() for w in words.words())
    return _ENGLISH_VOCAB


def _get_cross_encoder_model():
    global _CROSS_ENCODER_MODEL
    if _CROSS_ENCODER_MODEL is None:
        from sentence_transformers.cross_encoder import CrossEncoder
        _CROSS_ENCODER_MODEL = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _CROSS_ENCODER_MODEL


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data_store")
os.makedirs(DATA_DIR, exist_ok=True)
CHROMA_PATH = os.path.join(DATA_DIR, "chroma")
USE_CENTRAL_DB = True
CENTRAL_TAG = "central"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_standalone_session():
    return SessionLocal()


def clean_and_flatten(text: str) -> str:
    text = re.sub(r"(?i)Page No\.?\s*\d*", "", text)
    text = re.sub(r"(?i)Date[:\s]*", "", text)
    text = re.sub(r"(?<!\.)\n(?!\n)", " ", text)
    text = re.sub(r"\n{2,}", "\n\n", text)
    text = text.replace("â†³", "")
    text = text.replace("â€¢", "-")
    text = re.sub(r"[^\x00-\x7F]+", "", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def format_text_for_chunking(text: str) -> str:
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"\t+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ ]{2,}", " ", text)
    text = re.sub(r"\n([A-Z][A-Z0-9\s\-]{4,})\n", r"\n\n\1\n", text)
    return text.strip()


def remove_repeating_headers_footers(pages: list[str], threshold: float = 0.7) -> list[str]:
    header_lines = [page.split("\n")[0].strip() for page in pages if page.strip()]
    footer_lines = [page.strip().split("\n")[-1] for page in pages if page.strip()]

    header_counts = Counter(header_lines)
    footer_counts = Counter(footer_lines)

    total = len(pages) if pages else 1
    header_blacklist = {line for line, count in header_counts.items() if count / total >= threshold}
    footer_blacklist = {line for line, count in footer_counts.items() if count / total >= threshold}

    cleaned_pages = []
    for page in pages:
        lines = page.strip().split("\n")
        if lines and lines[0].strip() in header_blacklist:
            lines = lines[1:]
        if lines and lines[-1].strip() in footer_blacklist:
            lines = lines[:-1]
        cleaned_pages.append("\n".join(lines))
    return cleaned_pages


def correct_word(word: str, threshold: int = 85) -> str:
    lw = word.lower()
    vocab = _get_english_vocab()
    if lw in vocab or lw.isnumeric():
        return word
    match = process.extractOne(word, vocab)
    if match and match[1] >= threshold:
        return match[0]
    return word


def correct_text(text: str) -> str:
    corrected = []
    for token in re.findall(r"\b\w+\b|\W", text):
        if token.isalpha():
            corrected.append(correct_word(token))
        else:
            corrected.append(token)
    return "".join(corrected)


def compute_confidence(text: str) -> float:
    tokens = re.findall(r"\b\w+\b", text)
    if not tokens:
        return 0.0
    valid_words = [
        token for token in tokens if token.lower() in _get_english_vocab() and len(token) > 2 and token.isalpha()
    ]
    return len(valid_words) / len(tokens)


def get_embedding_function():
    global _EMBEDDING_FN
    if _EMBEDDING_FN is None:
        _EMBEDDING_FN = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return _EMBEDDING_FN


def get_chroma_db(tag: str, doc_id: str):
    persist_path = os.path.join(CHROMA_PATH, tag, doc_id)
    os.makedirs(persist_path, exist_ok=True)
    return Chroma(
        collection_name="content",
        persist_directory=persist_path,
        embedding_function=get_embedding_function(),
    )


def _build_page_topic_map(toc: list, total_pages: int) -> list:
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


def ocr_page(page: fitz.Page) -> str:
    try:
        pix = page.get_pixmap(dpi=300)
        img_byte_arr = pix.tobytes("png")
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=img_byte_arr)
        response = client.document_text_detection(image=image)
        if response.error.message:
            raise Exception(f"Google Vision API Error: {response.error.message}")
        return response.full_text_annotation.text
    except Exception as e:
        print(f"OCR failed for page: {e}")
        return ""


def process_document(file_content: bytes, file_name: str, doc_id: str, user_id: str) -> list[Document]:
    documents = []
    try:
        pdf_doc = fitz.open(stream=file_content, filetype="pdf")
        toc = pdf_doc.get_toc()
        total_pages = pdf_doc.page_count
        page_topic_map = _build_page_topic_map(toc, total_pages)

        raw_pages = []
        for _, page in enumerate(pdf_doc, start=1):
            text = page.get_text()
            if len(text.strip()) < 100:
                text = ocr_page(page)
            raw_pages.append(text)

        cleaned_pages = remove_repeating_headers_footers(raw_pages)

        for idx, text in enumerate(cleaned_pages, start=1):
            current_topic = page_topic_map[idx - 1]
            full_text = clean_and_flatten(text)
            full_text = format_text_for_chunking(full_text)
            full_text = correct_text(full_text)
            documents.append(
                Document(
                    page_content=full_text,
                    metadata={
                        "source": file_name,
                        "doc_id": doc_id,
                        "user_id": user_id,
                        "page": idx,
                        "topic": current_topic,
                    },
                )
            )

        pdf_doc.close()
        return documents
    except Exception as e:
        print(f"Error processing document {file_name}: {e}")
        return []


def split_documents(documents: list[Document]) -> list[Document]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=80,
        length_function=len,
        is_separator_regex=False,
    )
    return text_splitter.split_documents(documents)


def add_to_chroma(tag: str, chunks: list[Document], doc_id: str | None = None):
    doc_id = doc_id or "shared"
    db_tag = get_chroma_db(tag, doc_id)

    ids, metadatas, texts = [], [], []
    for i, chunk in enumerate(chunks):
        source = chunk.metadata.get("source", "unknown.pdf")
        page = chunk.metadata.get("page", "?")
        chunk_id = f"{tag}_{source}_page{page}_chunk{i}"
        ids.append(chunk_id)
        metadata = chunk.metadata.copy()
        metadata["page"] = page
        metadata["source"] = source
        metadatas.append(metadata)
        texts.append(chunk.page_content)

    embedding_fn = get_embedding_function()
    vectors = embedding_fn.embed_documents(texts)
    db_tag.add_texts(texts, ids=ids, metadatas=metadatas, embeddings=vectors)

    if USE_CENTRAL_DB and tag != CENTRAL_TAG:
        db_central = get_chroma_db(CENTRAL_TAG, doc_id)
        db_central.add_texts(texts, ids=ids, metadatas=metadatas, embeddings=vectors)

    return ids


def run_ingestion_pipeline(db_url: str, doc_id: str, file_path: str, tag: str, user_id: str):
    db = get_standalone_session()
    try:
        with open(file_path, "rb") as f:
            file_content = f.read()
        file_name = os.path.basename(file_path).split("_", 1)[1]

        documents = process_document(file_content, file_name, doc_id, user_id)
        if not documents:
            raise ValueError("Document processing failed, no content extracted.")

        chunks = split_documents(documents)
        chroma_ids = add_to_chroma(tag, chunks, doc_id)

        db.query(models.Document).filter(models.Document.id == doc_id).update(
            {"status": models.DocumentStatus.COMPLETED, "chroma_ids": chroma_ids}
        )
        db.commit()
    except Exception as e:
        print(f"BACKGROUND TASK FAILED for doc_id {doc_id}: {e}")
        db.query(models.Document).filter(models.Document.id == doc_id).update({"status": models.DocumentStatus.FAILED})
        db.commit()
    finally:
        db.close()


def correct_with_llm(text: str) -> str:
    prompt = """
            You are an assistant that helps clean up OCR-scanned educational text.
            - Fix spelling and grammar issues
            - Merge broken sentences
            - Preserve technical terms like XOR, MAC, UDP
            - DO NOT change facts

            Original Text:
            {original_text}
            """
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            prompt.format(original_text=text),
            generation_config=genai.types.GenerationConfig(temperature=0.0, max_output_tokens=1200),
        )
        return (response.text or "").strip()
    except Exception as e:
        print(f"Error querying Gemini: {e}")
        return "Sorry, I encountered an error while generating a response."


def rerank_documents(query: str, retrieved_docs: list[Document]) -> list[Document]:
    if not retrieved_docs:
        return []
    pairs = [[query, doc.page_content] for doc in retrieved_docs]
    model = _get_cross_encoder_model()
    scores = model.predict(pairs)
    scored_docs = list(zip(scores, retrieved_docs))
    scored_docs.sort(key=lambda x: x[0], reverse=True)
    return [doc for score, doc in scored_docs]


def format_chat_history(messages: list[models.Message]) -> list[dict]:
    return [{"role": msg.role, "content": msg.content} for msg in messages]


def query_llm(question: str, context_text: str, chat_history: list[dict]):
    system_prompt = """You are a helpful study assistant. Based ONLY on retrieved context, answer the latest question.
If context is insufficient, say: I couldn't find information on that topic in the provided documents.
Do not hallucinate.
CONTEXT:
{context}
""".strip()

    history_text = "\n".join([f"{m.get('role', 'user')}: {m.get('content', '')}" for m in chat_history])
    prompt = f"{system_prompt.format(context=context_text)}\n\nCHAT HISTORY:\n{history_text}\n\nUSER QUESTION:\n{question}"

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(temperature=0.2, max_output_tokens=1200),
        )
        return (response.text or "").strip()
    except Exception as e:
        print(f"Error querying Gemini: {e}")
        return "Sorry, I encountered an error while generating a response."


def delete_from_chroma(chroma_ids: list[str], tag: str, doc_id: str):
    if not chroma_ids:
        return
    collection = get_chroma_db(tag, doc_id)
    collection.delete(ids=chroma_ids)
    if USE_CENTRAL_DB:
        central_collection = get_chroma_db(CENTRAL_TAG, doc_id)
        central_collection.delete(ids=chroma_ids)


def format_sources(docs: list[Document]) -> list[str]:
    sources = []
    for doc in docs:
        file_name = doc.metadata.get("source", "unknown.pdf")
        page = doc.metadata.get("page", "?")
        sources.append(f"{file_name} (page {page})")
    return list(set(sources))


def get_all_docs_collections(tag: str):
    base_path = os.path.join(CHROMA_PATH, tag)
    if not os.path.exists(base_path):
        return []

    collections = []
    for doc_id in os.listdir(base_path):
        doc_path = os.path.join(base_path, doc_id)
        if os.path.isdir(doc_path):
            collection = Chroma(
                collection_name="content",
                persist_directory=doc_path,
                embedding_function=get_embedding_function(),
            )
            collections.append((doc_id, collection))
    return collections


def _tokenize_for_lexical(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9]+", (text or "").lower())


def _lexical_score(query: str, content: str, metadata: dict) -> float:
    q_tokens = _tokenize_for_lexical(query)
    if not q_tokens:
        return 0.0

    body = (content or "").lower()
    topic = str((metadata or {}).get("topic", "")).lower()
    source = str((metadata or {}).get("source", "")).lower()

    score = 0.0
    for tok in q_tokens:
        if tok in body:
            score += 1.0
        if tok in topic:
            score += 1.2
        if tok in source:
            score += 0.5

    page = (metadata or {}).get("page")
    try:
        page_val = int(page)
        score += 1.0 / (1.0 + math.log(page_val + 1))
    except Exception:
        pass

    return score


def retrieve_tree_based_context(query: str, tag: str, top_k: int = 3) -> list[Document]:
    candidates: list[tuple[float, Document]] = []

    for doc_id, chroma_db in get_all_docs_collections(tag):
        try:
            rows = chroma_db.get(include=["documents", "metadatas"])
        except Exception as e:
            print(f"Failed to read collection {doc_id}: {e}")
            continue

        docs = rows.get("documents", []) if rows else []
        metas = rows.get("metadatas", []) if rows else []

        for content, meta in zip(docs, metas):
            md = meta or {}
            md["doc_id"] = md.get("doc_id", doc_id)
            md["tag"] = md.get("tag", tag)
            score = _lexical_score(query, content, md)
            if score <= 0:
                continue
            candidates.append((score, Document(page_content=content, metadata=md)))

    if not candidates:
        return []

    candidates.sort(key=lambda x: x[0], reverse=True)
    top_docs = [doc for _, doc in candidates[: max(top_k * 4, top_k)]]
    reranked = rerank_documents(query, top_docs)
    return reranked[:top_k]
