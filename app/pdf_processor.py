
from pypdf import PdfReader
from io import BytesIO

from app.config import CHUNK_SIZE, CHUNK_OVERLAP


def extract_pdf_pages(file_bytes):

    reader = PdfReader(BytesIO(file_bytes))

    pages = []

    for page_number, page in enumerate(reader.pages, start=1):

        text = page.extract_text() or ""

        text = text.strip()

        if text:
            pages.append({
                "page": page_number,
                "text": text
            })

    return pages


def split_text(text):

    words = text.split()

    chunks = []

    start = 0

    step = CHUNK_SIZE - CHUNK_OVERLAP

    while start < len(words):

        end = start + CHUNK_SIZE

        chunk = " ".join(words[start:end])

        if chunk.strip():
            chunks.append(chunk)

        start += step

    return chunks


def process_pdf(file_bytes):

    pages = extract_pdf_pages(file_bytes)

    processed_chunks = []

    for page in pages:

        chunks = split_text(page["text"])

        for chunk_index, chunk in enumerate(chunks):

            processed_chunks.append({
                "text": chunk,
                "page": page["page"],
                "chunk_index": chunk_index
            })

    return processed_chunks
