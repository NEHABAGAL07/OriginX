from app.config import settings
from app.services.news_verification import search_news_sources
from requests import HTTPError, RequestException


class _FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise HTTPError(f"HTTP {self.status_code}")

    def json(self):
        return self._payload


def test_search_news_sources_success(monkeypatch) -> None:
    monkeypatch.setattr(settings, "NEWSAPI_KEY", "demo-key")

    payload = {
        "articles": [
            {
                "source": {"name": "Reuters"},
                "title": "City says water supply is safe",
                "description": "Authorities deny poisoning rumors",
                "url": "https://example.com/reuters-1",
            },
            {
                "source": {"name": "Local News"},
                "title": "Sports update",
                "description": "Team wins match",
                "url": "https://example.com/local-2",
            },
        ]
    }

    def _fake_get(*args, **kwargs):
        return _FakeResponse(payload)

    monkeypatch.setattr("app.services.news_verification.requests.get", _fake_get)

    result = search_news_sources("city water supply poisoned")

    assert result["articles_found"] == 2
    assert result["articles"][0]["source"] == "Reuters"
    assert "similarity_score" in result["articles"][0]


def test_search_news_sources_missing_key(monkeypatch) -> None:
    monkeypatch.setattr(settings, "NEWSAPI_KEY", "")

    try:
        search_news_sources("test claim")
    except ValueError as exc:
        assert "NEWSAPI_KEY" in str(exc)
    else:
        raise AssertionError("Expected ValueError when NEWSAPI_KEY is missing")


def test_search_news_sources_request_failure(monkeypatch) -> None:
    monkeypatch.setattr(settings, "NEWSAPI_KEY", "demo-key")

    def _fake_get(*args, **kwargs):
        raise RequestException("network down")

    monkeypatch.setattr("app.services.news_verification.requests.get", _fake_get)

    try:
        search_news_sources("test claim")
    except RuntimeError as exc:
        assert "NewsAPI request failed" in str(exc)
    else:
        raise AssertionError("Expected RuntimeError on request failure")
