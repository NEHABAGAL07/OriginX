from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.claims_service import check_verification_history, insert_claim
from app.utils.text_processing import preprocess_claim_text

router = APIRouter()


class VerifyClaimRequest(BaseModel):
    text: str = Field(min_length=1)


@router.post("/verify-claim")
def verify_claim(payload: VerifyClaimRequest) -> dict:
    processed_text = preprocess_claim_text(payload.text)

    if not processed_text:
        raise HTTPException(status_code=422, detail="Claim text cannot be empty after normalization.")

    try:
        previous_result = check_verification_history(processed_text)
        if previous_result:
            return {
                "status": "found",
                "verification_result": str(previous_result.get("verification_result", "")),
                "credibility_score": previous_result.get("credibility_score"),
                "summary": previous_result.get("summary"),
            }

        insert_claim(processed_text)
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {
        "status": "not_found",
        "message": "No history found. Proceeding to verification pipeline.",
        "claim": processed_text,
    }
