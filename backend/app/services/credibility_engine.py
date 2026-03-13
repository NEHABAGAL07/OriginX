from typing import Any


_TRUSTED_SOURCES = {
    "reuters",
    "associated press",
    "ap news",
    "bbc",
    "the guardian",
    "al jazeera",
    "bloomberg",
    "financial times",
    "new york times",
    "the washington post",
    "npr",
    "cnn",
    "abc news",
    "cbs news",
    "nbc news",
}


def _is_trusted_source(source_name: str) -> bool:
    normalized = source_name.lower().strip()
    return any(trusted_name in normalized for trusted_name in _TRUSTED_SOURCES)


def _safe_similarity_score(article: dict[str, Any]) -> int:
    try:
        return int(article.get("similarity_score", 0))
    except (TypeError, ValueError):
        return 0


def _is_high_similarity(article: dict[str, Any]) -> bool:
    return _safe_similarity_score(article) >= 60


def select_top_credible_articles(articles: list[dict[str, Any]], limit: int = 3) -> list[dict[str, Any]]:
    credible_articles = [
        article
        for article in articles
        if _is_trusted_source(str(article.get("source", ""))) and _is_high_similarity(article)
    ]
    credible_articles.sort(key=_safe_similarity_score, reverse=True)
    return credible_articles[:limit]


def generate_verification_result(claim_text: str, articles: list[dict[str, Any]]) -> dict[str, Any]:
    trusted_articles = [article for article in articles if _is_trusted_source(str(article.get("source", "")))]
    trusted_count = len(trusted_articles)
    top_credible_articles = select_top_credible_articles(articles)

    if trusted_count >= 3:
        verification_result = "true"
        verdict = "Likely true"
        credibility_score = min(95, 80 + ((trusted_count - 3) * 5))
    elif trusted_count >= 1:
        verification_result = "false"
        verdict = "Likely false or unverified"
        credibility_score = 45 + (trusted_count * 10)
    else:
        verification_result = "false"
        verdict = "Likely false or unsupported"
        credibility_score = 20

    return {
        "claim": claim_text,
        "verification_result": verification_result,
        "verdict": verdict,
        "credibility_score": credibility_score,
        "top_credible_articles": top_credible_articles,
    }
