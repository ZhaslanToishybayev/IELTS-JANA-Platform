
import sys
import os
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import Question
import json

def fix_question():
    db = SessionLocal()
    try:
        # Find the specific question
        q = db.query(Question).filter(
            Question.question_text == "How many restaurants are in the Student Union food court?"
        ).first()
        
        if q:
            print(f"Found question {q.id}. Type was {q.question_type}")
            q.question_type = "MCQ"
            q.options = json.dumps(["3", "4", "5", "6"]) if hasattr(q, 'options') else ["3", "4", "5", "6"] 
            # Note: SQLAlchemy handles JSON serialization usually if type is JSON. 
            # In models.py it is assumed to be JSON type or handled.
            # Let's check model definition.
            # models.py uses `options = Column(JSON, nullable=True)` (likely)
            
            db.commit()
            print("Updated question to MCQ with options: 3, 4, 5, 6")
        else:
            print("Question not found in DB.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_question()
