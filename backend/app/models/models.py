from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, UniqueConstraint
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
    
    # Email verification
    is_email_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime, nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True)
    
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
    test_set_id = Column(Integer, ForeignKey("test_sets.id"), nullable=True)
    
    # Module type: READING or LISTENING
    module = Column(String(20), default="READING", nullable=False)
    section = Column(String(50), nullable=True)
    
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
    estimated_band = Column(Float, nullable=True)
    explanation = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    needs_review = Column(Boolean, default=False)
    approved = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    skill = relationship("Skill", back_populates="questions")
    test_set = relationship("TestSet", back_populates="questions")
    attempts = relationship("Attempt", back_populates="question")


class TestSet(Base):
    """A grouped IELTS practice set, such as a reading passage or listening section."""
    __tablename__ = "test_sets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    module = Column(String(20), nullable=False)
    section = Column(String(50), nullable=True)
    instructions = Column(Text, nullable=True)
    passage = Column(Text, nullable=True)
    audio_url = Column(String(500), nullable=True)
    transcript = Column(Text, nullable=True)
    source = Column(String(100), default="original")
    estimated_band = Column(Float, nullable=True)
    time_limit_minutes = Column(Integer, nullable=True)
    needs_review = Column(Boolean, default=False)
    approved = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    questions = relationship("Question", back_populates="test_set")


class Attempt(Base):
    """User attempt on a question."""
    __tablename__ = "attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    diagnostic_session_id = Column(Integer, ForeignKey("diagnostic_sessions.id"), nullable=True)
    
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
    diagnostic_session = relationship("DiagnosticSession", back_populates="attempts")


class DiagnosticSession(Base):
    """Persisted Reading diagnostic lifecycle and result snapshot."""
    __tablename__ = "diagnostic_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module = Column(String(20), default="READING", nullable=False)
    target_questions = Column(Integer, default=10, nullable=False)
    status = Column(String(20), default="in_progress", nullable=False)
    started_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    accuracy = Column(Float, nullable=True)
    estimated_band = Column(Float, nullable=True)
    result_snapshot = Column(JSON, nullable=True)

    user = relationship("User", backref="diagnostic_sessions")
    attempts = relationship("Attempt", back_populates="diagnostic_session")
    issued_questions = relationship("DiagnosticSessionQuestion", back_populates="session")


class DiagnosticSessionQuestion(Base):
    """Question issued to a specific diagnostic session before submission."""
    __tablename__ = "diagnostic_session_questions"
    __table_args__ = (
        UniqueConstraint("session_id", "question_id", name="uq_diagnostic_session_question"),
    )

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("diagnostic_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=True)
    position = Column(Integer, nullable=False)
    served_at = Column(DateTime, server_default=func.now())
    answered_at = Column(DateTime, nullable=True)

    session = relationship("DiagnosticSession", back_populates="issued_questions")
    question = relationship("Question")
    attempt = relationship("Attempt")


class WritingAttempt(Base):
    """Stores IELTS writing submissions and criterion-level feedback."""
    __tablename__ = "writing_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_type = Column(String(20), nullable=False)
    prompt_text = Column(Text, nullable=False)
    essay_text = Column(Text, nullable=False)
    word_count = Column(Integer, default=0)
    time_spent_sec = Column(Integer, nullable=True)
    band_score = Column(Float, default=0.0)
    criterion_scores = Column(JSON, default=dict)
    feedback = Column(JSON, default=dict)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", backref="writing_attempts")


class SpeakingAttempt(Base):
    """Stores IELTS speaking recordings/transcripts and criterion feedback."""
    __tablename__ = "speaking_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt_text = Column(Text, nullable=False)
    audio_path = Column(String(500), nullable=True)
    transcription = Column(Text, nullable=True)
    time_spent_sec = Column(Integer, nullable=True)
    band_score = Column(Float, default=0.0)
    criterion_scores = Column(JSON, default=dict)
    feedback = Column(JSON, default=dict)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", backref="speaking_attempts")


class WritingPrompt(Base):
    """IELTS Writing Task 1/2 prompt bank."""
    __tablename__ = "writing_prompts"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    prompt_text = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)
    word_limit = Column(Integer, default=250)
    time_limit_minutes = Column(Integer, default=40)
    tips = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class SpeakingPrompt(Base):
    """IELTS Speaking Part 1/2/3 prompt bank."""
    __tablename__ = "speaking_prompts"

    id = Column(Integer, primary_key=True, index=True)
    part = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    cue_card = Column(Text, nullable=True)
    questions = Column(JSON, default=list)
    prep_time_sec = Column(Integer, nullable=True)
    speak_time_sec = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class MistakeReview(Base):
    """Persistent mistake log for review sessions."""
    __tablename__ = "mistake_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=True)
    module = Column(String(20), nullable=False)
    question_type = Column(String(50), nullable=False)
    user_answer = Column(String(500), nullable=False)
    correct_answer = Column(String(500), nullable=False)
    explanation = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", backref="mistake_reviews")
    question = relationship("Question")
    attempt = relationship("Attempt")


class StudyPlanItem(Base):
    """Daily study recommendation generated from user performance."""
    __tablename__ = "study_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module = Column(String(20), nullable=False)
    mode = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    reason = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=30)
    priority = Column(Integer, default=1)
    is_completed = Column(Boolean, default=False)
    scheduled_for = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", backref="study_plan_items")


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


class Achievement(Base):
    """Achievement definitions for gamification."""
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)  # e.g., "FIRST_CORRECT", "STREAK_7"
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(100), default="🏆")  # Emoji or icon name
    
    # Achievement category
    category = Column(String(50), nullable=False)  # STREAK, ACCURACY, LEVEL, PROGRESS, SPECIAL
    
    # Requirement to unlock (JSON)
    # e.g., {"type": "streak", "value": 7} or {"type": "accuracy", "value": 0.9, "min_attempts": 50}
    requirement = Column(JSON, nullable=False)
    
    # Reward
    xp_reward = Column(Integer, default=50)
    
    # Rarity: COMMON, UNCOMMON, RARE, EPIC, LEGENDARY
    rarity = Column(String(20), default="COMMON")
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user_achievements = relationship("UserAchievement", back_populates="achievement")


class UserAchievement(Base):
    """Tracks which achievements a user has unlocked."""
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    
    # When unlocked
    unlocked_at = Column(DateTime, server_default=func.now())
    
    # Progress for incomplete achievements (0.0 - 1.0)
    progress = Column(Float, default=1.0)
    
    # Relationships
    user = relationship("User", backref="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")


