
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

        import asyncio
        from app.services.writing_service import evaluate_essay_locally, _valid_writing_result

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    result = pool.submit(
                        asyncio.run,
                        self._evaluate_writing(essay_text)
                    ).result(timeout=30)
            else:
                result = loop.run_until_complete(self._evaluate_writing(essay_text))
        except Exception:
            result = _valid_writing_result(evaluate_essay_locally(essay_text, "Task 2", ""))

        score = result.get("band_score", 5.0) if result else 5.0

        current_scores = dict(session.scores or {})
        current_scores["writing"] = score
        current_scores["writing_raw"] = {
            "words": len([w for w in essay_text.split() if w.strip]),
            "feedback": result.get("overall_feedback", ""),
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

    async def _evaluate_writing(self, essay_text: str):
        from app.services.writing_service import evaluate_essay_with_gemini
        return await evaluate_essay_with_gemini(essay_text, "Task 2", "")

    def submit_speaking(self, db: Session, session: MockTestSession, transcript: str):
        if (session.scores or {}).get("speaking") is not None:
            return session
        current_answers = dict(session.answers or {})
        current_answers["speaking"] = transcript
        session.answers = current_answers
        flag_modified(session, "answers")

        word_count = len([w for w in transcript.split() if w.strip()])
        band = 6.5 if word_count >= 180 else 6.0 if word_count >= 120 else 5.0 if word_count >= 70 else 4.0
        feedback = {
            "fluency_coherence": {"score": band, "comment": f"Based on {word_count} words spoken."},
            "lexical_resource": {"score": band, "comment": "Score estimated from transcript length."},
            "grammatical_range": {"score": band, "comment": "Score estimated from transcript length."},
            "pronunciation": {"score": band, "comment": "Audio analysis not available in mock exam."},
            "overall_feedback": f"Mock exam speaking estimate: {band} band based on {word_count} words. Use the dedicated speaking practice for full AI audio analysis.",
        }

        current_scores = dict(session.scores or {})
        current_scores["speaking"] = band
        current_scores["speaking_raw"] = {
            "words": word_count,
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
