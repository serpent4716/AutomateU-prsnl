from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_ollama import OllamaLLM
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema.document import Document
from langchain_huggingface import HuggingFaceEmbeddings
import os
import uuid
import fitz  # PyMuPDF
from google.cloud import vision
# New imports for standalone database session
from sqlalchemy import create_engine, Enum
from sqlalchemy.orm import sessionmaker
import app.models as models # Import your models
import re
from collections import Counter
from nltk.corpus import words
from rapidfuzz import process
import nltk
from groq import Groq
from dotenv import load_dotenv
from sentence_transformers.cross_encoder import CrossEncoder



load_dotenv()

try:
    _ = words.words()
except LookupError:
    nltk.download("words")
english_vocab = set(w.lower() for w in words.words())


# REFINEMENT: Initialize models once to be reused, improving performance.
cross_encoder_model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # app/
DATA_DIR = os.path.join(BASE_DIR, "data_store")
os.makedirs(DATA_DIR, exist_ok=True)
CHROMA_PATH = os.path.join(DATA_DIR, "chroma") # Changed to use os.path.join for consistency
USE_CENTRAL_DB = False
CENTRAL_TAG = "central"


# --- Standalone DB Session for Background Task ---
# The background task runs in a separate context and needs its own DB connection.
engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_standalone_session():
    return SessionLocal()


# --- Cleaning and flattening text ---
def clean_and_flatten(text: str) -> str:
    # Remove boilerplate
    text = re.sub(r"(?i)Page No\.?\s*\d*", "", text)
    text = re.sub(r"(?i)Date[:\s]*", "", text)

    # Flatten line breaks to improve sentence flow
    text = re.sub(r"(?<!\.)\n(?!\n)", " ", text)  # Turn line-breaks into spaces unless they're true paragraph breaks
    text = re.sub(r"\n{2,}", "\n\n", text)        # Keep double newlines

    # Replace or strip garbage symbols
    text = text.replace("↳", "")
    text = text.replace("•", "-")
    text = re.sub(r"[^\x00-\x7F]+", "", text)     # Strip non-ASCII noise (you can tweak this if needed)

    # Collapse excessive spaces
    text = re.sub(r" {2,}", " ", text)

    return text.strip()

# --- Artificial Removal of boilerplate text ---
def remove_repeating_headers_footers(pages: list[str], threshold: float = 0.7) -> list[str]:
    """
    Detects and removes headers/footers that appear on most pages.
    """
    header_lines = [page.split("\n")[0].strip() for page in pages if page.strip()]
    footer_lines = [page.strip().split("\n")[-1] for page in pages if page.strip()]

    header_counts = Counter(header_lines)
    footer_counts = Counter(footer_lines)

    total = len(pages)
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

# --- Word Correction ---
def correct_word(word: str, threshold: int = 85) -> str:
    lw = word.lower()
    if lw in english_vocab or lw.isnumeric():
        return word

    match = process.extractOne(word, english_vocab)
    if match and match[1] >= threshold:
        return match[0]

    return word
def correct_text(text: str) -> str:
    corrected = []
    for token in re.findall(r"\b\w+\b|\W", text):  # preserve punctuation
        if token.isalpha():
            corrected.append(correct_word(token))
        else:
            corrected.append(token)
    return "".join(corrected)


#--- Computing the confidence score for a document ---
def compute_confidence(text: str) -> float:
    """
    Returns a confidence score [0.0, 1.0] based on % of known English words.
    Ignores numbers, punctuation, and short words (1–2 chars).
    """
    tokens = re.findall(r"\b\w+\b", text)
    if not tokens:
        return 0.0

    valid_words = [
        token for token in tokens
        if token.lower() in english_vocab and len(token) > 2 and token.isalpha()
    ]

    return len(valid_words) / len(tokens)

# --- Embedding and DB Functions ---

def get_embedding_function():
    # --- GPU model (heavy, high accuracy) ---
    # model_name = 'BAAI/bge-large-en-v1.5'
    # return HuggingFaceEmbeddings(model_name=model_name)

    # --- CPU-friendly (fast) ---
    model_name = 'sentence-transformers/all-MiniLM-L6-v2'
    return HuggingFaceEmbeddings(model_name=model_name)


# def get_chroma_db(tag: str): 
#     persist_path = os.path.join(CHROMA_PATH, tag) 
#     return Chroma(persist_directory=persist_path, embedding_function=get_embedding_function())
def get_chroma_db(tag: str):
    """Return a Chroma collection (like a table in SQL)."""
    persist_path = CHROMA_PATH  # single DB location
    collection_name = tag       # separate collection per tag

    return Chroma(
        collection_name=collection_name,
        persist_directory=persist_path,
        embedding_function=get_embedding_function(),  # or get_embedding_function()
    )
# --- Core Document Processing Logic ---
def process_document(file_content: bytes, file_name: str, doc_id: str, user_id: str) -> list[Document]:
    documents = []

    try:
        pdf_doc = fitz.open(stream=file_content, filetype="pdf")
        raw_pages = []
        for page_num, page in enumerate(pdf_doc, start=1):
            text = page.get_text()
            if len(text.strip()) < 100:
                text = ocr_page(page)
            raw_pages.append((page_num, text))

        # Header/footer cleaning
        cleaned_pages = remove_repeating_headers_footers([t for _, t in raw_pages])

        for idx, text in enumerate(cleaned_pages, start=1):
            full_text = clean_and_flatten(text)
            full_text = correct_text(full_text)

            confidence = compute_confidence(full_text)
            if confidence < 0.5:
                print(f"⚠️ Low confidence on page {idx} ({confidence:.2f}) — running LLM correction.")
                try:
                    full_text = correct_with_llm(full_text)
                except Exception as e:
                    print(f"❌ LLM correction failed on page {idx}: {e}")

            doc = Document(
                page_content=full_text,
                metadata={
                    "source": file_name,
                    "doc_id": doc_id,
                    "user_id": user_id,
                    "page": idx  # exact page number
                }
            )
            documents.append(doc)

        pdf_doc.close()
        return documents

    except Exception as e:
        print(f"Error processing document {file_name}: {e}")
        return []

    #     raw_pages = []
    #     char_offsets = []
    #     offset = 0

    #     for page_num, page in enumerate(pdf_doc):
    #         text = page.get_text()
    #         if len(text.strip()) < 100:
    #             text = ocr_page(page)

    #         raw_pages.append(text)
    #         char_offsets.append((page_num + 1, offset, offset + len(text)))
    #         offset += len(text)

    #     # Header/footer cleaning
    #     cleaned_pages = remove_repeating_headers_footers(raw_pages)

    #     # Join full text for global cleaning
    #     full_text = "\n\n".join(cleaned_pages)
    #     full_text = clean_and_flatten(full_text)
    #     full_text = correct_text(full_text)

    #     # Confidence check
    #     confidence = compute_confidence(full_text)
    #     if confidence < 0.5:
    #         print(f"⚠️ Low global confidence ({confidence:.2f}) — running LLM correction.")
    #         try:
    #             full_text = correct_with_llm(full_text)
    #         except Exception as e:
    #             print(f"❌ LLM correction failed: {e}")

    #     # Return a single "cleaned, corrected" Document
    #     doc = Document(
    #         page_content=full_text,
    #         metadata={
    #             "source": file_name,
    #             "doc_id": doc_id,
    #             "user_id": user_id,
    #             "page_start": 1,
    #             "page_end": len(cleaned_pages)
    #         }
    #     )
    #     documents.append(doc)
    #     pdf_doc.close()
    #     return documents

    # except Exception as e:
    #     print(f"Error processing document {file_name}: {e}")
    #     return []


def ocr_page(page: fitz.Page) -> str:
    """
    Performs OCR on a single PDF page using Google Cloud Vision.
    """
    try:
        # Render page to an image in memory
        pix = page.get_pixmap(dpi=300)
        img_byte_arr = pix.tobytes("png")
        
        # Call Google Cloud Vision API
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=img_byte_arr)
        response = client.document_text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"Google Vision API Error: {response.error.message}")
            
        return response.full_text_annotation.text
    except Exception as e:
        print(f"OCR failed for page: {e}")
        return "" # Return empty string on failure

def split_documents(documents: list[Document]) -> list[Document]:
    """Splits LangChain documents into smaller chunks."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=80,
        length_function=len,
        is_separator_regex=False,
    )
    return text_splitter.split_documents(documents)

def add_to_chroma(tag: str, chunks: list[Document]):
    """Adds document chunks to the specified ChromaDB collection."""
    db_tag = get_chroma_db(tag)
    
    
    ids, metadatas, texts = [], [], []
    for i, chunk in enumerate(chunks):
        source = chunk.metadata.get("source", "unknown.pdf")
        page = chunk.metadata.get("page", "?")

        # Human-readable ID
        chunk_id = f"{tag}_{source}_page{page}_chunk{i}"
        ids.append(chunk_id)

        metadata = chunk.metadata.copy()
        metadata["page"] = page
        metadata["source"] = source
        metadatas.append(metadata)

        texts.append(chunk.page_content)

    print(f"Adding/updating {len(chunks)} chunks in tag '{tag}'...")

    # Batch embeddings (faster than one by one)
    embedding_fn = get_embedding_function()
    vectors = embedding_fn.embed_documents(texts)

    db_tag.add_texts(texts, ids=ids, metadatas=metadatas, embeddings=vectors)
    print(f"✅ Successfully added/updated chunks in tag '{tag}'.")

    if USE_CENTRAL_DB and tag != CENTRAL_TAG:
        print(f"↳ Adding/updating in central database...")
        db_central = get_chroma_db(CENTRAL_TAG)
        db_central.add_texts(texts, ids=ids, metadatas=metadatas, embeddings=vectors)
        print("✅ Successfully added/updated chunks in central DB.")

    return ids
    # # Generate unique and stable IDs for each chunk
    # ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.page_content)) for chunk in chunks]
    
    # # Use upsert to add new chunks and update existing ones if content changes
    # print(f"Adding/updating {len(chunks)} chunks in tag '{tag}'...")
    # db_tag.add_documents(documents=chunks, ids=ids)
    # print(f"Successfully added/updated chunks in tag '{tag}'.")

    # if USE_CENTRAL_DB and tag != CENTRAL_TAG:
    #     print(f"↳ Adding/updating in central database...")
    #     db_central = get_chroma_db(CENTRAL_TAG)
        
    #     # Add the tag to the metadata for central DB
    #     central_chunks = []
    #     for chunk in chunks:
    #         central_metadata = chunk.metadata.copy()
    #         central_metadata['tag'] = tag
    #         central_chunks.append(Document(page_content=chunk.page_content, metadata=central_metadata))

    #     central_ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.page_content)) for chunk in central_chunks]
    #     db_central.add_documents(documents=central_chunks, ids=central_ids)
    #     print("Successfully added/updated chunks in central DB.")
    # return ids  # Return the list of IDs for further processing if needed

# --- Standalone Ingestion Pipeline (for CLI and background tasks) ---

def run_ingestion_pipeline(db_url: str, doc_id: str, file_path: str, tag: str, user_id: str):
    """
    A self-contained ingestion pipeline with robust error handling.
    This is the function the background task will call.
    """
    db = get_standalone_session()
    try:
        print(f"BACKGROUND TASK: Starting ingestion for doc_id: {doc_id}")
        
        # 1. Read file content
        with open(file_path, "rb") as f:
            file_content = f.read()
        file_name = os.path.basename(file_path).split('_', 1)[1] # Get original filename

        # 2. Process document (OCR, etc.)
        documents = process_document(file_content, file_name, doc_id, user_id)
        if not documents:
            raise ValueError("Document processing failed, no content extracted.")

        # 3. Split into chunks
        chunks = split_documents(documents)
        print(f"BACKGROUND TASK: Split into {len(chunks)} chunks.")

        # 4. Add to ChromaDB
        chroma_ids = add_to_chroma(tag, chunks)
        if USE_CENTRAL_DB:
             add_to_chroma(CENTRAL_TAG, chunks)

        # 5. If successful, update status to 'completed'
        db.query(models.Document).filter(models.Document.id == doc_id).update({
        "status": models.DocumentStatus.COMPLETED,
        "chroma_ids": chroma_ids
        })
        db.commit()
        print(f"BACKGROUND TASK: Successfully completed ingestion for doc_id: {doc_id}")

    except Exception as e:
        # 6. If ANY error occurs, update status to 'failed'
        print(f"BACKGROUND TASK: FAILED for doc_id: {doc_id}. Error: {e}")
        db.query(models.Document).filter(models.Document.id == doc_id).update({"status": models.DocumentStatus.FAILED})
        db.commit()
    finally:
        # 7. Clean up the temporary file and close the DB session
        if os.path.exists(file_path):
            os.remove(file_path)
        db.close()


# --- CLI and Querying Logic (Largely Unchanged) ---

def correct_with_llm(text: str) -> str:
    """Uses an LLM to correct text."""
    
    prompt = """
            You are an assistant that helps clean up OCR-scanned educational text. Your job is to:
            - Fix spelling and grammar issues
            - Merge broken sentences
            - Preserve technical terms like "XOR", "MAC", "UDP", etc.
            - DO NOT change any facts or hallucinate content

            Original Text:
            {original_text}

            """
    # NOTE: LLM part is unchanged as per instructions
    # model = OllamaLLM(model="mistral") 
    # response = model.invoke(prompt)
    # return response.strip()
    
    try:
        client = Groq()
        completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user", "content": prompt.format(original_text=text)
            }
        ],
        temperature=0.0, # use low temperature for deterministic output
        )
        return (completion.choices[0].message.content)
    except Exception as e:
        print(f"Error querying Groq: {e}")
        return "Sorry, I encountered an error while generating a response."

# NEW FUNCTION FOR RE-RANKING
def rerank_documents(query: str, retrieved_docs: list[Document]) -> list[Document]:
    """
    Re-ranks a list of retrieved documents against a query using a Cross-Encoder model.
    """
    if not retrieved_docs:
        return []
    print(f"Re-ranking {len(retrieved_docs)} documents...")
    # Create pairs of [query, document_content] for the model
    pairs = [[query, doc.page_content] for doc in retrieved_docs]
    
    # Get scores from the cross-encoder model
    scores = cross_encoder_model.predict(pairs)
    
    # Combine documents with their scores and sort
    scored_docs = list(zip(scores, retrieved_docs))
    scored_docs.sort(key=lambda x: x[0], reverse=True)
    
    # Return just the documents in the new, more relevant order
    reranked_docs = [doc for score, doc in scored_docs]
    print("Re-ranking complete.")
    return reranked_docs
def format_chat_history(messages: list[models.Message]) -> list[dict]:
    """Formats chat history for the LLM prompt."""
    return [{"role": msg.role, "content": msg.content} for msg in messages]

def query_llm(question: str, context_text: str, chat_history: list[dict]):
    """
    Queries the LLM with context and chat history using Groq.
    """
    # Construct the system prompt
    system_prompt = """You are a helpful study assistant. Based ONLY on the following retrieved context from the user's documents, answer their latest question.
    If the context doesn't contain the answer, say "I couldn't find information on that topic in the provided documents."
    You can use some of your prior knowledge if you are confident about it but make sure you don't hallucinate.
    CONTEXT:
    {context}
    """.strip()

    # Create the final list of messages for the API call
    messages = [
        {"role": "system", "content": system_prompt.format(context=context_text)}
    ]
    messages.extend(chat_history) # Add the historical messages
    messages.append({"role": "user", "content": question}) # Add the latest user question

    try:
        client = Groq()
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
            temperature=0.2,  # Use low temperature for facutal responses
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error querying Groq: {e}")
        return "Sorry, I encountered an error while generating a response."

def delete_from_chroma(chroma_ids: list[str], tag: str):
    """
    Deletes chunks from ChromaDB by their IDs.
    """
    if not chroma_ids:
        print("⚠️ No chroma_ids provided for deletion.")
        return
    
    print(f"🗑️ Deleting {len(chroma_ids)} chunks from collection '{tag}'...")
    collection = get_chroma_db(tag)
    collection.delete(ids=chroma_ids)

    if USE_CENTRAL_DB:
        central_collection = get_chroma_db(CENTRAL_TAG)
        central_collection.delete(ids=chroma_ids)
        
    print(f"✅ Deleted {len(chroma_ids)} chunks from collection '{tag}'.")

def format_sources(docs: list[Document]) -> list[str]:
    sources = []
    for doc in docs:
        file_name = doc.metadata.get("source", "unknown.pdf")
        page = doc.metadata.get("page", "?")
        sources.append(f"{file_name} (page {page})")
    return list(set(sources))