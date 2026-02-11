import re
from typing import Optional

_BANNED_TERMS = {
    "fuck", "fucking", "shit", "bitch", "bastard", "asshole",
    "nude", "porn", "nsfw", "sex", "boobs", "dick", "pussy"
}

_ALLOWED_UPLOAD_CONTENT_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z0-9]+", (text or "").lower()))


def contains_vulgar_text(text: str) -> bool:
    tokens = _tokenize(text)
    return any(term in tokens for term in _BANNED_TERMS)


def is_disallowed_image_upload(content_type: Optional[str], filename: Optional[str]) -> bool:
    ctype = (content_type or "").lower()
    if ctype.startswith("image/"):
        return True
    lowered_name = (filename or "").lower()
    image_exts = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg")
    return lowered_name.endswith(image_exts)


def is_supported_rag_upload(content_type: Optional[str], filename: Optional[str]) -> bool:
    if is_disallowed_image_upload(content_type, filename):
        return False
    ctype = (content_type or "").lower()
    if ctype in _ALLOWED_UPLOAD_CONTENT_TYPES:
        return True
    lowered_name = (filename or "").lower()
    return lowered_name.endswith((".pdf", ".txt", ".docx"))
