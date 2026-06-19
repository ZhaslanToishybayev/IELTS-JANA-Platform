"""Seed a realistic demo learner account for local portfolio demos."""

from __future__ import annotations

import sys
import logging
from datetime import datetime, timedelta

sys.path.insert(0, ".")

from app.database import SessionLocal
from app.models import (
    Attempt,
    DashboardMetric,
    DiagnosticSession,
    DiagnosticSessionQuestion,
    MistakeReview,
    Question,
    Skill,
    User,
    UserSkillMastery,
)
from app.services.auth import get_password_hash
from app.services.dashboard import update_daily_metrics
from app.services.gamification import get_level_for_xp
from app.services.module_skills import get_categories_for_module
from app.services.scoring import raw_to_band


DEMO_EMAIL = "demo@ieltsjana.local"
DEMO_USERNAME = "demo_student"
DEMO_PASSWORD = "DemoPass123"
READING_MODULE = "READING"
DIAGNOSTIC_TARGET = 10

logging.getLogger("passlib.handlers.bcrypt").setLevel(logging.ERROR)

MASTERY_PROFILE = {
    "TF_NG": 0.72,
    "HEADINGS": 0.64,
    "SUMMARY": 0.58,
    "MATCHING_INFO": 0.38,
    "SENTENCE_COMP": 0.46,
    "MCQ": 0.69,
    "FILL_BLANK": 0.52,
}


def _wrong_answer(question: Question) -> str:
    if question.options:
        for option in question.options:
            if str(option).strip().lower() != question.correct_answer.strip().lower():
                return str(option)
    return "demo incorrect answer"


def _reading_questions_by_category(db) -> dict[str, list[Question]]:
    categories = get_categories_for_module(READING_MODULE)
    questions = (
        db.query(Question)
        .join(Skill)
        .filter(
            Question.module == READING_MODULE,
            Question.is_active.is_(True),
            Question.approved.is_(True),
            Skill.category.in_(categories),
        )
        .order_by(Skill.category.asc(), Question.id.asc())
        .all()
    )
    grouped = {category: [] for category in categories}
    for question in questions:
        grouped[question.skill.category].append(question)
    return grouped


def ensure_demo_user(db) -> User:
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if not user:
        user = User(
            email=DEMO_EMAIL,
            username=DEMO_USERNAME,
            password_hash=get_password_hash(DEMO_PASSWORD),
            is_email_verified=True,
            email_verified_at=datetime.now(),
            is_active=True,
        )
        db.add(user)
        db.flush()
    else:
        user.username = DEMO_USERNAME
        user.password_hash = get_password_hash(DEMO_PASSWORD)
        user.is_email_verified = True
        user.email_verified_at = user.email_verified_at or datetime.now()
        user.is_active = True
    return user


def reset_demo_profile(db, user: User) -> None:
    session_ids = [
        row[0]
        for row in db.query(DiagnosticSession.id)
        .filter(DiagnosticSession.user_id == user.id)
        .all()
    ]
    if session_ids:
        db.query(DiagnosticSessionQuestion).filter(
            DiagnosticSessionQuestion.session_id.in_(session_ids)
        ).delete(synchronize_session=False)
    db.query(MistakeReview).filter(MistakeReview.user_id == user.id).delete(synchronize_session=False)
    db.query(DashboardMetric).filter(DashboardMetric.user_id == user.id).delete(synchronize_session=False)
    db.query(Attempt).filter(Attempt.user_id == user.id).delete(synchronize_session=False)
    db.query(DiagnosticSession).filter(DiagnosticSession.user_id == user.id).delete(synchronize_session=False)
    db.query(UserSkillMastery).filter(UserSkillMastery.user_id == user.id).delete(synchronize_session=False)
    db.flush()
    db.expunge_all()


def _pick_demo_questions(grouped: dict[str, list[Question]]) -> list[Question]:
    selected: list[Question] = []
    categories = get_categories_for_module(READING_MODULE)
    if not any(grouped.values()):
        raise RuntimeError("Run python seed_ielts_v1.py first.")

    for category in categories:
        if grouped[category]:
            selected.append(grouped[category][0])

    cursor = 1
    while len(selected) < 14:
        added = False
        for category in categories:
            if len(grouped[category]) > cursor:
                selected.append(grouped[category][cursor])
                added = True
                if len(selected) >= 14:
                    break
        if not added:
            break
        cursor += 1

    if len(selected) < DIAGNOSTIC_TARGET:
        raise RuntimeError("Run python seed_ielts_v1.py first.")
    return selected


def _create_attempt(
    db,
    user: User,
    question: Question,
    is_correct: bool,
    created_at: datetime,
    diagnostic_session_id: int | None = None,
) -> Attempt:
    answer = question.correct_answer if is_correct else _wrong_answer(question)
    attempt = Attempt(
        user_id=user.id,
        question_id=question.id,
        diagnostic_session_id=diagnostic_session_id,
        user_answer=answer,
        is_correct=is_correct,
        response_time_ms=9000 + (question.id % 7) * 1100,
        xp_earned=35 if is_correct else 0,
        created_at=created_at,
    )
    db.add(attempt)
    db.flush()

    if not is_correct:
        db.add(MistakeReview(
            user_id=user.id,
            question_id=question.id,
            attempt_id=attempt.id,
            module=question.module,
            question_type=question.question_type,
            user_answer=answer,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
            is_resolved=False,
            created_at=created_at,
        ))
    return attempt


def _seed_masteries(db, user: User, attempts: list[Attempt]) -> list[dict]:
    weak_skills = []
    attempts_by_skill: dict[int, list[Attempt]] = {}
    for attempt in attempts:
        attempts_by_skill.setdefault(attempt.question.skill_id, []).append(attempt)

    for skill in db.query(Skill).filter(Skill.category.in_(get_categories_for_module(READING_MODULE))).all():
        skill_attempts = attempts_by_skill.get(skill.id, [])
        correct_count = sum(1 for attempt in skill_attempts if attempt.is_correct)
        mastery = UserSkillMastery(
            user_id=user.id,
            skill_id=skill.id,
            mastery_probability=MASTERY_PROFILE.get(skill.category, 0.5),
            attempts_count=max(len(skill_attempts), 1),
            correct_count=correct_count,
            avg_response_time_ms=11800,
            last_attempt_at=datetime.now(),
            is_unlocked=True,
        )
        db.add(mastery)

        if skill_attempts:
            weak_skills.append({
                "skill_id": skill.id,
                "skill_name": skill.name,
                "category": skill.category,
                "mastery_probability": round(mastery.mastery_probability, 4),
                "accuracy_rate": round(correct_count / len(skill_attempts), 4),
                "attempts_count": len(skill_attempts),
            })

    weak_skills.sort(key=lambda item: (item["mastery_probability"], item["accuracy_rate"]))
    return weak_skills[:3]


def seed_demo_profile(db) -> User:
    grouped = _reading_questions_by_category(db)
    selected_questions = _pick_demo_questions(grouped)
    user = ensure_demo_user(db)
    reset_demo_profile(db, user)
    user = db.query(User).filter(User.email == DEMO_EMAIL).one()

    now = datetime.now()
    session = DiagnosticSession(
        user_id=user.id,
        module=READING_MODULE,
        target_questions=DIAGNOSTIC_TARGET,
        status="completed",
        started_at=now - timedelta(days=2, minutes=18),
        completed_at=now - timedelta(days=2),
    )
    db.add(session)
    db.flush()

    diagnostic_correct_pattern = [True, False, True, True, False, True, False, True, True, False]
    diagnostic_attempts = [
        _create_attempt(
            db,
            user,
            question,
            diagnostic_correct_pattern[index],
            now - timedelta(days=2, minutes=20 - index),
            session.id,
        )
        for index, question in enumerate(selected_questions[:DIAGNOSTIC_TARGET])
    ]
    for index, attempt in enumerate(diagnostic_attempts, start=1):
        db.add(DiagnosticSessionQuestion(
            session_id=session.id,
            question_id=attempt.question_id,
            attempt_id=attempt.id,
            position=index,
            served_at=attempt.created_at,
            answered_at=attempt.created_at,
        ))
    practice_attempts = [
        _create_attempt(
            db,
            user,
            question,
            is_correct=index % 3 != 1,
            created_at=now - timedelta(hours=3, minutes=index * 6),
        )
        for index, question in enumerate(selected_questions[DIAGNOSTIC_TARGET:14])
    ]
    all_attempts = diagnostic_attempts + practice_attempts
    first_mistake = (
        db.query(MistakeReview)
        .filter(MistakeReview.user_id == user.id)
        .order_by(MistakeReview.created_at.asc())
        .first()
    )
    if first_mistake:
        first_mistake.is_resolved = True
    weak_skills = _seed_masteries(db, user, all_attempts)

    correct_diagnostic = sum(1 for attempt in diagnostic_attempts if attempt.is_correct)
    accuracy = correct_diagnostic / DIAGNOSTIC_TARGET
    estimated_band = raw_to_band(correct_diagnostic, READING_MODULE, DIAGNOSTIC_TARGET)
    snapshot = {
        "completed": True,
        "answered": DIAGNOSTIC_TARGET,
        "accuracy": round(accuracy, 4),
        "estimated_reading_band": estimated_band,
        "weak_skills": weak_skills,
        "recommendation": f"Start with {weak_skills[0]['skill_name']} and review recent mistakes." if weak_skills else "Review recent mistakes and continue adaptive Reading practice.",
        "session_id": session.id,
        "status": "completed",
    }
    session.accuracy = snapshot["accuracy"]
    session.estimated_band = snapshot["estimated_reading_band"]
    session.result_snapshot = snapshot

    user.xp = 760
    user.level = get_level_for_xp(user.xp)
    user.current_streak = 4
    user.longest_streak = 6
    user.last_practice_date = now
    db.commit()
    update_daily_metrics(db, user.id)
    db.refresh(user)
    return user


def main() -> int:
    db = SessionLocal()
    try:
        user = seed_demo_profile(db)
        print(f"Seeded demo user: {user.email} / {DEMO_PASSWORD}")
        return 0
    except RuntimeError as error:
        db.rollback()
        print(str(error))
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
