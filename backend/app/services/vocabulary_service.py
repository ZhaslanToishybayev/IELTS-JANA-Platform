from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.models import UserVocabulary, Vocabulary

class VocabularyService:
    def get_due_cards(self, db: Session, user_id: int):
        """Get flashcards due for review today or overdue."""
        now = datetime.utcnow()
        return db.query(UserVocabulary).join(Vocabulary)\
            .filter(UserVocabulary.user_id == user_id)\
            .filter(UserVocabulary.next_review_at <= now)\
            .all()

    def add_word(self, db: Session, user_id: int, word: str, definition: str, context: Optional[str] = None):
        """Add a new word to the user's collection."""
        # Check if word exists in global dict, if not create
        vocab = db.query(Vocabulary).filter(func.lower(Vocabulary.word) == word.lower()).first()
        if not vocab:
            vocab = Vocabulary(word=word, definition=definition, context_sentence=context)
            db.add(vocab)
            db.commit()
            db.refresh(vocab)
            
        # Check if user already has this card
        user_vocab = db.query(UserVocabulary).filter(
            UserVocabulary.user_id == user_id, 
            UserVocabulary.vocab_id == vocab.id
        ).first()
        
        if not user_vocab:
            # Initial state for new card
            user_vocab = UserVocabulary(
                user_id=user_id,
                vocab_id=vocab.id,
                next_review_at=datetime.utcnow(), # Due immediately
                interval=0,
                ease_factor=2.5,
                repetitions=0
            )
            db.add(user_vocab)
            db.commit()
            db.refresh(user_vocab)
            
        return user_vocab

    def process_review(self, db: Session, card_id: int, quality: int):
        """
        Update SRS state based on usage quality (0-5).
        Algorithm (SM-2):
        - 0-2: Fail (Reset repetitions, interval = 1)
        - 3-5: Pass (Update ease factor and interval)
        """
        card = db.query(UserVocabulary).filter(UserVocabulary.id == card_id).first()
        if not card:
            return None
            
        if quality < 3:
            # Forgot the card
            card.repetitions = 0
            card.interval = 1
        else:
            # Remembered
            if card.repetitions == 0:
                card.interval = 1
            elif card.repetitions == 1:
                card.interval = 6
            else:
                card.interval = int(card.interval * card.ease_factor)
            
            card.repetitions += 1
            
            # Update E-Factor (SM-2 formula)
            # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
            card.ease_factor = max(1.3, card.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
            
        # Set next review date
        card.next_review_at = datetime.utcnow() + timedelta(days=card.interval)
        
        # Mark mastery if interval is very long > 21 days
        if card.interval > 21:
            card.is_mastered = True
            
        db.commit()
        db.refresh(card)
        return card

vocabulary_service = VocabularyService()
