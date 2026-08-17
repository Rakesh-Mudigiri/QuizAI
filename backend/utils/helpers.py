"""
Utility helpers — filename sanitization, validators.
"""
import re
import os
import unicodedata


def sanitize_filename(filename: str) -> str:
    """Remove unsafe characters from an uploaded filename."""
    # Normalize unicode
    filename = unicodedata.normalize("NFKD", filename)
    filename = filename.encode("ascii", "ignore").decode("ascii")
    # Keep only safe characters
    filename = re.sub(r"[^\w\s\-.]", "", filename)
    filename = re.sub(r"\s+", "_", filename.strip())
    # Prevent path traversal
    filename = os.path.basename(filename)
    return filename or "uploaded_file.pdf"


def is_valid_question_type(qt: str) -> bool:
    return qt in {"MCQ", "True/False", "Short Answer", "Mixed"}


def is_valid_difficulty(d: str) -> bool:
    return d in {"Easy", "Medium", "Hard", "Mixed"}


def clamp_question_count(n: int) -> int:
    return max(1, min(n, 30))
