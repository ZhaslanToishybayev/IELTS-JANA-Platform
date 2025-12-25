
import uuid
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import MockTestSession, Question, Attempt
from app.schemas import MockSessionResponse

class MockExamService:
    
    def start_session(self, db: Session, user_id: int) -> MockTestSession:
        """Starts a new mock exam session."""
        session_id = str(uuid.uuid4())
        new_session = MockTestSession(
            id=session_id,
            user_id=user_id,
            status="IN_PROGRESS",
            current_section="LISTENING",
            answers={},
            scores={}
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return new_session

    def get_session(self, db: Session, session_id: str, user_id: int) -> MockTestSession:
        session = db.query(MockTestSession).filter(
            MockTestSession.id == session_id,
            MockTestSession.user_id == user_id
        ).first()
        return session

    def submit_listening(self, db: Session, session: MockTestSession, answers: dict):
        """Calculates listening score 0-9 based on basic correct count."""
        # For MVP, we don't equate specific question IDs to answers yet because 
        # our answers schema is generic. 
        # We will SIMULATE a score based on random logic or assume frontend passes correctness count.
        # Ideally, we verify against DB.
        
        # In a real app, we fetch all question answers and compare strings.
        # Here, let's assume `answers` contains "correct_count" for MVP simplicity, 
        # or we calculate roughly.
        
        # Let's say answers = { "q_1": "answer", ... }
        # We'd need to fetch actual questions.
        
        # Simplified Logic for MVP:
        # Just calculate a random realistic score or 0 if empty.
        correct_count = 0
        total_qs = 0
        
        # In full version, iterate keys, find question, compare.
        # For now, let's update status to READING
        
        current_answers = session.answers or {}
        current_answers["listening"] = answers
        session.answers = current_answers # Trigger update
        
        # Fake score for demo
        import random
        score = random.choice([5.5, 6.0, 6.5, 7.0, 7.5, 8.0])
        
        current_scores = session.scores or {}
        current_scores["listening"] = score
        session.scores = current_scores
        
        session.current_section = "READING"
        db.commit()
        db.refresh(session)
        return session

    def submit_reading(self, db: Session, session: MockTestSession, answers: dict):
        current_answers = session.answers or {}
        current_answers["reading"] = answers
        session.answers = current_answers
        
        import random
        score = random.choice([5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5])
        
        current_scores = session.scores or {}
        current_scores["reading"] = score
        session.scores = current_scores
        
        session.current_section = "WRITING"
        db.commit()
        db.refresh(session)
        return session

    def submit_writing(self, db: Session, session: MockTestSession, essay_text: str):
        current_answers = session.answers or {}
        current_answers["writing"] = essay_text
        session.answers = current_answers
        
        # Here we would call AI writing service
        # For mock flow, we just generate a score
        import random
        score = random.choice([6.0, 6.5, 7.0])
        
        current_scores = session.scores or {}
        current_scores["writing"] = score
        
        # Calculate overall
        l = current_scores.get("listening", 0)
        r = current_scores.get("reading", 0)
        w = score
        overall = round((l + r + w) / 3 * 2) / 2  # Average rounded to nearest 0.5
        current_scores["overall"] = overall
        
        session.scores = current_scores
        session.status = "COMPLETED"
        session.end_time = datetime.utcnow()
        
        db.commit()
        db.refresh(session)
        return session

mock_service = MockExamService()
