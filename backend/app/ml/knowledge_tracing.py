"""Bayesian Knowledge Tracing implementation for IELTS Reading skill mastery."""

from dataclasses import dataclass
from typing import Tuple


@dataclass
class BKTParams:
    """Bayesian Knowledge Tracing parameters."""
    p_init: float = 0.3    # P(L0) - Initial probability of mastery
    p_learn: float = 0.1   # P(T) - Probability of learning after practice
    p_guess: float = 0.2   # P(G) - Probability of guessing correctly without mastery
    p_slip: float = 0.1    # P(S) - Probability of slipping (wrong answer despite mastery)


class KnowledgeTracer:
    """
    Bayesian Knowledge Tracing for adaptive learning.
    
    Uses Bayes' theorem to update the probability that a student has mastered
    a skill based on their performance on questions.
    """
    
    def __init__(self, params: BKTParams = None):
        self.params = params or BKTParams()
    
    def update_mastery(self, prior_mastery: float, is_correct: bool) -> float:
        """
        Update mastery probability based on an attempt.
        
        Uses Bayes' theorem:
        P(L|obs) = P(obs|L) * P(L) / P(obs)
        
        Args:
            prior_mastery: Current mastery probability P(L)
            is_correct: Whether the answer was correct
            
        Returns:
            Updated mastery probability
        """
        p = self.params
        
        if is_correct:
            # P(correct | mastered) = 1 - P(slip)
            p_correct_if_mastered = 1 - p.p_slip
            # P(correct | not mastered) = P(guess)
            p_correct_if_not_mastered = p.p_guess
            
            # Bayes numerator: P(correct | L) * P(L)
            numerator = p_correct_if_mastered * prior_mastery
            # Bayes denominator: P(correct)
            denominator = numerator + p_correct_if_not_mastered * (1 - prior_mastery)
        else:
            # P(incorrect | mastered) = P(slip)
            p_incorrect_if_mastered = p.p_slip
            # P(incorrect | not mastered) = 1 - P(guess)
            p_incorrect_if_not_mastered = 1 - p.p_guess
            
            numerator = p_incorrect_if_mastered * prior_mastery
            denominator = numerator + p_incorrect_if_not_mastered * (1 - prior_mastery)
        
        # Posterior probability after observing the response
        posterior = numerator / denominator if denominator > 0 else prior_mastery
        
        # Apply learning transition: even without demonstrating mastery,
        # practice increases the chance of learning
        # P(L_new) = P(L|obs) + (1 - P(L|obs)) * P(T)
        updated_mastery = posterior + (1 - posterior) * p.p_learn
        
        # Clamp to valid probability range
        return max(0.01, min(0.99, updated_mastery))
    
    def predict_performance(self, mastery: float) -> float:
        """
        Predict probability of correct answer given mastery level.
        
        P(correct) = P(correct|L)*P(L) + P(correct|~L)*P(~L)
                   = (1-slip)*mastery + guess*(1-mastery)
        """
        p = self.params
        return (1 - p.p_slip) * mastery + p.p_guess * (1 - mastery)
    
    def get_difficulty_for_mastery(self, mastery: float) -> int:
        """
        Recommend question difficulty based on mastery level.
        
        Maps mastery probability to difficulty 1-10.
        Target: ~70% success rate for optimal learning (zone of proximal development)
        """
        # Mastery 0.3 -> difficulty 3
        # Mastery 0.7 -> difficulty 7
        # Linear mapping with slight adjustment for challenge
        base_difficulty = int(mastery * 10)
        
        # Slightly harder to promote growth
        target_difficulty = min(10, base_difficulty + 1)
        
        return max(1, target_difficulty)
    
    def estimate_band_score(self, skill_masteries: dict) -> float:
        """
        Estimate IELTS Reading band score from skill masteries.
        
        Args:
            skill_masteries: Dict of {skill_category: mastery_probability}
            
        Returns:
            Estimated band score (4.0 - 9.0)
        """
        if not skill_masteries:
            return 4.0
        
        # Weighted average of masteries
        # TF/NG and Headings are slightly more important
        weights = {
            "TF_NG": 0.35,
            "HEADINGS": 0.35,
            "SUMMARY": 0.30
        }
        
        weighted_sum = 0
        total_weight = 0
        
        for category, mastery in skill_masteries.items():
            weight = weights.get(category, 0.33)
            weighted_sum += mastery * weight
            total_weight += weight
        
        avg_mastery = weighted_sum / total_weight if total_weight > 0 else 0.3
        
        # Map mastery (0-1) to band (4-9)
        # 0.0 mastery -> 4.0 band
        # 1.0 mastery -> 9.0 band
        band_score = 4.0 + avg_mastery * 5.0
        
        # Round to nearest 0.5
        return round(band_score * 2) / 2


# Singleton instance for use across the app
knowledge_tracer = KnowledgeTracer()
