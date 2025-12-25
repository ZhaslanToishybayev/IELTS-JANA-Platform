from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..services.vocabulary_service import vocabulary_service
from ..services.auth import get_current_user
from ..models.models import User

router = APIRouter(prefix="/api/vocabulary", tags=["vocabulary"])

class VocabCard(BaseModel):
    id: int
    word: str
    definition: str
    context: Optional[str] = None
    next_review: datetime
    
    class Config:
        from_attributes = True

class AddWordRequest(BaseModel):
    word: str
    definition: str
    context: Optional[str] = None

class ReviewRequest(BaseModel):
    card_id: int
    quality: int # 0 to 5

@router.get("/due", response_model=List[VocabCard])
def get_due_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get flashcards due for review today."""
    cards = vocabulary_service.get_due_cards(db, current_user.id)
    
    # Map to schema
    return [
        VocabCard(
            id=c.id,
            word=c.vocabulary.word,
            definition=c.vocabulary.definition,
            context=c.vocabulary.context_sentence,
            next_review=c.next_review_at
        ) for c in cards
    ]

@router.post("/add")
def add_word(
    request: AddWordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually add a word to study."""
    return vocabulary_service.add_word(
        db, 
        current_user.id, 
        request.word, 
        request.definition, 
        request.context
    )

@router.post("/review")
def submit_review(
    request: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a review result (0-5) to update SRS schedule."""
    card = vocabulary_service.process_review(db, request.card_id, request.quality)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"status": "ok", "next_review": card.next_review_at}
