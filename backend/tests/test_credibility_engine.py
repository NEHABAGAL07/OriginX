from app.services.credibility_engine import generate_verification_result


def test_generate_verification_result_true_with_multiple_trusted_sources() -> None:
    articles = [
        {"source": "Reuters", "title": "Major update", "description": "Authorities issued details.", "similarity_score": 82},
        {"source": "BBC News", "title": "City briefing", "description": "Officials shared findings.", "similarity_score": 77},
        {"source": "Associated Press", "title": "Public safety note", "description": "Data was corroborated.", "similarity_score": 64},
    ]

    result = generate_verification_result("sample claim", articles)

    assert result["verification_result"] == "true"
    assert result["verdict"] == "Likely true"
    assert result["credibility_score"] >= 80
    assert len(result["top_credible_articles"]) >= 3
    assert result["top_credible_articles"][0]["source"] == "Reuters"


def test_generate_verification_result_false_with_no_trusted_sources() -> None:
    articles = [
        {"source": "Unknown Blog", "title": "Rumor post", "description": "Unverified thread.", "similarity_score": 90},
        {"source": "Forum Post", "title": "Discussion", "description": "Community comments.", "similarity_score": 60},
    ]

    result = generate_verification_result("sample claim", articles)

    assert result["verification_result"] == "false"
    assert result["verdict"] == "Likely false or unsupported"
    assert result["credibility_score"] == 20
    assert result["top_credible_articles"] == []
