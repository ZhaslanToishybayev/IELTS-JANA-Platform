from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime


# ============== User Schemas ==============

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    xp: int
    level: int
    current_streak: int
    longest_streak: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserGamificationProfile(BaseModel):
    xp: int
    level: int
    xp_to_next_level: int
    current_streak: int
    longest_streak: int
    total_questions_answered: int
    accuracy_rate: float


# ============== Auth Schemas ==============

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# ============== Skill Schemas ==============

class SkillBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None


class SkillResponse(SkillBase):
    id: int
    mastery_threshold: float
    
    class Config:
        from_attributes = True


class SkillMasteryResponse(BaseModel):
    skill: SkillResponse
    mastery_probability: float
    attempts_count: int
    correct_count: int
    is_unlocked: bool
    
    class Config:
        from_attributes = True


# ============== Question Schemas ==============

class QuestionBase(BaseModel):
    passage: str
    passage_title: Optional[str] = None
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    difficulty: int = Field(default=5, ge=1, le=10)


class QuestionCreate(QuestionBase):
    skill_id: int
    correct_answer: str
    explanation: Optional[str] = None


class QuestionResponse(QuestionBase):
    id: int
    skill_id: int
    
    class Config:
        from_attributes = True


class QuestionWithAnswer(QuestionResponse):
    correct_answer: str
    explanation: Optional[str] = None


# ============== Attempt Schemas ==============

class AttemptCreate(BaseModel):
    question_id: int
    user_answer: str
    response_time_ms: int = Field(..., ge=0)


class AttemptResponse(BaseModel):
    id: int
    question_id: int
    user_answer: str
    is_correct: bool
    response_time_ms: int
    xp_earned: int
    created_at: datetime
    
    # Feedback
    correct_answer: str
    explanation: Optional[str] = None
    
    # Updated stats
    new_xp: int
    new_level: int
    level_up: bool
    new_streak: int
    mastery_change: float
    
    class Config:
        from_attributes = True


# ============== Dashboard Schemas ==============

class SkillProgress(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    mastery_probability: float
    attempts_count: int
    accuracy_rate: float
    is_unlocked: bool


class DashboardResponse(BaseModel):
    # User info
    username: str
    level: int
    xp: int
    xp_to_next_level: int
    current_streak: int
    
    # Performance
    estimated_band: float
    total_attempts: int
    overall_accuracy: float
    avg_response_time_ms: float
    
    # Skills breakdown
    skills: List[SkillProgress]


class ProgressHistoryItem(BaseModel):
    date: datetime
    estimated_band: float
    accuracy_rate: float
    attempts_count: int
    xp_earned: int


# ============== Skill Tree Schemas ==============

class SkillTreeNode(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    mastery_probability: float
    is_unlocked: bool
    is_mastered: bool
    requires: List[int]  # IDs of prerequisite skills
    children: List[int]  # IDs of skills that require this


class SkillTreeResponse(BaseModel):
    nodes: List[SkillTreeNode]
    total_unlocked: int
    total_mastered: int


# ============== Next Question Schema ==============

class NextQuestionResponse(BaseModel):
    question: QuestionResponse
    target_skill: str
    reason: str  # Why this question was selected
    session_progress: int  # Questions answered in current session


# ============== Writing Schemas ==============

class WritingError(BaseModel):
    original_text: str
    correction: str
    type: str  # 'Grammar', 'Vocabulary', 'Spelling', 'Coherence'
    explanation: str

class SectionScore(BaseModel):
    score: float
    comment: str

class WritingFeedbackResponse(BaseModel):
    band_score: float
    task_response: SectionScore
    coherence_cohesion: SectionScore
    lexical_resource: SectionScore
    grammatical_range: SectionScore
    overall_feedback: str
    improvements: List[str]
    annotated_errors: List[WritingError] = []


# ============== Mock Exam Schemas ==============

class MockSessionCreate(BaseModel):
    pass # No fields needed to start, user_id from auth

class MockSectionUpdate(BaseModel):
    section: str # LISTENING, READING, WRITING
    answers: Dict[str, Any] # { "q_1": "answer", ... }

class MockSessionResponse(BaseModel):
    id: str
    status: str
    current_section: str
    start_time: datetime
    scores: Optional[Dict[str, float]]
    
    class Config:
        from_attributes = True
