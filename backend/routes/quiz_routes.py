"""
Quiz routes — generation, retrieval, and answer submission.
"""
import logging
import os
import shutil
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.database.database import get_db
from backend.database.schemas import (
    GenerateQuizResponse,
    QuizOut,
    QuizSummary,
    QuestionOut,
    SubmitAnswersRequest,
    SubmitAnswersResponse,
)
from backend.services import ai_service, pdf_service, quiz_service, scoring_service
from backend.utils.helpers import sanitize_filename

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["quiz"])


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@router.get("/health")
def health_check():
    return {"status": "ok", "message": "AI Quiz Generator is running."}


# ---------------------------------------------------------------------------
# Generate Quiz — Topic
# ---------------------------------------------------------------------------

@router.post("/quiz/generate/topic", response_model=GenerateQuizResponse)
def generate_quiz_from_topic(
    topic: str = Form(...),
    user_name: str = Form(default="Student"),
    user_email: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    question_count: int = Form(default=10),
    question_type: str = Form(default="Mixed"),
    difficulty: str = Form(default="Medium"),
    db: Session = Depends(get_db),
):
    """Generate a quiz from a user-provided topic string."""
    topic = topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    question_count = max(1, min(question_count, 50))

    try:
        ai_result = ai_service.generate_questions(
            source_material=topic,
            source_type="topic",
            question_count=question_count,
            question_type=question_type,
            difficulty=difficulty,
        )
    except RuntimeError as e:
        logger.error("AI Generation error: %s", e)
        raise HTTPException(status_code=502, detail=str(e))

    # Safe user identification
    target_user_id = None
    if user_id and str(user_id).isdigit():
        target_user_id = int(user_id)

    user = None
    if target_user_id:
        from backend.database.models import User
        user = db.query(User).filter(User.id == target_user_id).first()
    if not user:
        user = quiz_service.get_or_create_user(db, name=user_name, email=user_email)

    # Save quiz + questions
    saved_quiz = quiz_service.save_quiz_and_questions(
        db=db,
        ai_response=ai_result,
        source_type="topic",
        source_name=topic,
        difficulty=difficulty,
        question_type=question_type,
        question_count=question_count,
        user_id=user.id,
    )

    return GenerateQuizResponse(
        quiz_id=saved_quiz.id,
        title=saved_quiz.title,
        question_count=saved_quiz.question_count,
    )


# ---------------------------------------------------------------------------
# Generate Quiz — PDF Upload
# ---------------------------------------------------------------------------

@router.post("/quiz/generate/pdf", response_model=GenerateQuizResponse)
async def generate_quiz_from_pdf(
    file: UploadFile = File(...),
    user_name: str = Form(default="Student"),
    user_email: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    question_count: int = Form(default=10),
    question_type: str = Form(default="Mixed"),
    difficulty: str = Form(default="Medium"),
    db: Session = Depends(get_db),
):
    """Generate a quiz by extracting text from an uploaded PDF."""
    settings = get_settings()

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported. Please upload a .pdf file.",
        )

    content = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_size_mb} MB.",
        )

    safe_name = sanitize_filename(file.filename)
    uploads_dir = Path(settings.uploads_dir)
    uploads_dir.mkdir(exist_ok=True)
    temp_path = uploads_dir / safe_name

    try:
        with open(temp_path, "wb") as f:
            f.write(content)

        # Extract text
        try:
            text = pdf_service.extract_text_from_pdf(str(temp_path))
        except (ValueError, FileNotFoundError) as e:
            raise HTTPException(status_code=422, detail=str(e))

    finally:
        # Remove temp file
        if temp_path.exists():
            temp_path.unlink()

    question_count = max(1, min(question_count, 50))

    try:
        ai_result = ai_service.generate_questions(
            source_material=text,
            source_type="pdf",
            question_count=question_count,
            question_type=question_type,
            difficulty=difficulty,
        )
    except RuntimeError as e:
        logger.error("AI Generation error: %s", e)
        raise HTTPException(status_code=502, detail=str(e))

    # Safe user identification
    target_user_id = None
    if user_id and str(user_id).isdigit():
        target_user_id = int(user_id)

    user = None
    if target_user_id:
        from backend.database.models import User
        user = db.query(User).filter(User.id == target_user_id).first()
    if not user:
        user = quiz_service.get_or_create_user(db, name=user_name, email=user_email)

    saved_quiz = quiz_service.save_quiz_and_questions(
        db=db,
        ai_response=ai_result,
        source_type="pdf",
        source_name=safe_name,
        difficulty=difficulty,
        question_type=question_type,
        question_count=question_count,
        user_id=user.id,
    )

    return GenerateQuizResponse(
        quiz_id=saved_quiz.id,
        title=saved_quiz.title,
        question_count=saved_quiz.question_count,
    )


# ---------------------------------------------------------------------------
# Get Quiz (without correct answers)
# ---------------------------------------------------------------------------

@router.get("/quiz/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Return quiz details and questions. Correct answers are NOT included."""
    quiz = quiz_service.get_quiz_with_questions(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail=f"Quiz {quiz_id} not found.")

    # Build response — strip correct_answer
    questions_out = []
    for q in sorted(quiz.questions, key=lambda x: x.order_index):
        questions_out.append(
            QuestionOut(
                id=q.id,
                question_text=q.question_text,
                question_type=q.question_type,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                difficulty=q.difficulty,
                order_index=q.order_index,
            )
        )

    return QuizOut(
        id=quiz.id,
        title=quiz.title,
        source_type=quiz.source_type,
        source_name=quiz.source_name,
        difficulty=quiz.difficulty,
        question_type=quiz.question_type,
        question_count=quiz.question_count,
        created_at=quiz.created_at,
        questions=questions_out,
    )


# ---------------------------------------------------------------------------
# Submit Answers
# ---------------------------------------------------------------------------

@router.post("/quiz/{quiz_id}/submit", response_model=SubmitAnswersResponse)
def submit_answers(
    quiz_id: int,
    payload: SubmitAnswersRequest,
    db: Session = Depends(get_db),
):
    """Accept student answers, score them, and save the result."""
    quiz = quiz_service.get_quiz_with_questions(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail=f"Quiz {quiz_id} not found.")

    if not payload.answers:
        raise HTTPException(status_code=400, detail="No answers submitted.")

    user = quiz_service.get_or_create_user(
        db=db,
        name=payload.user_name or "Student",
        email=payload.user_email
    )

    review, correct, wrong, unanswered = scoring_service.score_answers(
        db=db,
        quiz_id=quiz_id,
        submitted=payload.answers,
    )

    result = scoring_service.save_result(
        db=db,
        quiz_id=quiz_id,
        correct=correct,
        wrong=wrong,
        unanswered=unanswered,
        user_name=user.name,
        user_id=user.id,
        review=review,
    )

    total = correct + wrong + unanswered
    percentage = round((correct / total) * 100, 1) if total > 0 else 0.0

    # -----------------------------------------------------------------------
    # Database Challenge Processing
    return SubmitAnswersResponse(
        result_id=result.id,
        quiz_id=quiz_id,
        score=correct,
        correct_answers=correct,
        wrong_answers=wrong,
        unanswered=unanswered,
        percentage=percentage,
        message=f"Quiz completed! You scored {correct}/{total} ({percentage}%)",
        review=review,
    )


# ---------------------------------------------------------------------------
# List quizzes
# ---------------------------------------------------------------------------

@router.get("/quizzes", response_model=List[QuizSummary])
def list_quizzes(
    user_name: Optional[str] = None,
    user_email: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Return a list of quizzes (filtered by user if user_name, user_email, or user_id provided)."""
    quizzes = quiz_service.list_quizzes(db, user_id=user_id, user_email=user_email, user_name=user_name)
    return quizzes



# ---------------------------------------------------------------------------
# Delete Quiz
# ---------------------------------------------------------------------------

@router.delete("/quiz/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Delete a quiz and all associated questions and results."""
    from backend.database.models import Quiz
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail=f"Quiz {quiz_id} not found.")
    db.delete(quiz)
    db.commit()
    return {"status": "ok", "message": f"Quiz {quiz_id} deleted successfully."}

