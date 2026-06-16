"""Shared answer submission logic for practice and diagnostic flows."""

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..ml import knowledge_tracer
from ..models import Attempt, MistakeReview, Question, Skill, User, UserSkillMastery
from ..schemas import AttemptCreate, AttemptResponse
from ..services.dashboard import update_daily_metrics
from ..services.gamification import (
    calculate_xp_for_attempt,
    check_and_unlock_skills,
    update_streak,
    update_user_xp,
)
from ..services.scoring import answer_matches


def submit_question_attempt(
    db: Session,
    current_user: User,
    attempt_data: AttemptCreate,
    diagnostic_session_id: int | None = None,
) -> AttemptResponse:
    """Score an answer, update mastery/gamification, and persist the attempt."""
    question = db.query(Question).filter(Question.id == attempt_data.question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    is_correct = answer_matches(attempt_data.user_answer, question.correct_answer)
    new_streak = update_streak(db, current_user)
    xp_earned = calculate_xp_for_attempt(
        difficulty=question.difficulty,
        is_correct=is_correct,
        streak=new_streak,
    )
    new_xp, new_level, level_up = update_user_xp(db, current_user, xp_earned)

    mastery = db.query(UserSkillMastery).filter(
        UserSkillMastery.user_id == current_user.id,
        UserSkillMastery.skill_id == question.skill_id,
    ).first()
    if not mastery:
        skill = db.query(Skill).filter(Skill.id == question.skill_id).first()
        mastery = UserSkillMastery(
            user_id=current_user.id,
            skill_id=question.skill_id,
            is_unlocked=skill.parent_skill_id is None if skill else True,
        )
        db.add(mastery)
        db.flush()

    old_mastery = mastery.mastery_probability
    new_mastery = knowledge_tracer.update_mastery(old_mastery, is_correct)
    mastery.mastery_probability = new_mastery
    mastery.attempts_count += 1
    if is_correct:
        mastery.correct_count += 1

    if mastery.avg_response_time_ms:
        mastery.avg_response_time_ms = (
            mastery.avg_response_time_ms * (mastery.attempts_count - 1)
            + attempt_data.response_time_ms
        ) / mastery.attempts_count
    else:
        mastery.avg_response_time_ms = attempt_data.response_time_ms
    mastery.last_attempt_at = datetime.now()

    attempt = Attempt(
        user_id=current_user.id,
        question_id=question.id,
        diagnostic_session_id=diagnostic_session_id,
        user_answer=attempt_data.user_answer,
        is_correct=is_correct,
        response_time_ms=attempt_data.response_time_ms,
        xp_earned=xp_earned,
    )
    db.add(attempt)
    db.flush()

    if not is_correct:
        db.add(MistakeReview(
            user_id=current_user.id,
            question_id=question.id,
            attempt_id=attempt.id,
            module=question.module,
            question_type=question.question_type,
            user_answer=attempt_data.user_answer,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
        ))

    check_and_unlock_skills(db, current_user.id)

    db.commit()
    update_daily_metrics(db, current_user.id)
    db.refresh(attempt)

    return AttemptResponse(
        id=attempt.id,
        question_id=attempt.question_id,
        user_answer=attempt.user_answer,
        is_correct=attempt.is_correct,
        response_time_ms=attempt.response_time_ms,
        xp_earned=attempt.xp_earned,
        created_at=attempt.created_at,
        correct_answer=question.correct_answer,
        explanation=question.explanation if not is_correct else None,
        new_xp=new_xp,
        new_level=new_level,
        level_up=level_up,
        new_streak=new_streak,
        mastery_change=new_mastery - old_mastery,
    )
