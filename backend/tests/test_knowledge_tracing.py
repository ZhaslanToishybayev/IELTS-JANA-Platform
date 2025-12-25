"""Tests for the Bayesian Knowledge Tracing implementation."""

import pytest
from app.ml.knowledge_tracing import KnowledgeTracer, BKTParams


class TestKnowledgeTracer:
    """Test suite for BKT."""
    
    def setup_method(self):
        """Set up test tracer."""
        self.tracer = KnowledgeTracer()
    
    def test_mastery_increases_on_correct(self):
        """Correct answers should increase mastery."""
        prior = 0.3
        posterior = self.tracer.update_mastery(prior, is_correct=True)
        assert posterior > prior
    
    def test_mastery_decreases_on_incorrect(self):
        """Incorrect answers should decrease mastery (or increase less)."""
        prior = 0.7
        posterior = self.tracer.update_mastery(prior, is_correct=False)
        # With learning transition, might not decrease but should be less than if correct
        correct_posterior = self.tracer.update_mastery(prior, is_correct=True)
        assert posterior < correct_posterior
    
    def test_mastery_bounded(self):
        """Mastery should stay within 0.01-0.99."""
        # Test upper bound
        high_mastery = 0.99
        posterior = self.tracer.update_mastery(high_mastery, is_correct=True)
        assert posterior <= 0.99
        
        # Test lower bound
        low_mastery = 0.01
        posterior = self.tracer.update_mastery(low_mastery, is_correct=False)
        assert posterior >= 0.01
    
    def test_difficulty_mapping(self):
        """Difficulty should scale with mastery."""
        low_diff = self.tracer.get_difficulty_for_mastery(0.2)
        high_diff = self.tracer.get_difficulty_for_mastery(0.8)
        
        assert low_diff < high_diff
        assert 1 <= low_diff <= 10
        assert 1 <= high_diff <= 10
    
    def test_band_estimation(self):
        """Band score should be between 4 and 9."""
        # Low mastery
        low_band = self.tracer.estimate_band_score({"TF_NG": 0.2, "HEADINGS": 0.2, "SUMMARY": 0.2})
        assert 4.0 <= low_band <= 5.0
        
        # High mastery
        high_band = self.tracer.estimate_band_score({"TF_NG": 0.9, "HEADINGS": 0.9, "SUMMARY": 0.9})
        assert 8.0 <= high_band <= 9.0
    
    def test_predict_performance(self):
        """Performance prediction should be between 0 and 1."""
        pred = self.tracer.predict_performance(0.5)
        assert 0 <= pred <= 1
        
        # Higher mastery = higher predicted performance
        low_pred = self.tracer.predict_performance(0.2)
        high_pred = self.tracer.predict_performance(0.8)
        assert high_pred > low_pred


class TestBKTParams:
    """Test parameter validation."""
    
    def test_default_params(self):
        """Default params should be reasonable."""
        params = BKTParams()
        assert 0 < params.p_init < 1
        assert 0 < params.p_learn < 1
        assert 0 < params.p_guess < 1
        assert 0 < params.p_slip < 1
    
    def test_custom_params(self):
        """Custom params should be applied."""
        params = BKTParams(p_init=0.5, p_learn=0.2)
        tracer = KnowledgeTracer(params)
        assert tracer.params.p_init == 0.5
        assert tracer.params.p_learn == 0.2
