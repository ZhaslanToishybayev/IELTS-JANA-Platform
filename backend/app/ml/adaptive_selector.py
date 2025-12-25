"""Adaptive question selector based on skill mastery and learning goals."""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
import random

from ..models import Question, Attempt, UserSkillMastery, Skill
from .knowledge_tracing import knowledge_tracer


class AdaptiveSelector:
    """
    Selects the next question based on:
    1. User's weakest skills (lowest mastery)
    2. Appropriate difficulty for current mastery level
    3. Avoids recently attempted questions
    4. Prioritizes skills with fewer attempts
    """
    
    def __init__(self):
        self.recent_question_window = 10  # Avoid last N questions
        self.weakness_threshold = 0.5     # Skills below this are "weak"
    
    def get_next_question(
        self,
        db: Session,
        user_id: int,
        preferred_category: Optional[str] = None
    ) -> Tuple[Optional[Question], str, str]:
        """
        Select the next adaptive question for a user.
        
        Args:
            db: Database session
            user_id: User's ID
            preferred_category: Optional category to focus on (TF_NG, HEADINGS, SUMMARY)
            
        Returns:
            Tuple of (Question, target_skill_name, selection_reason)
        """
        # Get user's skill masteries
        masteries = db.query(UserSkillMastery).filter(
            UserSkillMastery.user_id == user_id
        ).all()
        
        mastery_map = {m.skill_id: m for m in masteries}
        
        # Get all skills
        skills = db.query(Skill).all()
        
        # Find target skill based on strategy
        target_skill, reason = self._select_target_skill(
            skills, mastery_map, preferred_category
        )
        
        if not target_skill:
            # Fallback: random skill
            target_skill = random.choice(skills) if skills else None
            reason = "Random selection (no skill data)"
        
        if not target_skill:
            return None, "", "No skills available"
        
        # Get user's mastery for this skill
        user_mastery = mastery_map.get(target_skill.id)
        mastery_prob = user_mastery.mastery_probability if user_mastery else 0.3
        
        # Determine target difficulty
        target_difficulty = knowledge_tracer.get_difficulty_for_mastery(mastery_prob)
        
        # Get recent question IDs to avoid
        recent_ids = self._get_recent_question_ids(db, user_id)
        
        # Select question matching criteria
        question = self._select_question(
            db, target_skill.id, target_difficulty, recent_ids
        )
        
        if question:
            return question, target_skill.name, reason
        
        # Fallback: any question from this skill
        question = db.query(Question).filter(
            Question.skill_id == target_skill.id,
            Question.is_active == True,
            ~Question.id.in_(recent_ids) if recent_ids else True
        ).first()
        
        if question:
            return question, target_skill.name, f"{reason} (difficulty fallback)"
        
        # Last resort: any active question
        question = db.query(Question).filter(
            Question.is_active == True
        ).order_by(func.random()).first()
        
        return question, target_skill.name if target_skill else "General", "No matching questions found"
    
    def _select_target_skill(
        self,
        skills: List[Skill],
        mastery_map: dict,
        preferred_category: Optional[str]
    ) -> Tuple[Optional[Skill], str]:
        """Select which skill to target based on mastery and attempts."""
        
        if not skills:
            return None, ""
        
        # Filter by category if preferred
        if preferred_category:
            category_skills = [s for s in skills if s.category == preferred_category]
            if category_skills:
                skills = category_skills
        
        # Calculate priority scores for each skill
        skill_scores = []
        for skill in skills:
            mastery = mastery_map.get(skill.id)
            
            if mastery:
                prob = mastery.mastery_probability
                attempts = mastery.attempts_count
            else:
                prob = 0.3  # Default initial mastery
                attempts = 0
            
            # Priority: lower mastery = higher priority
            # Also prioritize skills with fewer attempts
            weakness_score = 1 - prob
            novelty_score = 1 / (attempts + 1)  # More attempts = lower novelty
            
            # Combined score (weakness weighted more)
            priority = weakness_score * 0.7 + novelty_score * 0.3
            
            skill_scores.append((skill, priority, prob, attempts))
        
        # Sort by priority (highest first)
        skill_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Add some randomness to avoid always picking the same skill
        # Take from top 3 with weighted random
        top_skills = skill_scores[:3]
        
        if not top_skills:
            return None, ""
        
        # Weighted random selection
        total_priority = sum(s[1] for s in top_skills)
        if total_priority == 0:
            selected = random.choice(top_skills)
        else:
            r = random.random() * total_priority
            cumsum = 0
            selected = top_skills[0]
            for skill_data in top_skills:
                cumsum += skill_data[1]
                if r <= cumsum:
                    selected = skill_data
                    break
        
        skill, priority, prob, attempts = selected
        
        # Generate reason
        if prob < self.weakness_threshold:
            reason = f"Targeting weak skill ({prob:.0%} mastery)"
        elif attempts < 5:
            reason = f"Building experience ({attempts} attempts)"
        else:
            reason = f"Reinforcing skill ({prob:.0%} mastery)"
        
        return skill, reason
    
    def _get_recent_question_ids(self, db: Session, user_id: int) -> List[int]:
        """Get IDs of recently attempted questions."""
        recent = db.query(Attempt.question_id).filter(
            Attempt.user_id == user_id
        ).order_by(
            Attempt.created_at.desc()
        ).limit(self.recent_question_window).all()
        
        return [r[0] for r in recent]
    
    def _select_question(
        self,
        db: Session,
        skill_id: int,
        target_difficulty: int,
        exclude_ids: List[int]
    ) -> Optional[Question]:
        """Select a question matching skill and difficulty criteria."""
        
        # Query for questions with matching difficulty (±2 range)
        query = db.query(Question).filter(
            Question.skill_id == skill_id,
            Question.is_active == True,
            Question.difficulty.between(max(1, target_difficulty - 2), min(10, target_difficulty + 2))
        )
        
        if exclude_ids:
            query = query.filter(~Question.id.in_(exclude_ids))
        
        # Get all matching questions and pick randomly
        questions = query.all()
        
        if not questions:
            return None
        
        # Prefer questions closer to target difficulty
        weights = []
        for q in questions:
            diff_distance = abs(q.difficulty - target_difficulty)
            weight = 1 / (diff_distance + 1)
            weights.append(weight)
        
        # Weighted random selection
        total_weight = sum(weights)
        r = random.random() * total_weight
        cumsum = 0
        for q, w in zip(questions, weights):
            cumsum += w
            if r <= cumsum:
                return q
        
        return questions[0]


# Singleton instance
adaptive_selector = AdaptiveSelector()
