"""
Quiz database service — create and retrieve quizzes and questions.
"""
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from backend.database.models import Quiz, Question, User
from backend.database.schemas import AIQuizResponse

logger = logging.getLogger(__name__)


def get_or_create_user(db: Session, name: str, email: Optional[str] = None) -> User:
    """Find an existing user by email or name, or create a new one."""
    user = None
    if email and email.strip():
        user = db.query(User).filter(User.email.ilike(email.strip())).first()
    if not user and name and name.strip():
        user = db.query(User).filter(User.name.ilike(name.strip())).first()
    if not user:
        clean_email = email.strip().lower() if email and email.strip() else f"user_{int(datetime.utcnow().timestamp())}@quizai.com"
        user = User(
            name=name.strip() if name and name.strip() else "Student",
            email=clean_email,
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def save_quiz_and_questions(
    db: Session,
    ai_response: AIQuizResponse,
    source_type: str,
    source_name: str,
    difficulty: str,
    question_type: str,
    question_count: int,
    user_id: Optional[int] = None,
) -> Quiz:
    """
    Persist a Quiz record and all its Question records to database.
    Returns the created Quiz object.
    """
    safe_title = (ai_response.title or "Custom Quiz").strip()[:250]
    safe_source_name = (source_name or "Custom Topic").strip()[:250]

    quiz = Quiz(
        user_id=user_id,
        title=safe_title,
        source_type=source_type,
        source_name=safe_source_name,
        difficulty=difficulty,
        question_type=question_type,
        question_count=len(ai_response.questions),
        created_at=datetime.utcnow(),
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    # Create questions
    for idx, q in enumerate(ai_response.questions):
        opts = q.options or {}
        question = Question(
            quiz_id=quiz.id,
            question_text=q.question_text.strip(),
            question_type=q.question_type,
            option_a=opts.get("A"),
            option_b=opts.get("B"),
            option_c=opts.get("C"),
            option_d=opts.get("D"),
            correct_answer=str(q.correct_answer).strip(),
            explanation=q.explanation or "",
            difficulty=q.difficulty or difficulty,
            order_index=idx,
        )
        db.add(question)

    db.commit()

    # Update actual question count
    quiz.question_count = len(ai_response.questions)
    db.commit()
    db.refresh(quiz)

    logger.info("Saved quiz id=%d with %d questions", quiz.id, len(ai_response.questions))
    return quiz


def get_quiz_with_questions(db: Session, quiz_id: int) -> Optional[Quiz]:
    """Retrieve a quiz along with its questions."""
    return db.query(Quiz).filter(Quiz.id == quiz_id).first()


def get_question_by_id(db: Session, question_id: int) -> Optional[Question]:
    return db.query(Question).filter(Question.id == question_id).first()


def list_quizzes(db: Session, user_id: Optional[int] = None, user_email: Optional[str] = None, user_name: Optional[str] = None, limit: int = 50) -> list:
    query = db.query(Quiz)
    if user_id:
        query = query.filter(Quiz.user_id == user_id)
    elif user_email and user_email.strip():
        user = db.query(User).filter(User.email.ilike(user_email.strip())).first()
        if user:
            query = query.filter(Quiz.user_id == user.id)
        else:
            return []
    elif user_name and user_name.strip() and user_name.strip().lower() not in ("all", "global"):
        user = db.query(User).filter(
            (User.name.ilike(f"%{user_name.strip()}%")) | (User.email.ilike(f"%{user_name.strip()}%"))
        ).first()
        if user:
            query = query.filter(Quiz.user_id == user.id)
        else:
            return []
    else:
        # Strict user isolation: if no user is specified, do not leak generic quizzes
        return []

    return (
        query
        .order_by(Quiz.created_at.desc())
        .limit(limit)
        .all()
    )


