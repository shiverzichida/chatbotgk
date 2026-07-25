#!/usr/bin/env python3
import os
import argparse
import sys

# Wrap Supabase in try-except to avoid raw ImportError traceback
try:
    from supabase import create_client, Client
except ImportError:
    print("\n" + "="*80)
    # Output clearly to stdout so the Next.js UI captures and displays this helpful setup message
    print("Error: Pustaka 'supabase' belum terinstal di lingkungan Python Anda.")
    print("Silakan jalankan perintah berikut di terminal Anda untuk menginstalnya:")
    print("  pip install supabase")
    print("="*80 + "\n")
    sys.exit(1)

def load_env_local(env_path: str):
    """Parse .env.local manually to remove python-dotenv library dependency."""
    if not os.path.exists(env_path):
        return
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                val = val.strip().strip("'").strip('"')
                os.environ[key.strip()] = val

def get_supabase_client() -> Client:
    """Initialize and return the Supabase client using environment variables."""
    # Load .env.local from the same directory as this script
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env.local')
    load_env_local(env_path)
    
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print(f"Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY harus terdefinisi di {env_path}")
        sys.exit(1)
        
    return create_client(url, key)

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150):
    """
    Segment the text into chunks of approx `chunk_size` characters, 
    with an overlap of `overlap` characters.
    """
    chunks = []
    start = 0
    text_length = len(text)
    
    if text_length <= chunk_size:
        return [text.strip()] if text.strip() else []
        
    while start < text_length:
        end = start + chunk_size
        
        if end >= text_length:
            chunk = text[start:text_length].strip()
            if chunk:
                chunks.append(chunk)
            break
            
        # Try to break at a space near the end of the chunk to avoid splitting words
        last_space = text.rfind(' ', start, end)
        if last_space != -1 and last_space > start + overlap:
            end = last_space
            
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
            
        # Move start forward, accounting for overlap
        start = end - overlap
        
    return chunks

def extract_with_pypdf(pdf_path: str):
    """Fallback text extraction using pypdf."""
    try:
        import pypdf
    except ImportError:
        print("\nError: pypdf is not installed.")
        print("Please install it using 'pip install pypdf' to use standard text extraction.")
        sys.exit(1)
        
    print("Using pypdf for standard text extraction...")
    reader = pypdf.PdfReader(pdf_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            pages.append({"page_num": i + 1, "text": text})
    return pages

def extract_with_ocr(pdf_path: str):
    """Attempt OCR extraction, fallback to pypdf if libraries missing."""
    try:
        from paddleocr import PaddleOCR
        import fitz  # PyMuPDF
        from PIL import Image
        import io
        import numpy as np
        
        print("Using PaddleOCR for text extraction...")
        
        # Initialize PaddleOCR (assuming Indonesian language based on the project context)
        ocr = PaddleOCR(use_angle_cls=True, lang='id', show_log=False)
        doc = fitz.open(pdf_path)
        pages = []
        
        for i in range(len(doc)):
            page = doc.load_page(i)
            # Render page to an image
            pix = page.get_pixmap(alpha=False)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            img_np = np.array(img)
            
            # Perform OCR
            result = ocr.ocr(img_np, cls=True)
            text = ""
            if result and result[0]:
                for line in result[0]:
                    # line[1][0] contains the detected text
                    text += line[1][0] + " "
                    
            pages.append({"page_num": i + 1, "text": text.strip()})
        return pages
        
    except ImportError:
        print("\n" + "="*80)
        print("Notice: Heavy OCR libraries (paddleocr, PyMuPDF, etc.) are not installed.")
        print("If you want robust OCR on scanned PDFs, install them using:")
        print("  pip install paddleocr paddlepaddle PyMuPDF Pillow numpy")
        print("  (or try: pip install unlimited-ocr)")
        print("\nFalling back to standard developer-friendly text extraction (pypdf)...")
        print("="*80 + "\n")
        return extract_with_pypdf(pdf_path)

def process_and_upload(pdf_path: str, chapter_title: str, client: Client):
    """Extract, chunk, and upload PDF content to Supabase."""
    pages_data = extract_with_ocr(pdf_path)
    
    if not pages_data:
        print("No text could be extracted from the PDF.")
        return
        
    total_chunks_uploaded = 0
    
    for page_info in pages_data:
        page_num = page_info["page_num"]
        text = page_info["text"]
        
        chunks = chunk_text(text, chunk_size=800, overlap=150)
        if not chunks:
            continue
            
        supabase_chunks = []
        for chunk in chunks:
            supabase_chunks.append({
                "content": chunk,
                "chapter_title": chapter_title,
                "page_start": page_num
            })
            
        # Upload to Supabase document_chunks table
        try:
            client.table("document_chunks").insert(supabase_chunks).execute()
            print(f"Uploaded page {page_num}: {len(supabase_chunks)} chunks")
            total_chunks_uploaded += len(supabase_chunks)
        except Exception as e:
            print(f"Error uploading chunks for page {page_num}: {e}")
            
    print(f"\nCompleted! Total chunks uploaded: {total_chunks_uploaded}")

def main():
    parser = argparse.ArgumentParser(description="Ingest PDF text into Supabase via OCR or standard text extraction.")
    parser.add_argument("--pdf", required=True, help="Path to the PDF file (e.g. path/to/book.pdf)")
    parser.add_argument("--chapter", default="", help="Optional chapter title (e.g. \"Bab 1\")")
    args = parser.parse_args()
    
    if not os.path.exists(args.pdf):
        print(f"Error: PDF file '{args.pdf}' not found.")
        sys.exit(1)
        
    print("Initializing Supabase client...")
    supabase = get_supabase_client()
    
    print(f"Processing PDF: {args.pdf}")
    if args.chapter:
        print(f"Chapter Title: {args.chapter}")
        
    process_and_upload(args.pdf, args.chapter, supabase)

if __name__ == "__main__":
    main()
