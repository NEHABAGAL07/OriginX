from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.domain_security import analyze_claim_urls, analyze_domain_risk
from app.services.news_verification import fetch_trending_daily_news
from app.services.propagation_analysis import analyze_propagation
from app.services.reddit_propagation import analyze_reddit_propagation

router = APIRouter(prefix="/analysis", tags=["analysis"])


class PropagationEvent(BaseModel):
    user_id: str = Field(min_length=1)
    claim_text: str = Field(min_length=1)
    timestamp: str | None = None
    narrative_key: str | None = None


class PropagationRequest(BaseModel):
    events: list[PropagationEvent] = Field(min_length=1)


class DomainSecurityRequest(BaseModel):
    claim_text: str | None = None
    url: str | None = None


class RedditPropagationRequest(BaseModel):
    query: str = Field(min_length=1)
    limit: int = 20
    include_comments: bool = True
    comments_per_post: int = 20
    sort: str = "new"
    time_filter: str = "week"


@router.post("/propagation")
def propagation_analysis(payload: PropagationRequest) -> dict[str, Any]:
    try:
        events = [event.model_dump() for event in payload.events]
        return analyze_propagation(events)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/domain-security")
def domain_security_analysis(payload: DomainSecurityRequest) -> dict[str, Any]:
    if payload.url:
        return {"results": [analyze_domain_risk(payload.url)]}

    if payload.claim_text:
        return {"results": analyze_claim_urls(payload.claim_text)}

    raise HTTPException(status_code=422, detail="Provide either url or claim_text.")


@router.post("/reddit-propagation")
def reddit_propagation_analysis(payload: RedditPropagationRequest) -> dict[str, Any]:
    try:
        return analyze_reddit_propagation(
            query=payload.query,
            limit=payload.limit,
            include_comments=payload.include_comments,
            comments_per_post=payload.comments_per_post,
            sort=payload.sort,
            time_filter=payload.time_filter,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/trending-news")
def trending_daily_news(
    limit: int = 12,
    country: str = "global",
    category: str | None = None,
    local_country: str | None = None,
) -> dict[str, Any]:
    try:
        return fetch_trending_daily_news(
            limit=limit,
            country=country,
            category=category,
            local_country=local_country,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
