from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class User(Base):
    """User account model with gamification stats."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Gamification stats
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_practice_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    attempts = relationship("Attempt", back_populates="user")
    skill_masteries = relationship("UserSkillMastery", back_populates="user")
    dashboard_metrics = relationship("DashboardMetric", back_populates="user")


class Skill(Base):
    """Reading skill categories for tracking mastery."""
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # TF_NG, HEADINGS, SUMMARY
    description = Column(Text, nullable=True)
    parent_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    mastery_threshold = Column(Float, default=0.7)  # Required to "unlock" next skill
    
    # Relationships
    questions = relationship("Question", back_populates="skill")
    user_masteries = relationship("UserSkillMastery", back_populates="skill")
    parent = relationship("Skill", remote_side=[id], backref="children")


class Question(Base):
    """Practice questions with passages or audio."""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    
    # Module type: READING or LISTENING
    module = Column(String(20), default="READING", nullable=False)
    
    # Question content
    passage = Column(Text, nullable=True)  # Text for reading, transcript reference for listening
    passage_title = Column(String(255), nullable=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)  # TF_NG, HEADINGS, SUMMARY, MCQ, FILL_BLANK
    
    # Audio for listening module
    audio_url = Column(String(500), nullable=True)  # URL to audio file
    audio_duration_sec = Column(Integer, nullable=True)  # Duration in seconds
    
    # Answer options (JSON array for multiple choice)
    options = Column(JSON, nullable=True)
    correct_answer = Column(String(500), nullable=False)
    
    # Difficulty and feedback
    difficulty = Column(Integer, default=5)  # 1-10 scale
    explanation = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    skill = relationship("Skill", back_populates="questions")
    attempts = relationship("Attempt", back_populates="question")


class Attempt(Base):
    """User attempt on a question."""
    __tablename__ = "attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    # Attempt data
    user_answer = Column(String(500), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer, nullable=False)  # Time to answer in milliseconds
    
    # XP earned for this attempt
    xp_earned = Column(Integer, default=0)
    
    # Timestamp
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="attempts")
    question = relationship("Question", back_populates="attempts")


class UserSkillMastery(Base):
    """Tracks user's mastery probability per skill."""
    __tablename__ = "user_skill_masteries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    
    # Bayesian Knowledge Tracing state
    mastery_probability = Column(Float, default=0.3)  # P(L) - probability of mastery
    attempts_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    
    # Performance metrics
    avg_response_time_ms = Column(Float, nullable=True)
    last_attempt_at = Column(DateTime, nullable=True)
    
    # Skill tree state
    is_unlocked = Column(Boolean, default=True)  # Basic skills start unlocked
    
    # Relationships
    user = relationship("User", back_populates="skill_masteries")
    skill = relationship("Skill", back_populates="user_masteries")
    
    class Config:
        # Unique constraint on user_id + skill_id
        pass


class DashboardMetric(Base):
    """Daily aggregated metrics for dashboard."""
    __tablename__ = "dashboard_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    
    # Aggregated metrics
    estimated_band = Column(Float, nullable=True)
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    accuracy_rate = Column(Float, nullable=True)
    avg_response_time_ms = Column(Float, nullable=True)
    xp_earned = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="dashboard_metrics")


class Vocabulary(Base):
    """Vocabulary words for SRS study."""
    __tablename__ = "vocabulary"
    
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(255), index=True, nullable=False)
    definition = Column(Text, nullable=False)
    context_sentence = Column(Text, nullable=True) # The sentence where the word was found
    
    # Relationships
    user_associations = relationship("UserVocabulary", back_populates="vocabulary")


class UserVocabulary(Base):
    """Joint table for User <-> Vocabulary with SRS state."""
    __tablename__ = "user_vocabulary"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vocab_id = Column(Integer, ForeignKey("vocabulary.id"), nullable=False)
    
    # SRS Spaced Repetition State (SM-2 based)
    next_review_at = Column(DateTime, nullable=False)
    interval = Column(Integer, default=0) # Days until next review
    ease_factor = Column(Float, default=2.5) # Difficulty multiplier
    repetitions = Column(Integer, default=0) # Consecutive correct answers
    is_mastered = Column(Boolean, default=False)
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="vocabulary_items")
    vocabulary = relationship("Vocabulary", back_populates="user_associations")


class MockTestSession(Base):
    """Tracks a full IELTS mock exam status."""
    __tablename__ = "mock_test_sessions"
    
    id = Column(String(36), primary_key=True, index=True) # UUID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    start_time = Column(DateTime, server_default=func.now())
    end_time = Column(DateTime, nullable=True)
    
    # Status: IN_PROGRESS, COMPLETED, ABANDONED
    status = Column(String(20), default="IN_PROGRESS")
    
    # Current Section: LISTENING, READING, WRITING
    current_section = Column(String(20), default="LISTENING")
    
    # Stored State (JSON)
    # { "QuestionID": "UserAnswer" }
    answers = Column(JSON, default={})
    
    # Scores (JSON)
    # { "listening": 6.5, "reading": 7.0, "writing": 6.0, "speaking": null, "overall": 6.5 }
    scores = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", backref="mock_sessions")

