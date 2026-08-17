"""
PDF processing service — text extraction using PyMuPDF.
"""
import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract readable text from a PDF file using PyMuPDF.
    Raises ValueError if the PDF has no extractable text.
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise RuntimeError("PyMuPDF (fitz) is not installed. Run: pip install pymupdf")

    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    doc = fitz.open(str(path))
    if doc.page_count == 0:
        doc.close()
        raise ValueError("The uploaded PDF has no pages.")

    all_text = []
    for page_num in range(doc.page_count):
        page = doc[page_num]
        text = page.get_text("text")
        if text.strip():
            all_text.append(text)

    doc.close()

    if not all_text:
        raise ValueError(
            "This PDF does not contain readable text. "
            "Please upload a text-based PDF (not a scanned image)."
        )

    combined = "\n".join(all_text)
    return clean_text(combined)


def clean_text(text: str) -> str:
    """
    Basic text cleaning:
    - Collapse excessive whitespace/blank lines
    - Remove null bytes
    - Trim to a safe max length for Gemini context
    """
    # Remove null bytes
    text = text.replace("\x00", "")
    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse runs of blank lines to at most two
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Collapse runs of spaces/tabs (but not newlines)
    text = re.sub(r"[ \t]+", " ", text)
    # Strip each line
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(lines)
    text = text.strip()

    # Limit to ~15 000 characters to keep Gemini prompt reasonable
    max_chars = 15_000
    if len(text) > max_chars:
        logger.info("PDF text truncated from %d to %d chars", len(text), max_chars)
        text = text[:max_chars] + "\n\n[... content truncated for processing ...]"

    return text
