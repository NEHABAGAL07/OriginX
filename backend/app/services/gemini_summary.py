from typing import Any

import requests

from app.config import settings

_GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"


def _fallback_summary(top_articles: list[dict[str, Any]]) -> str:
    if not top_articles:
        return "No high-credibility, high-similarity news was available for summary generation."

    parts: list[str] = []
    for article in top_articles[:3]:
        source = str(article.get("source", "Unknown source")).strip() or "Unknown source"
        title = str(article.get("title", "")).strip()
        description = str(article.get("description", "")).strip()
        if title and description:
            parts.append(f"{source}: {title}. {description}")
        elif title:
            parts.append(f"{source}: {title}")
        elif description:
            parts.append(f"{source}: {description}")
    return " ".join(parts) if parts else "High-credibility articles were found, but details were limited."


def generate_evidence_summary(claim_text: str, top_articles: list[dict[str, Any]]) -> str:
    if not top_articles:
        return _fallback_summary(top_articles)

    if not settings.GOOGLE_AI_STUDIO_API_KEY:
        return _fallback_summary(top_articles)

    endpoint = f"{_GEMINI_API_ROOT}/{settings.GEMINI_MODEL}:generateContent"

    evidence_lines: list[str] = []
    for article in top_articles[:3]:
        source = str(article.get("source", "Unknown source"))
        title = str(article.get("title", "")).strip()
        description = str(article.get("description", "")).strip()
        score = article.get("similarity_score", 0)
        evidence_lines.append(
            f"Source: {source}\nSimilarity: {score}\nTitle: {title}\nDescription: {description}"
        )

    prompt = (
        "You are summarizing evidence for a fact-checking system. "
        "Use only the provided news evidence and do not add outside information. "
        "Write one concise paragraph of 2-4 sentences. "
        "Do not mention any credibility score, and do not output verdict labels.\n\n"
        f"Claim: {claim_text}\n\n"
        "Top high-credibility and high-similarity news:\n"
        + "\n\n".join(evidence_lines)
    )

    payload: dict[str, Any] = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 220,
        },
    }

    try:
        response = requests.post(
            endpoint,
            params={"key": settings.GOOGLE_AI_STUDIO_API_KEY},
            json=payload,
            timeout=20,
        )
        response.raise_for_status()
        body = response.json()
    except requests.RequestException:
        return _fallback_summary(top_articles)

    candidates = body.get("candidates", [])
    if not candidates:
        return _fallback_summary(top_articles)

    parts = ((candidates[0].get("content") or {}).get("parts") or [])
    text_segments = [str(part.get("text", "")).strip() for part in parts if str(part.get("text", "")).strip()]
    if not text_segments:
        return _fallback_summary(top_articles)

    return "\n".join(text_segments)
