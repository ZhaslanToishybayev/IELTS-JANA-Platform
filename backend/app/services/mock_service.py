
import uuid
from datetime import datetime, UTC
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from app.models import MockTestSession, Question, Attempt, MistakeReview, TestSet
from app.services.scoring import answer_matches, raw_to_band, overall_band

class MockExamService:
    
    def start_session(self, db: Session, user_id: int) -> MockTestSession:
        """Starts a new mock exam session."""
        session_id = str(uuid.uuid4())
        new_session = MockTestSession(
            id=session_id,
            user_id=user_id,
            status="IN_PROGRESS",
            current_section="LISTENING",
            answers={"question_ids": {}},
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

    def get_questions(self, db: Session, session: MockTestSession, module: str, limit: int = 12) -> list[Question]:
        """Select and persist a deterministic question set for this mock session."""
        module = module.upper()
        session_answers = dict(session.answers or {"question_ids": {}})
        question_ids_by_module = dict(session_answers.get("question_ids", {}))
        stored_ids = question_ids_by_module.get(module)

        if stored_ids:
            return db.query(Question).filter(
                Question.id.in_(stored_ids),
                Question.module == module,
                Question.approved == True,
                Question.is_active == True,
            ).order_by(Question.id).all()

        test_set = db.query(TestSet).filter(
            TestSet.module == module,
            TestSet.approved == True,
        ).order_by(TestSet.id).first()

        query = db.query(Question).filter(
            Question.module == module,
            Question.approved == True,
            Question.is_active == True,
        )
        if test_set:
            query = query.filter(Question.test_set_id == test_set.id)
        questions = query.order_by(Question.id).limit(limit).all()

        question_ids_by_module[module] = [question.id for question in questions]
        session_answers["question_ids"] = question_ids_by_module
        session.answers = session_answers
        flag_modified(session, "answers")
        db.commit()
        return questions

    def _score_answers(self, db: Session, session: MockTestSession, answers: dict, module: str) -> tuple[int, int, float]:
        module = module.upper()
        question_ids = (session.answers or {}).get("question_ids", {}).get(module, [])
        answer_by_id = {}
        for key, value in answers.items():
            raw_id = str(key).replace("q_", "")
            if raw_id.isdigit():
                qid = int(raw_id)
                answer_by_id[qid] = value
        questions = db.query(Question).filter(
            Question.id.in_(question_ids),
            Question.module == module,
        ).order_by(Question.id).all() if question_ids else []

        correct = 0
        for question in questions:
            user_answer = str(answer_by_id.get(question.id, ""))
            is_correct = answer_matches(user_answer, question.correct_answer)
            correct += 1 if is_correct else 0
            attempt = Attempt(
                user_id=session.user_id,
                question_id=question.id,
                user_answer=user_answer,
                is_correct=is_correct,
                response_time_ms=0,
                xp_earned=0,
            )
            db.add(attempt)
            db.flush()
            if not is_correct:
                db.add(MistakeReview(
                    user_id=session.user_id,
                    question_id=question.id,
                    attempt_id=attempt.id,
                    module=module,
                    question_type=question.question_type,
                    user_answer=user_answer,
                    correct_answer=question.correct_answer,
                    explanation=question.explanation,
                ))
        total = len(questions)
        return correct, total, raw_to_band(correct, module, total or 40)

    def submit_listening(self, db: Session, session: MockTestSession, answers: dict):
        """Calculates listening score from submitted DB-backed answers."""
        if (session.scores or {}).get("listening") is not None:
            return session
        current_answers = dict(session.answers or {})
        current_answers["listening"] = answers
        session.answers = current_answers # Trigger update
        flag_modified(session, "answers")
        correct, total, score = self._score_answers(db, session, answers, "LISTENING")
        
        current_scores = dict(session.scores or {})
        current_scores["listening"] = score
        current_scores["listening_raw"] = {"correct": correct, "total": total}
        session.scores = current_scores
        flag_modified(session, "scores")
        
        session.current_section = "READING"
        db.commit()
        db.refresh(session)
        return session

    def submit_reading(self, db: Session, session: MockTestSession, answers: dict):
        if (session.scores or {}).get("reading") is not None:
            return session
        current_answers = dict(session.answers or {})
        current_answers["reading"] = answers
        session.answers = current_answers
        flag_modified(session, "answers")
        correct, total, score = self._score_answers(db, session, answers, "READING")
        
        current_scores = dict(session.scores or {})
        current_scores["reading"] = score
        current_scores["reading_raw"] = {"correct": correct, "total": total}
        session.scores = current_scores
        flag_modified(session, "scores")
        
        session.current_section = "WRITING"
        db.commit()
        db.refresh(session)
        return session

    def submit_writing(self, db: Session, session: MockTestSession, essay_text: str):
        if (session.scores or {}).get("writing") is not None:
            return session
        current_answers = dict(session.answers or {})
        current_answers["writing"] = essay_text
        session.answers = current_answers
        flag_modified(session, "answers")

        from app.services.writing_service import evaluate_essay_locally, _valid_writing_result

        result = _valid_writing_result(evaluate_essay_locally(essay_text, "Task 2", ""))
        score = result.get("band_score", 5.0) if result else 5.0

        word_count = len([w for w in essay_text.split() if w.strip()])
        current_scores = dict(session.scores or {})
        current_scores["writing"] = score
        current_scores["writing_raw"] = {
            "words": word_count,
            "feedback": result.get("overall_feedback", "") if result else "",
            "criteria": {
                k: {"score": v.get("score", 0), "comment": v.get("comment", "")}
                for k, v in result.items()
                if isinstance(v, dict)
            } if result else {},
        }
        session.scores = current_scores
        flag_modified(session, "scores")
        session.current_section = "SPEAKING"
        db.commit()
        db.refresh(session)
        return session

    def submit_speaking(self, db: Session, session: MockTestSession, transcript: str):
        if (session.scores or {}).get("speaking") is not None:
            return session
        current_answers = dict(session.answers or {})
        current_answers["speaking"] = transcript
        session.answers = current_answers
        flag_modified(session, "answers")

        word_count = len([w for w in transcript.split() if w.strip()])
        sentences = [s.strip() for s in transcript.replace("?", ".").replace("!", ".").split(".") if s.strip()]
        unique_words = len({w.lower().strip(".,;:!?") for w in transcript.split()})

        # More nuanced scoring based on multiple factors
        length_score = 6.5 if word_count >= 180 else 6.0 if word_count >= 120 else 5.0 if word_count >= 70 else 4.0
        variety_score = 6.5 if unique_words / max(word_count, 1) >= 0.6 else 6.0 if unique_words / max(word_count, 1) >= 0.45 else 5.0
        coherence_score = 6.5 if len(sentences) >= 8 else 6.0 if len(sentences) >= 5 else 5.0 if len(sentences) >= 3 else 4.0
        band = round((length_score + variety_score + coherence_score) * 2 / 3) / 2

        feedback = {
            "fluency_coherence": {"score": coherence_score, "comment": f"{len(sentences)} sentences, {word_count} words spoken."},
            "lexical_resource": {"score": variety_score, "comment": f"{unique_words} unique words out of {word_count} total."},
            "grammatical_range": {"score": length_score, "comment": "Score estimated from response length and structure."},
            "pronunciation": {"score": band, "comment": "Audio analysis required for precise pronunciation scoring."},
            "overall_feedback": f"Speaking response: {word_count} words, {len(sentences)} sentences, estimated band {band}. For full AI audio analysis, use the dedicated speaking practice.",
        }

        current_scores = dict(session.scores or {})
        current_scores["speaking"] = band
        current_scores["speaking_raw"] = {
            "words": word_count,
            "sentences": len(sentences),
            "unique_words": unique_words,
            "feedback": feedback,
        }
        current_scores["overall"] = overall_band([
            current_scores.get("listening", 0),
            current_scores.get("reading", 0),
            current_scores.get("writing", 0),
            current_scores.get("speaking", 0),
        ])
        session.scores = current_scores
        flag_modified(session, "scores")
        session.status = "COMPLETED"
        session.end_time = datetime.now(UTC)

        db.commit()
        db.refresh(session)
        return session

mock_service = MockExamService()
