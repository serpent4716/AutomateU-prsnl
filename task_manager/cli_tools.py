import argparse
import os
import uuid
import sys
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema.document import Document
# Add the parent directory to the path to allow imports from 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils import populate_database as populate_db
from app.database import DATABASE_URL # Import the default URL as a fallback

# Load environment variables from a .env file
load_dotenv()

import re


SQLALCHEMY_DATABASE_URL = DATABASE_URL
def main():
    # Securely get the database URL from environment variables, with a fallback
    db_url = os.getenv("DATABASE_URL", SQLALCHEMY_DATABASE_URL)
    if not db_url:
        print("Error: DATABASE_URL environment variable not set.")
        sys.exit(1)

    parser = argparse.ArgumentParser(description="CLI for managing the document database.")
    
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Sub-parser for the 'add' command
    add_parser = subparsers.add_parser("add", help="Add a new document to the database.")
    add_parser.add_argument("--file", type=str, required=True, help="Path to the single PDF file to upload.")
    add_parser.add_argument("--tag", type=str, required=True, help="Tag to associate with the document.")
    add_parser.add_argument("--user", type=str, default="cli_user", help="User ID to associate with the document.")
   
    # Sub-parser for the 'query' command
    query_parser = subparsers.add_parser("query", help="Query the database with a question.")
    query_parser.add_argument("--tag", type=str, default="central", help="The tag to query against.")
    query_parser.add_argument("question", type=str, help="The question to ask.")

    show_parser = subparsers.add_parser("show", help="Show the content of the central database.")
    show_parser.add_argument("--tag", type=str, default="central", help="The tag to show (default: 'central').")
    
    show_praser = subparsers.add_parser("change", help= "Change the content of the database/specific tag.")
    show_praser.add_argument("--tag", type=str, default="central", help="The tag to change (default: 'central').")
    
    
    args = parser.parse_args()

    if args.command == "add":
        print(f"📥 Adding file '{args.file}' under tag: '{args.tag}' for user: '{args.user}'")
        if not os.path.exists(args.file):
            print(f"Error: File not found at {args.file}")
            sys.exit(1)
        
        doc_id = str(uuid.uuid4())
        # The CLI now runs the ingestion synchronously for immediate feedback
        populate_db.run_ingestion_pipeline(db_url, doc_id, args.file, args.tag, args.user)
        print(f"✅ Processing complete for doc_id: {doc_id}")

    elif args.command == "query":
        print(f"🤖 Asking model with query: '{args.question}' in tag: '{args.tag}'")
        result = populate_db.query(args.tag, args.question)
        print("\n--- ANSWER ---")
        print(result['answer'])
        print("\n--- SOURCES ---")
        print(result['sources'])

    elif args.command == "show":
        sys.stdout = sys.__stdout__  # Reset stdout to default
        sys.stdout = open("output.txt", "w", encoding="utf-8")  # Redirect output to a file
        print(f"=== DATABASE INFO ({'central' if not args.tag else f'tag: {args.tag}'}) ===")
        db = populate_db.get_chroma_db(args.tag)
        
        results = db.get()
        print(f"Documents: {len(results['documents'])}")
        print(f"IDs: {len(results['ids'])}")
        print(f"Metadatas: {len(results['metadatas'])}\n")

        for i, (doc_id, document, metadata) in enumerate(zip(results['ids'], results['documents'], results['metadatas'])):
            print(f"--- Document {i+1} ---")
            print(f"ID: {doc_id}")
            print(f"Metadata: {metadata}")
            print(f"Preview: {populate_db.clean_and_flatten(document)}")
            print(f"Length: {len(document)} characters\n")
            print(f"--- End of Document {i+1} ---\n")
            # if i >= 4:
            #     print(f"... and {len(results['documents']) - 5} more documents")
            # break
        sys.stdout.close()
    elif args.command == "change":
        print(f"🔄 Changing content of the database for tag: '{args.tag}'")
        db = populate_db.get_chroma_db(args.tag)
        results = db.get()

        if not results['documents']:
            print("No documents found in the database.")
            return

        while True:
            print("\n--- Available Documents ---")
            seen_doc_ids = set()
            for i, (doc_id, document, metadata) in enumerate(zip(results['ids'], results['documents'], results['metadatas'])):
                current_doc_id = metadata.get("doc_id")
                if current_doc_id not in seen_doc_ids:
                    print(f"{i + 1}. doc_id: {current_doc_id} | source: {metadata.get('source')} | preview: {populate_db.clean_and_flatten(document)[:100]}...")
                    seen_doc_ids.add(current_doc_id)

            print("\nEnter the index of the document you want to reprocess (or 'exit' to quit):")
            doc_index = input("Document index: ").strip()
            if doc_index.lower() == 'exit':
                print("Exiting the change operation.")
                return

            if not doc_index.isdigit():
                print("❌ Invalid input. Please enter a valid number.")
                continue

            doc_index = int(doc_index) - 1
            if doc_index < 0 or doc_index >= len(seen_doc_ids):
                print("❌ Index out of range. Try again.")
                continue

            selected_doc_id = list(seen_doc_ids)[doc_index]
            print(f"✅ You selected doc_id: {selected_doc_id}")
            print("🔄 Reprocessing and replacing chunks...\n")

            # Prepare reprocessed chunks
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=800,
                chunk_overlap=80,
                separators=["\n\n", "\n", ".", " "],
                length_function=len
            )

            new_chunks, new_metadatas, new_ids = [], [], []

            for doc_id, content, metadata in zip(results['ids'], results['documents'], results['metadatas']):
                if metadata.get("doc_id") != selected_doc_id:
                    continue

                cleaned = populate_db.clean_and_flatten(content)
                corrected = populate_db.correct_text(cleaned)
                confidence = populate_db.compute_confidence(corrected)

                if confidence < 0.65:
                    print(f"⚠️  Page {metadata.get('page')}, low confidence ({confidence:.2f}). Sending to LLM...")
                    try:
                        corrected = populate_db.correct_with_llm(corrected)
                    except Exception as e:
                        print(f"❌ LLM correction failed: {e}")

                sub_chunks = splitter.split_text(corrected)
                for i, chunk in enumerate(sub_chunks):
                    new_id = f"{selected_doc_id}_v2_{metadata['page']}_{i}"
                    new_chunks.append(chunk)
                    new_metadatas.append(metadata)
                    new_ids.append(new_id)

            if not new_chunks:
                print("⚠️ No new chunks created.")
                return

            # Remove old chunks with the same doc_id
            print("🧹 Removing old chunks from DB...")
            db._collection.delete(where={"metadata.doc_id": {"$eq": selected_doc_id}})

            # Add new ones
            print(f"💾 Adding {len(new_chunks)} updated chunks...")
            db.add_texts(texts=new_chunks, metadatas=new_metadatas, ids=new_ids)

            print("✅ Document reprocessed and updated successfully.")
            break


if __name__ == "__main__":
    
    main()
   
    
