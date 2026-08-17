"""
Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List, Union, Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Quiz Generation
# ---------------------------------------------------------------------------

class GenerateTopicRequest(BaseModel):
    """Used when user provides a topic (form field, not file upload)."""
    topic: str = Field(..., min_length=2, max_length=500)
    user_name: str = Field(default="Student", max_length=100)
    question_count: int = Field(default=10, ge=1, le=30)
    question_type: str = Field(default="Mixed")   # MCQ, True/False, Short Answer, Mixed
    difficulty: str = Field(default="Medium")     # Easy, Medium, Hard, Mixed


class GenerateQuizResponse(BaseModel):
    quiz_id: int
    title: str
    question_count: int
    message: str = "Quiz generated successfully!"


# ---------------------------------------------------------------------------
# Question Schemas (AI Generated)
# ---------------------------------------------------------------------------

class AIQuestion(BaseModel):
    """Schema for a single AI-generated question."""
    question_text: str
    question_type: str          # mcq, true_false, short_answer
    options: Optional[dict]     # {"A": "...", "B": "...", ...} or null
    correct_answer: str
    explanation: Optional[str] = ""
    difficulty: Optional[str] = "Medium"

class AIQuizResponse(BaseModel):
    """Full AI quiz response schema."""
    title: str
    questions: List[AIQuestion]

# Aliases for compatibility
GeminiQuestion = AIQuestion
GeminiQuizResponse = AIQuizResponse


# ---------------------------------------------------------------------------
# Quiz Display (hides correct answers)
# ---------------------------------------------------------------------------

class QuestionOut(BaseModel):
    id: int
    question_text: str
    question_type: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    difficulty: Optional[str]
    order_index: int

    class Config:
        from_attributes = True


class QuizOut(BaseModel):
    id: int
    title: str
    source_type: str
    source_name: Optional[str]
    difficulty: str
    question_type: str
    question_count: int
    created_at: datetime
    questions: List[QuestionOut]

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Quiz List (no questions)
# ---------------------------------------------------------------------------

class QuizSummary(BaseModel):
    id: int
    title: str
    source_type: str
    source_name: Optional[str]
    difficulty: str
    question_type: str
    question_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Answer Submission
# ---------------------------------------------------------------------------

class AnswerItem(BaseModel):
    question_id: int
    selected_answer: Optional[str] = None   # None = unanswered


class SubmitAnswersRequest(BaseModel):
    answers: List[AnswerItem]
    user_name: Optional[str] = "Student"
    user_id: Optional[Union[int, str]] = None
    user_email: Optional[str] = None


class AnswerReview(BaseModel):
    question_id: int
    question_text: str
    question_type: str
    your_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    explanation: Optional[str]


class SubmitAnswersResponse(BaseModel):
    result_id: int
    quiz_id: int
    score: int
    correct_answers: int
    wrong_answers: int
    unanswered: int
    percentage: float
    message: str
    review: List[AnswerReview]


# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------

class ResultOut(BaseModel):
    id: int
    quiz_id: int
    quiz_title: str
    user_name: Optional[str]
    score: int
    correct_answers: int
    wrong_answers: int
    unanswered: int
    percentage: float
    completed_at: datetime
    review: List[AnswerReview]

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Profile Update Schema
# ---------------------------------------------------------------------------

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    target_exam: Optional[str] = None
    daily_goal: Optional[int] = None
    avatar: Optional[str] = None


