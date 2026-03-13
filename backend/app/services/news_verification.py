import re
from typing import Any

import requests

from app.config import settings

_NEWSAPI_ENDPOINT = "https://newsapi.org/v2/everything"


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _similarity_score(claim_text: str, article_text: str) -> int:
    claim_tokens = _tokenize(claim_text)
    article_tokens = _tokenize(article_text)

    if not claim_tokens or not article_tokens:
        return 0

    overlap = len(claim_tokens.intersection(article_tokens))
    score = int((overlap / len(claim_tokens)) * 100)
    return max(0, min(score, 100))


def search_news_sources(claim_text: str) -> dict[str, Any]:
    if not settings.NEWSAPI_KEY:
        raise ValueError("NEWSAPI_KEY is not configured.")

    params = {
        "q": claim_text,
        "apiKey": settings.NEWSAPI_KEY,
        "language": "en",
        "sortBy": "relevancy",
        "pageSize": 10,
    }

    try:
        response = requests.get(_NEWSAPI_ENDPOINT, params=params, timeout=15)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        raise RuntimeError(f"NewsAPI request failed: {exc}") from exc

    raw_articles = payload.get("articles", [])
    articles: list[dict[str, Any]] = []

    for article in raw_articles:
        title = article.get("title") or ""
        description = article.get("description") or ""
        source_name = (article.get("source") or {}).get("name") or "Unknown"

        articles.append(
            {
                "source": source_name,
                "title": title,
                "description": description,
                "url": article.get("url") or "",
                "similarity_score": _similarity_score(claim_text, f"{title} {description}"),
            }
        )

    articles.sort(key=lambda item: item["similarity_score"], reverse=True)

    return {
        "articles_found": len(articles),
        "articles": articles,
    }
