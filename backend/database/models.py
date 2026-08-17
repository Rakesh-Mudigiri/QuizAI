"""
SQLAlchemy ORM models — defines all database tables.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, DateTime, Text
)
from sqlalchemy.orm import relationship
from backend.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(100), nullable=True, default="Computer Science Student")
    field = Column(String(100), nullable=True, default="Data Structures & Algorithms")
    college = Column(String(150), nullable=True, default="Institute of Technology")
    bio = Column(Text, nullable=True)
    grad_year = Column(String(10), nullable=True, default="2026")
    avatar = Column(String(500), nullable=True)
    is_verified = Column(Integer, default=1)  # 1 for verified, 0 for pending
    created_at = Column(DateTime, default=datetime.utcnow)

    quizzes = relationship("Quiz", back_populates="user")
    results = relationship("Result", back_populates="user")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False)
    source_type = Column(String(20), nullable=False)   # "pdf" or "topic"
    source_name = Column(String(255), nullable=True)   # filename or topic name
    difficulty = Column(String(20), nullable=False, default="Medium")
    question_type = Column(String(30), nullable=False, default="Mixed")
    question_count = Column(Integer, nullable=False, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    results = relationship("Result", back_populates="quiz", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(20), nullable=False)   # "mcq", "true_false", "short_answer"
    option_a = Column(Text, nullable=True)
    option_b = Column(Text, nullable=True)
    option_c = Column(Text, nullable=True)
    option_d = Column(Text, nullable=True)
    correct_answer = Column(String(500), nullable=False)
    explanation = Column(Text, nullable=True)
    difficulty = Column(String(20), nullable=True)
    order_index = Column(Integer, nullable=False, default=0)

    quiz = relationship("Quiz", back_populates="questions")


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user_name = Column(String(100), nullable=True)
    score = Column(Integer, nullable=False, default=0)
    correct_answers = Column(Integer, nullable=False, default=0)
    wrong_answers = Column(Integer, nullable=False, default=0)
    unanswered = Column(Integer, nullable=False, default=0)
    percentage = Column(Float, nullable=False, default=0.0)
    answers_json = Column(Text, nullable=True)
    completed_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="results")
    user = relationship("User", back_populates="results")


