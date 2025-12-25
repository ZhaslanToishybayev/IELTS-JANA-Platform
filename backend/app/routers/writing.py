from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.writing_service import evaluate_essay_with_gemini
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/writing", tags=["writing"])

class EssaySubmission(BaseModel):
    task_type: str
    prompt_text: str
    essay_text: str

class EvaluationResponse(BaseModel):
    band_score: float
    task_response: dict
    coherence_cohesion: dict
    lexical_resource: dict
    grammatical_range: dict
    overall_feedback: str
    improvements: List[str]
    error: Optional[str] = None

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_essay(
    submission: EssaySubmission,
    current_user: dict = Depends(get_current_user)
):
    """Evaluate an essay using AI."""
    result = await evaluate_essay_with_gemini(
        essay_text=submission.essay_text,
        task_type=submission.task_type,
        prompt_text=submission.prompt_text
    )
    
    if "error" in result and result["error"]:
        # We still return the structure but with error message
        # Or you could raise HTTPException depending on preference
        pass
        
    return result
