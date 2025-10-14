from google.cloud import vision
import fitz  # PyMuPDF
import re
import nbformat
import base64
from nbclient import NotebookClient
from collections import Counter
from nltk.corpus import words
from rapidfuzz import process
import nltk
import os
import json
from google import genai

from dotenv import load_dotenv
load_dotenv()

try:
    _ = words.words()
except LookupError:
    nltk.download("words")
english_vocab = set(w.lower() for w in words.words())
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

def process_document(file_content: bytes) -> str:
    """
    Process a PDF and return the entire cleaned text as a single string.
    Only requires the raw PDF file bytes.
    """

    try:
        pdf_doc = fitz.open(stream=file_content, filetype="pdf")
        raw_pages = []

        # Extract text (with OCR fallback)
        for page_num, page in enumerate(pdf_doc, start=1):
            text = page.get_text()
            if len(text.strip()) < 100:
                text = ocr_page(page)  # assumes you already have this
            raw_pages.append((page_num, text))

        # Header/footer cleaning
        cleaned_pages = remove_repeating_headers_footers([t for _, t in raw_pages])

        # Cleaning + correction
        final_texts = []
        for idx, text in enumerate(cleaned_pages, start=1):
            full_text = clean_and_flatten(text)   # assumes you already have this
            full_text = correct_text(full_text)   # assumes you already have this

            confidence = compute_confidence(full_text)  # assumes you already have this
            if confidence < 0.5:
                print(f"⚠️ Low confidence on page {idx} ({confidence:.2f}) — running LLM correction.")
                full_text = correct_with_llm(full_text)

            final_texts.append(full_text)

        pdf_doc.close()

        # Merge all pages into one string
        return "\n\n".join(final_texts)

    except Exception as e:
        print(f"Error processing PDF: {e}")
        return ""

    
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
    
def correct_with_llm(original_text: str) -> str:
    """
    Cleans and corrects OCR-scanned text using Google's Gemini model.
    - Fixes spelling/grammar
    - Merges broken sentences
    - Preserves technical terms
    """

    # Define correction prompt
    prompt = f"""
    You are an assistant that helps clean up OCR-scanned educational text. Your job is to:
    - Fix spelling and grammar issues
    - Merge broken sentences
    - Preserve technical terms like "XOR", "MAC", "UDP", etc.
    - DO NOT change any facts or hallucinate content

    Original Text:
    {original_text}
    """

    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("❌ GEMINI_API_KEY not found in environment variables.")

        client = genai.Client(api_key=api_key)

        

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        cleaned_text = response.text.strip()
        return cleaned_text if cleaned_text else original_text

    except Exception as e:
        print(f"❌ Gemini correction failed: {e}")
        return original_text
    
# def obj_theory_conclusion(query: str) -> dict:
#     """
#     Generates objective, theory, and conclusion for a technical problem statement.
#     Returns a dictionary with keys: 'objective', 'theory', 'conclusion'.
#     """
#     prompt = f"""
#     You are an assistant that generates structured technical summaries.  

#     Respond ONLY as valid JSON, following this schema exactly:  

#     {
#     "objective": "One concise paragraph. Begin with a verb (e.g., 'to measure...', 'to analyze...').",
#     "problem_statements": ["List of distinct problem statements, each starting with an action verb."],
#     "theory": "One or more paragraphs. Relevant, to the point, include formulae if applicable.",
#     "conclusion": "2–3 sentences, natural tone, summarizing analysis and execution.",
#     "references": [
#     {"title": "string", "url": "https://valid.public.resource"}]
#     }

#     Rules:
#     - Do not include any text outside the JSON.
#     - The 'objective' must be a single paragraph, not a list.
#     - The 'problem_statements' must be different from the objective.
#     - Theory should explain underlying concepts clearly (not restating the objective).
#     - References must point to real, publicly accessible educational resources 
#     (Wikipedia, universities, GeeksforGeeks, tutorials, research papers).  

#     Problem statement to summarize: "{query}"

#     """
#     try:
#         api_key = os.getenv("GEMINI_API_KEY")
#         if not api_key:
#             raise ValueError("❌ GEMINI_API_KEY not found in environment variables.")

#         client = genai.Client(api_key=api_key)

#         contents = [
#             types.Content(
#                 role="user",
#                 parts=[types.Part.from_text(text=prompt)],
#             ),
#         ]

#         # Generate response
#         response = client.models.generate_content(
#             model="gemini-2.5-flash",
#             contents=contents,
#         )

#         # Try to parse JSON
#         try:
#             # Parse JSON
#             parsed = json.loads(response.text)

#             return {
#                 "objective": parsed.get("objective", "").strip(),
#                 "problem_statements": parsed.get("problem_statements", []),
#                 "theory": parsed.get("theory", "").strip(),
#                 "conclusion": parsed.get("conclusion", "").strip(),
#                 "references": parsed.get("references", []),
#             }

#         except json.JSONDecodeError:
#             print("⚠️ Gemini did not return valid JSON.")
#             return {"objective": "", "problem_statements": [], "theory": "", "conclusion": "", "references": []}
    

#     except Exception as e:
#         print(f"❌ Error generating response: {e}")
#         return {"objective": "", "problem_statements": [], "theory": "", "conclusion": "", "references": []}
    
# --------------------------
# 2. Summarization Function
# --------------------------
def summarize_experiment(query: str) -> dict:
    """
    Calls Gemini to produce structured JSON containing:
    objective, problem_statements, theory, conclusion, references
    """

    prompt = f"""
    You are an assistant that generates concise objective, theory, conclusions, and references for technical documents.

    Format your response STRICTLY as JSON with keys:
    - objective (a single paragraph)
    - problem_statements (JSON list of strings, each starts with an action verb like 'to measure', 'to analyze')
    - theory (detailed, include formulae if relevant, in paragraph form)
    - conclusion (2-3 sentences, natural tone)
    - references (a JSON list of objects with "title" and "url")

    Input query: "{query}"
    """

    response = genai.GenerativeModel("gemini-1.5-flash").generate_content(prompt)

    try:
        data = json.loads(response.text)
    except json.JSONDecodeError:
        raise ValueError("Gemini did not return valid JSON. Response was:\n" + response.text)

    return data


# --------------------------
# 3. Code Generation Function
# --------------------------
def generate_python_code(problem_statements: list[str]) -> list[dict]:
    """
    Calls Gemini to generate Python code for each problem statement.
    Always returns Python code (no language detection).
    """

    problems_text = "\n".join([f"{i+1}. {ps}" for i, ps in enumerate(problem_statements)])

    prompt = f"""
    You are an assistant that writes working Python code for technical problems.

    For each problem statement below:
    - Write Python code with correct indentation.
    - Do NOT wrap code in Markdown fences (no ```).
    - Use minimal comments.
    - Use standard libraries where possible.
    - If plotting is needed, use matplotlib.

    Problem statements:
    {problems_text}
    """

    response = genai.GenerativeModel("gemini-1.5-flash").generate_content(prompt)

    # Split response into code blocks
    code_blocks = [block.strip() for block in response.text.strip().split("\n\n") if block.strip()]

    results = []
    for ps, code in zip(problem_statements, code_blocks):
        results.append({
            "problem": ps,
            "language": "python",
            "code": code
        })

    return results


# --------------------------
# 4. Batched Notebook Runner
# --------------------------
def run_python_notebook(codes: list[dict]) -> dict:
    """
    Executes all Python code snippets in one Jupyter notebook.
    Captures stdout and plots for each.
    Returns dict keyed by problem statement.
    """

    # Create notebook with one cell per code block
    nb = nbformat.v4.new_notebook()
    for item in codes:
        nb.cells.append(nbformat.v4.new_code_cell(item["code"]))

    # Run the notebook
    client = NotebookClient(nb, timeout=30, kernel_name="python3")
    client.execute()

    # Collect outputs
    results = {}
    for i, cell in enumerate(nb.cells):
        ps = codes[i]["problem"]
        outputs = cell.get("outputs", [])
        stdout, images = "", []

        for out in outputs:
            if out["output_type"] == "stream":
                stdout += out.get("text", "")
            elif out["output_type"] == "display_data" and "image/png" in out["data"]:
                img_data = base64.b64decode(out["data"]["image/png"])
                images.append(img_data)

        results[ps] = {
            "code": codes[i]["code"],
            "stdout": stdout.strip(),
            "plots": images
        }

    return results