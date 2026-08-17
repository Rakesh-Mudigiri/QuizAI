"""
Scoring service — compare student answers against correct answers from the database.

Rules:
- MCQ / True-False: exact string comparison (case-insensitive, stripped).
- Short Answer: keyword matching against expected answer (no Gemini call).
"""
import logging
from datetime import datetime
from typing import List, Tuple, Optional

from sqlalchemy.orm import Session

from backend.database.models import Question, Result
from backend.database.schemas import AnswerItem, AnswerReview

logger = logging.getLogger(__name__)


def _compare_short_answer(student: str, expected: str) -> bool:
    """
    Simple keyword-overlap scoring for short answers.
    Considered correct if the student answer contains enough key words
    from the expected answer (threshold: ≥ 50% of key words),
    accounting for punctuation and antonym prefix contradictions.
    """
    if not student or not student.strip():
        return False

    stop_words = {"uses", "using", "with", "that", "this", "from", "have", "been", "will", "would", "could", "should"}

    # Clean student words
    student_raw_words = [w.strip(".,;:!?\"'()[]") for w in student.lower().split()]
    student_words = set(w for w in student_raw_words if len(w) > 3)

    # Clean expected words
    expected_words = [
        w.strip(".,;:!?\"'()[]") for w in expected.lower().split()
        if len(w) > 3 and w.strip(".,;:!?\"'()[]") not in stop_words
    ]

    if not expected_words:
        return student.strip() != ""

    matches = 0
    contradictions = 0

    for ew in expected_words:
        if ew in student_words:
            matches += 1
        elif any(sw == f"un{ew}" or sw == f"in{ew}" or sw == f"non{ew}" or sw == f"dis{ew}" for sw in student_words):
            contradictions += 1

    effective_matches = max(0, matches - contradictions)
    ratio = effective_matches / len(expected_words)
    return ratio >= 0.5



def score_answers(
    db: Session,
    quiz_id: int,
    submitted: List[AnswerItem],
) -> Tuple[List[AnswerReview], int, int, int]:
    """
    Score the submitted answers.
    Returns: (review_list, correct_count, wrong_count, unanswered_count)
    """
    # Index submitted answers by question_id
    answer_map = {item.question_id: item.selected_answer for item in submitted}

    # Load all questions for this quiz
    questions: List[Question] = (
        db.query(Question)
        .filter(Question.quiz_id == quiz_id)
        .order_by(Question.order_index)
        .all()
    )

    review = []
    correct = 0
    wrong = 0
    unanswered = 0

    for q in questions:
        student_ans = answer_map.get(q.id)

        if student_ans is None or str(student_ans).strip() == "":
            is_correct = False
            unanswered += 1
        elif q.question_type == "short_answer":
            is_correct = _compare_short_answer(
                str(student_ans).strip(),
                str(q.correct_answer).strip(),
            )
            if is_correct:
                correct += 1
            else:
                wrong += 1
        else:
            # MCQ and True/False — exact comparison (case-insensitive)
            is_correct = (
                str(student_ans).strip().upper()
                == str(q.correct_answer).strip().upper()
            )
            if is_correct:
                correct += 1
            else:
                wrong += 1

        review.append(
            AnswerReview(
                question_id=q.id,
                question_text=q.question_text,
                question_type=q.question_type,
                your_answer=student_ans,
                correct_answer=q.correct_answer,
                is_correct=is_correct,
                explanation=q.explanation,
            )
        )

    return review, correct, wrong, unanswered


import json

def save_result(
    db: Session,
    quiz_id: int,
    correct: int,
    wrong: int,
    unanswered: int,
    user_name: str = "Student",
    user_id: Optional[int] = None,
    review: Optional[List[AnswerReview]] = None,
) -> Result:
    """Persist the result to the database."""
    total = correct + wrong + unanswered
    percentage = round((correct / total) * 100, 1) if total > 0 else 0.0

    answers_raw = None
    if review:
        try:
            answers_raw = json.dumps([r.model_dump() for r in review])
        except Exception:
            pass

    result = Result(
        quiz_id=quiz_id,
        user_id=user_id,
        user_name=user_name,
        score=correct,
        correct_answers=correct,
        wrong_answers=wrong,
        unanswered=unanswered,
        percentage=percentage,
        answers_json=answers_raw,
        completed_at=datetime.utcnow(),
    )

    db.add(result)
    db.commit()
    db.refresh(result)
    logger.info(
        "Saved result id=%d for quiz=%d: %d/%d (%.1f%%)",
        result.id, quiz_id, correct, total, percentage,
    )
    return result


def get_result_with_review(db: Session, quiz_id: int):
    """Get the most recent result for a quiz."""
    return (
        db.query(Result)
        .filter(Result.quiz_id == quiz_id)
        .order_by(Result.completed_at.desc())
        .first()
    )
