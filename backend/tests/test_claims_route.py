from tests.conftest import create_test_client


def test_verify_claim_no_history(monkeypatch) -> None:
    from app.routes import claims as route_module

    captured: dict[str, str] = {}

    def _fake_insert_claim(claim_text: str):
        captured["claim_text"] = claim_text
        return {"id": "1", "claim_text": claim_text}

    monkeypatch.setattr(route_module, "check_verification_history", lambda _claim_text: None)
    monkeypatch.setattr(route_module, "insert_claim", _fake_insert_claim)
    monkeypatch.setattr(
        route_module,
        "search_news_sources",
        lambda _claim_text: {
            "articles_found": 1,
            "articles": [
                {
                    "source": "Reuters",
                    "title": "City water supply update",
                    "url": "https://example.com/1",
                    "description": "desc",
                    "similarity_score": 80,
                }
            ],
        },
    )

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "  The CITY   Water Supply  "})

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_found",
        "message": "No history found. Proceeding to verification pipeline.",
        "claim": "the city water supply",
        "news_lookup": {
            "articles_found": 1,
            "articles": [
                {
                    "source": "Reuters",
                    "title": "City water supply update",
                    "url": "https://example.com/1",
                    "description": "desc",
                    "similarity_score": 80,
                }
            ],
        },
    }
    assert captured["claim_text"] == "the city water supply"


def test_verify_claim_history_found(monkeypatch) -> None:
    from app.routes import claims as route_module

    def _should_not_call(_claim_text: str):
        raise AssertionError("search_news_sources should not be called when history exists")

    monkeypatch.setattr(
        route_module,
        "check_verification_history",
        lambda _claim_text: {
            "verification_result": "false",
            "credibility_score": 22,
            "summary": "Authorities confirmed the water supply is safe.",
        },
    )
    monkeypatch.setattr(route_module, "insert_claim", lambda claim_text: {"id": "1", "claim_text": claim_text})
    monkeypatch.setattr(route_module, "search_news_sources", _should_not_call)

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "The city water supply has been poisoned"})

    assert response.status_code == 200
    assert response.json() == {
        "status": "found",
        "verification_result": "false",
        "credibility_score": 22,
        "summary": "Authorities confirmed the water supply is safe.",
    }


def test_verify_claim_empty_after_normalization(monkeypatch) -> None:
    from app.routes import claims as route_module

    monkeypatch.setattr(route_module, "check_verification_history", lambda _claim_text: None)
    monkeypatch.setattr(route_module, "insert_claim", lambda claim_text: {"id": "1", "claim_text": claim_text})
    monkeypatch.setattr(route_module, "search_news_sources", lambda _claim_text: {"articles_found": 0, "articles": []})

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "   \n\t   "})

    assert response.status_code == 422
    assert "empty after normalization" in response.json()["detail"].lower()


def test_verify_claim_timeout(monkeypatch) -> None:
    from app.routes import claims as route_module

    def _raise_timeout(_claim_text: str):
        raise TimeoutError("timeout")

    monkeypatch.setattr(route_module, "check_verification_history", lambda _claim_text: None)
    monkeypatch.setattr(route_module, "insert_claim", _raise_timeout)
    monkeypatch.setattr(route_module, "search_news_sources", lambda _claim_text: {"articles_found": 0, "articles": []})

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "hello"})

    assert response.status_code == 504
    assert "timeout" in response.json()["detail"].lower()


def test_verify_claim_no_history_newsapi_unavailable(monkeypatch) -> None:
    from app.routes import claims as route_module

    monkeypatch.setattr(route_module, "check_verification_history", lambda _claim_text: None)
    monkeypatch.setattr(route_module, "insert_claim", lambda claim_text: {"id": "1", "claim_text": claim_text})

    def _raise_no_key(_claim_text: str):
        raise ValueError("NEWSAPI_KEY is not configured.")

    monkeypatch.setattr(route_module, "search_news_sources", _raise_no_key)

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "hello"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "not_found"
    assert payload["news_lookup"]["articles_found"] == 0
    assert "warning" in payload["news_lookup"]
