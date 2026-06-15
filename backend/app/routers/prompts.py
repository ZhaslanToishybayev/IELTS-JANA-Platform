"""IELTS Writing and Speaking prompt banks."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SpeakingPrompt, WritingPrompt
from ..routers.auth import get_current_user

router = APIRouter(prefix="/prompts", tags=["Prompts"])


@router.get("/writing")
async def list_writing_prompts(
    task_type: str | None = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(WritingPrompt).filter(WritingPrompt.is_active == True)
    if task_type:
        query = query.filter(WritingPrompt.task_type == task_type)
    prompts = query.order_by(WritingPrompt.id).all()
    return {
        "prompts": [
            {
                "id": prompt.id,
                "type": prompt.task_type,
                "title": prompt.title,
                "prompt": prompt.prompt_text,
                "category": prompt.category,
                "wordLimit": prompt.word_limit,
                "timeLimit": prompt.time_limit_minutes,
                "tips": prompt.tips or [],
            }
            for prompt in prompts
        ]
    }


@router.get("/speaking")
async def list_speaking_prompts(
    part: str | None = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(SpeakingPrompt).filter(SpeakingPrompt.is_active == True)
    if part:
        query = query.filter(SpeakingPrompt.part == part)
    prompts = query.order_by(SpeakingPrompt.id).all()
    return {
        "prompts": [
            {
                "id": prompt.id,
                "part": prompt.part,
                "title": prompt.title,
                "cueCard": prompt.cue_card,
                "questions": prompt.questions or [],
                "prepTime": prompt.prep_time_sec,
                "speakTime": prompt.speak_time_sec,
                "timePerQuestion": prompt.speak_time_sec,
            }
            for prompt in prompts
        ]
    }
