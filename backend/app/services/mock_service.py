
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

    def submit_writing(self, db: Session, session: MockTestSession, task1_text: str = "", task2_text: str = ""):
        if (session.scores or {}).get("writing") is not None:
            return session

        current_answers = dict(session.answers or {})
        if task1_text:
            current_answers["writing_task1"] = task1_text
        if task2_text:
            current_answers["writing_task2"] = task2_text
        session.answers = current_answers
        flag_modified(session, "answers")

        from app.services.writing_service import evaluate_essay_with_gemini

        combined_text = ""
        task_scores = {}
        all_feedback = {}
        all_criteria = {"task_response": [], "coherence_cohesion": [], "lexical_resource": [], "grammatical_range": []}

        import asyncio

        for label, text, task_type in [("task1", task1_text, "Task 1"), ("task2", task2_text, "Task 2")]:
            if text.strip():
                try:
                    result = asyncio.run(evaluate_essay_with_gemini(text, task_type, ""))
                except Exception:
                    result = {"band_score": 5.0}
                score = result.get("band_score", 5.0)
                words = len([w for w in text.split() if w.strip()])
                criteria = {}
                for key in ["task_response", "coherence_cohesion", "lexical_resource", "grammatical_range"]:
                    if key in result and isinstance(result[key], dict):
                        criteria[key] = {"score": result[key].get("score", score), "comment": result[key].get("comment", "")}
                        all_criteria[key].append(result[key].get("score", score))
                    else:
                        criteria[key] = {"score": score, "comment": ""}
                        all_criteria[key].append(score)
                task_scores[label] = score
                all_feedback[label] = {
                    "words": words,
                    "score": score,
                    "feedback": result.get("overall_feedback", ""),
                    "criteria": criteria,
                    "improvements": result.get("improvements", []),
                }
                combined_text += text + "\n\n"

        avg_criteria = {}
        for key, scores in all_criteria.items():
            if scores:
                avg_criteria[key] = round(sum(scores) / len(scores) * 2) / 2

        if not task_scores:
            overall_writing = 5.0
        elif len(task_scores) == 2:
            overall_writing = round((task_scores["task1"] + task_scores["task2"]) * 2 / 2) / 2
        else:
            overall_writing = list(task_scores.values())[0]

        current_scores = dict(session.scores or {})
        current_scores["writing"] = overall_writing
        current_scores["writing_raw"] = {
            "total_words": len([w for w in combined_text.split() if w.strip()]),
            "tasks": all_feedback,
            "criteria": avg_criteria,
            "task1_words": all_feedback.get("task1", {}).get("words", 0),
            "task2_words": all_feedback.get("task2", {}).get("words", 0),
        }
        session.scores = current_scores
        flag_modified(session, "scores")
        session.current_section = "SPEAKING"
        db.commit()
        db.refresh(session)
        return session

    def submit_speaking(self, db: Session, session: MockTestSession, part1: str = "", part2: str = "", part3: str = ""):
        if (session.scores or {}).get("speaking") is not None:
            return session

        current_answers = dict(session.answers or {})
        if part1:
            current_answers["speaking_part1"] = part1
        if part2:
            current_answers["speaking_part2"] = part2
        if part3:
            current_answers["speaking_part3"] = part3
        session.answers = current_answers
        flag_modified(session, "answers")

        from app.services.speaking_service import evaluate_text_speaking

        part_results = {}
        all_criteria = {"fluency_coherence": [], "lexical_resource": [], "grammatical_range": [], "pronunciation": []}

        for label, text in [("part1", part1), ("part2", part2), ("part3", part3)]:
            if text.strip():
                prompt = f"IELTS Speaking {label.upper()} response"
                import asyncio
                try:
                    result = asyncio.run(evaluate_text_speaking(text, prompt))
                except Exception:
                    result = {"band_score": 5.0}
                band = result.get("band_score", 5.0)
                criteria = {}
                for key in ["fluency_coherence", "lexical_resource", "grammatical_range", "pronunciation"]:
                    if key in result and isinstance(result[key], dict):
                        criteria[key] = {"score": result[key].get("score", band), "comment": result[key].get("comment", "")}
                        all_criteria[key].append(result[key].get("score", band))
                    else:
                        criteria[key] = {"score": band, "comment": ""}
                        all_criteria[key].append(band)
                part_results[label] = {
                    "band": band,
                    "words": len([w for w in text.split() if w.strip()]),
                    "criteria": criteria,
                    "feedback": result.get("overall_feedback", ""),
                    "improvements": result.get("improvements", []),
                }

        if not part_results:
            overall_speaking = 5.0
        elif len(part_results) == 3:
            overall_speaking = round(sum(p["band"] for p in part_results.values()) / 3 * 2) / 2
        else:
            overall_speaking = round(sum(p["band"] for p in part_results.values()) / len(part_results) * 2) / 2

        avg_criteria = {}
        for key, scores in all_criteria.items():
            if scores:
                avg_criteria[key] = round(sum(scores) / len(scores) * 2) / 2

        current_scores = dict(session.scores or {})
        current_scores["speaking"] = overall_speaking
        current_scores["speaking_raw"] = {
            "parts": part_results,
            "criteria": avg_criteria,
            "total_words": sum(p["words"] for p in part_results.values()),
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
