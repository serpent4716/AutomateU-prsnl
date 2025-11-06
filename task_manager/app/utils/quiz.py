from app.utils.populate_database import *
import json
import textwrap
import google.generativeai as genai

from dotenv import load_dotenv
load_dotenv()

def _build_page_topic_map(toc: list, total_pages: int) -> list:
    """
    Builds a 0-indexed list where each index corresponds to a page number
    and the value is the topic title for that page.
    
    The 'toc' list from fitz is like: [[level, title, page_num], ...]
    """
    # 1. Create a default map for all pages
    page_map = ["Introduction"] * total_pages
    if not toc:
        return page_map

    # 2. Create a sparse map of {page_index: "composite_title"}
    # We build composite titles for hierarchy (e.g., "Chapter 1: Section 1.1")
    sparse_topic_map = {}
    current_headings = {}  # Tracks the title at each level {1: "Chap 1", 2: "Sec 1.1"}

    for level, title, page_num in toc:
        page_index = page_num - 1  # Convert 1-based page num to 0-based index

        # Skip invalid entries
        if page_index < 0 or page_index >= total_pages:
            continue

        # Store this level's title
        current_headings[level] = title
        
        # Create composite title (e.g., "Chap 1: Sec 1.1")
        composite_title = ": ".join(
            current_headings[i]
            for i in sorted(current_headings.keys())
            if i <= level
        )
        
        # Store the most specific topic for that page
        sparse_topic_map[page_index] = composite_title

    # 3. Fill in the full map for all pages
    current_topic = "Introduction"
    for i in range(total_pages):
        if i in sparse_topic_map:
            current_topic = sparse_topic_map[i]
        page_map[i] = current_topic
        
    return page_map

def process_quiz_document(file_content: bytes, file_name: str, doc_id: str, user_id: str) -> list[Document]:
    documents = []

    try:
        pdf_doc = fitz.open(stream=file_content, filetype="pdf")
        toc = pdf_doc.get_toc() #
        total_pages = pdf_doc.page_count #
        page_topic_map = _build_page_topic_map(toc, total_pages)
        raw_pages = []
        for page_num, page in enumerate(pdf_doc, start=1):
            text = page.get_text()
            raw_pages.append((page_num, text))

        # Header/footer cleaning
        cleaned_pages = remove_repeating_headers_footers([t for _, t in raw_pages])

        for idx, text in enumerate(cleaned_pages, start=1):
            current_topic = page_topic_map[idx - 1]
            full_text = clean_and_flatten(text)
            full_text = correct_text(full_text)

            doc = Document(
                page_content=full_text,
                metadata={
                    "source": file_name,
                    "doc_id": doc_id,
                    "user_id": user_id,
                    "page": idx,  # exact page number
                    "topic": current_topic
                }
            )
            documents.append(doc)

        pdf_doc.close()
        return documents

    except Exception as e:
        print(f"Error processing document {file_name}: {e}")
        return []


def run_quiz_ingestion_pipeline(db_url: str, doc_id: str, file_path: str, tag: str, user_id: str):
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
        documents = process_quiz_document(file_content, file_name, doc_id, user_id)
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
        
        print(f"BACKGROUND TASK: Closing DB session for doc_id: {doc_id}.")
        db.close()


# In your quiz_generator.py or main.py


# Assume 'genai' is already configured with your API key
# genai.configure(api_key="YOUR_API_KEY")

def build_prompt(content: str, settings: dict) -> str:
    """
    Builds the token-efficient prompt for the LLM.
    Removes leading whitespace for token efficiency.
    """
    prompt_template = f"""
        Generate a quiz in JSON format based on the following settings and content. Your entire response must be ONLY the raw JSON object, starting with {{ and ending with }}.

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
    
    dedented_template = textwrap.dedent(prompt_template)

    return dedented_template

def quiz_generation(content: str, settings: dict) -> dict:
    """
    Generates a quiz by calling the Gemini API and parses the JSON response.
    """
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    config = genai.types.GenerationConfig(
        # response_mime_type="application/json", # Use this to enforce JSON output!
        temperature=0.2,
        max_output_tokens=1500
    )

    prompt = build_prompt(content, settings)
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=config
        )
        
        cleaned_text = response.text.strip().replace('```json', '').replace('```', '')
        data = json.loads(cleaned_text)
        print("[INFO] Successfully received and parsed data from Gemini.")
    except json.JSONDecodeError:
        # Handle cases where the model response is not valid JSON
        raise ValueError("Failed to decode JSON from the model's response.")
    except Exception as e:
        # Handle other potential API errors (e.g., network, authentication)
        raise RuntimeError(f"An error occurred during API call: {e}")

    return data


def get_representative_chunks_for_quiz(tag: str, source_doc_id: str) -> str:
    """
    Connects to ChromaDB, finds all unique topics for a document,
    and returns a string of 2 representative chunks from each topic.
    """
    
    # 1. Get the collection
    try:
        chroma_db = get_chroma_db(tag)
    except Exception as e:
        print(f"Error connecting to ChromaDB for tag {tag}: {e}")
        return "" # Return empty string on error

    # 2. First, get all metadata to find the unique topics
    # We use .get() for this, as we only need the metadata, not the text.
    try:
        metadata_results = chroma_db.get(
            where={"doc_id": source_doc_id},
            include=["metadatas"] # Only fetch metadata, this is very fast
        )
    except Exception as e:
        print(f"Error getting metadata for doc_id {source_doc_id}: {e}")
        return ""

    if not metadata_results['metadatas']:
        print(f"No metadata found for doc_id {source_doc_id}")
        return "" # No chunks found for this document

    # Use a set to find all unique topic names
    unique_topics = set(meta['topic'] for meta in metadata_results['metadatas'])
    
    print(f"Found {len(unique_topics)} unique topics: {unique_topics}")

    # 3. Now, loop through each topic and query for 2 relevant chunks
    final_chunks = []
    for topic in unique_topics:
        
        # We use .similarity_search() here to find chunks *about* the topic.
        # We use the topic name itself as the search query!
        topic_chunks = chroma_db.similarity_search(
            query=topic,  # Use the topic string (e.g., "Chapter 1: Quantum Physics") as the search query
            k=3,          # Get the top 2 chunks for this topic
            filter={      # IMPORTANT: Filter to *only* search within our document AND topic
                "$and": [
                    {"doc_id": source_doc_id},
                    {"topic": topic}
                ]   
            } 
        )
        
        for chunk in topic_chunks:
            final_chunks.append(chunk.page_content) # chunk.page_content is the text

    # 4. Combine and return
    if not final_chunks:
        print("No chunks found after topic search. Using fallback.")
        # Fallback: just get the first 10 chunks if topic search fails
        all_chunks = chroma_db.get(where={"doc_id": source_doc_id}, limit=10, include=["documents"])
        return "\n\n".join(all_chunks['documents'])

    return "\n\n".join(final_chunks)

# --- How you would call this in your main.py ---
# content_for_llm = get_representative_chunks_for_quiz(
#     tag=document_tag, 
#     source_doc_id=source_document_id
# )
# if content_for_llm:
#     generated_data = quiz_generation(content_for_llm, quiz_settings.dict())
# ...