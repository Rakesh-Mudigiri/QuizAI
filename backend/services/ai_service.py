"""
AI Quiz Generation service — powered by Groq Cloud AI Engine (Llama 3.3 / Llama 3.1) with dual-key fallback.
"""
import json
import logging
import re
import time
from typing import Optional

from groq import Groq
import httpx

from backend.config import get_settings
from backend.database.schemas import AIQuizResponse, AIQuestion

logger = logging.getLogger(__name__)


def _get_groq_client(api_key: Optional[str] = None) -> Groq:
    settings = get_settings()
    key = api_key or settings.groq_api_key
    if not key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Please add it to your .env file."
        )
    http_client = httpx.Client()
    return Groq(api_key=key, http_client=http_client)


def _build_prompt(
    source_material: str,
    source_type: str,   # "pdf" or "topic"
    question_count: int,
    question_type: str,   # MCQ, True/False, Short Answer, Mixed
    difficulty: str,
) -> str:
    """Build a strict structured prompt for AI with buffer to ensure exact count."""
    buffer_count = question_count + 2 if question_count >= 15 else (question_count + 1 if question_count >= 8 else question_count)

    if source_type == "pdf":
        material_instruction = (
            "Use ONLY the following study material to generate questions. "
            "Do not add facts that are not present in the material.\n\n"
            f"--- STUDY MATERIAL START ---\n{source_material}\n--- STUDY MATERIAL END ---"
        )
    else:
        material_instruction = (
            f"Generate educational questions about the topic: \"{source_material}\". "
            "The questions must be factually accurate and educationally appropriate."
        )

    # Determine type instruction
    if question_type == "MCQ":
        type_instruction = (
            "Generate ONLY Multiple Choice Questions (MCQ). "
            "Each MCQ must have exactly 4 options (A, B, C, D). Only one option is correct."
        )
        type_format = """
For MCQ:
{
  "question_text": "...",
  "question_type": "mcq",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "correct_answer": "B",
  "explanation": "Brief explanation of the correct answer.",
  "difficulty": "Easy|Medium|Hard"
}"""
    elif question_type == "True/False":
        type_instruction = (
            "Generate ONLY True/False questions. "
            "Options must be A=True and B=False. correct_answer must be A or B."
        )
        type_format = """
For True/False:
{
  "question_text": "...",
  "question_type": "true_false",
  "options": {"A": "True", "B": "False"},
  "correct_answer": "A",
  "explanation": "Brief explanation.",
  "difficulty": "Easy|Medium|Hard"
}"""
    elif question_type == "Short Answer":
        type_instruction = (
            "Generate ONLY Short Answer questions. "
            "options must be null. correct_answer must be a concise expected answer (1-3 sentences)."
        )
        type_format = """
For Short Answer:
{
  "question_text": "...",
  "question_type": "short_answer",
  "options": null,
  "correct_answer": "Expected answer text here.",
  "explanation": "Brief explanation.",
  "difficulty": "Easy|Medium|Hard"
}"""
    else:  # Mixed
        type_instruction = (
            "Generate a MIX of question types: some MCQ, some True/False, some Short Answer. "
            "Aim for roughly equal proportions. "
            "MCQs must have 4 options A-D. True/False must have A=True, B=False. "
            "Short Answer options must be null."
        )
        type_format = """
For MCQ: question_type = "mcq", options = {"A":..., "B":..., "C":..., "D":...}, correct_answer = letter (A/B/C/D)
For True/False: question_type = "true_false", options = {"A":"True","B":"False"}, correct_answer = "A" or "B"
For Short Answer: question_type = "short_answer", options = null, correct_answer = expected text"""

    prompt = f"""You are an expert educational quiz generator.

TASK:
{material_instruction}

REQUIREMENTS:
- You MUST generate at least {buffer_count} distinct questions (Index 1 to {buffer_count}) to ensure exactly {question_count} verified questions are delivered.
- Do NOT stop early. Verify that the "questions" array contains at least {buffer_count} complete items.
- {type_instruction}
- Overall difficulty level: {difficulty}
- All questions must be unique (no duplicates).
- Every question must have a non-empty correct_answer.
- Every question must have a non-empty explanation.
- Do NOT number the questions inside question_text.

OUTPUT FORMAT:
Return ONLY valid JSON in this exact structure (no markdown, no code blocks, no extra text):

{{
  "title": "A descriptive title for this quiz",
  "questions": [
    {type_format}
  ]
}}

IMPORTANT: Return ONLY the JSON object. No markdown fences. No extra commentary.
Generate the complete list of {buffer_count} questions now.
"""
    return prompt


def _extract_json_from_text(text: str) -> str:
    """Try to find a JSON object in text that may have markdown fences."""
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```\s*$", "", text, flags=re.MULTILINE)
    text = text.strip()

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def _validate_questions(questions: list, question_count: int) -> list:
    """Validate, sanitize, and auto-repair parsed questions."""
    valid = []
    seen_texts = set()

    for q in questions:
        qt = q.question_type.lower().strip() if q.question_type else "mcq"

        # Normalize type name
        if qt in ("mcq", "multiple_choice", "multiple choice", "multiple-choice"):
            qt = "mcq"
        elif qt in ("true_false", "truefalse", "true/false", "boolean"):
            qt = "true_false"
        elif qt in ("short_answer", "shortanswer", "short answer", "text"):
            qt = "short_answer"
        else:
            qt = "mcq"

        q.question_type = qt

        # Skip empty question text
        if not q.question_text or not q.question_text.strip():
            continue

        # Skip duplicates
        text_key = q.question_text.strip().lower()
        if text_key in seen_texts:
            continue
        seen_texts.add(text_key)

        # Validate & repair MCQ
        if qt == "mcq":
            if isinstance(q.options, list):
                letters = ["A", "B", "C", "D", "E", "F"]
                q.options = {letters[idx]: str(val) for idx, val in enumerate(q.options) if idx < 4}

            if not isinstance(q.options, dict) or len(q.options) < 2:
                logger.warning("MCQ missing options, skipping: %s", q.question_text[:40])
                continue

            # Normalize option keys to uppercase A, B, C, D
            norm_options = {}
            for k, v in q.options.items():
                k_clean = str(k).strip().upper()
                if k_clean in ("1", "0"):
                    k_clean = "A"
                elif k_clean == "2":
                    k_clean = "B"
                elif k_clean == "3":
                    k_clean = "C"
                elif k_clean == "4":
                    k_clean = "D"
                norm_options[k_clean] = str(v)
            q.options = norm_options

            # Auto-repair if only 3 options were provided
            if len(q.options) == 3:
                for fallback_key in ("D", "C", "B"):
                    if fallback_key not in q.options:
                        q.options[fallback_key] = "None of the above"
                        break

            if len(q.options) < 4:
                letters = ["A", "B", "C", "D"]
                for let in letters:
                    if let not in q.options:
                        q.options[let] = f"Option {let}"

            # Ensure correct_answer is one of the keys or mapped
            ans_str = str(q.correct_answer).strip().upper()
            if ans_str not in q.options:
                matched_key = None
                for k, v in q.options.items():
                    if str(v).strip().lower() == str(q.correct_answer).strip().lower():
                        matched_key = k
                        break
                q.correct_answer = matched_key if matched_key else "A"
            else:
                q.correct_answer = ans_str

        # Validate True/False
        elif qt == "true_false":
            if q.options is None or not isinstance(q.options, dict):
                q.options = {"A": "True", "B": "False"}
            ans_upper = str(q.correct_answer).strip().upper()
            if ans_upper in ("TRUE", "T", "YES", "1", "A"):
                q.correct_answer = "A"
            elif ans_upper in ("FALSE", "F", "NO", "0", "B"):
                q.correct_answer = "B"
            elif ans_upper not in ("A", "B"):
                q.correct_answer = "A"

        # Skip empty correct answer
        if not q.correct_answer or not str(q.correct_answer).strip():
            q.correct_answer = "A" if qt in ("mcq", "true_false") else "Answer"

        if not q.explanation or not str(q.explanation).strip():
            q.explanation = "Correct answer based on study material."

        valid.append(q)

    return valid


def _generate_with_groq(prompt: str, source_material: str, question_count: int, api_key: Optional[str] = None) -> AIQuizResponse:
    """Generate quiz questions using Groq Cloud AI Engine."""
    settings = get_settings()
    client = _get_groq_client(api_key=api_key)

    calc_tokens = min(3500, max(1200, question_count * 280))

    logger.info("Calling Groq API with model: %s for %d questions (max_tokens=%d)", settings.groq_model, question_count, calc_tokens)
    completion = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {
                "role": "system",
                "content": "You are a professional educational quiz generator. Always respond in valid JSON matching the requested structure.",
            },
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
        max_tokens=calc_tokens,
    )

    raw_text = completion.choices[0].message.content
    logger.debug("Groq raw response: %s", raw_text[:500])

    json_str = _extract_json_from_text(raw_text)
    data = json.loads(json_str)

    raw_questions = [AIQuestion(**q) for q in data.get("questions", [])]
    title = data.get("title", f"Quiz on {source_material[:50]}")

    valid_questions = _validate_questions(raw_questions, question_count)
    if not valid_questions:
        raise ValueError("No valid questions returned by Groq.")

    if len(valid_questions) >= question_count:
        valid_questions = valid_questions[:question_count]
    else:
        logger.warning("Groq returned %d questions (target %d).", len(valid_questions), question_count)

    logger.info("Groq returned %d valid questions successfully (requested %d)", len(valid_questions), question_count)
    return AIQuizResponse(title=title, questions=valid_questions)


def _generate_single_pass(
    source_material: str,
    source_type: str,
    target_count: int,
    question_type: str,
    difficulty: str,
    focus_note: str = ""
) -> AIQuizResponse:
    """Generate a single batch of questions with multi-key and model fallback."""
    settings = get_settings()
    material = source_material
    if focus_note:
        material = f"{source_material}\n\n[Focus Area: {focus_note}]"

    prompt = _build_prompt(material, source_type, target_count, question_type, difficulty)
    result_quiz = None

    # Build model candidate list starting with user-configured model, followed by known Groq models
    candidate_models = [
        settings.groq_model,
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
    ]
    models = []
    for m in candidate_models:
        if m and m not in models:
            models.append(m)

    keys = [k for k in [settings.groq_api_key, settings.groq_api_key_backup] if k]
    last_error = None
    for key in keys:
        for model in models:
            try:
                orig_model = settings.groq_model
                settings.groq_model = model
                logger.info("Attempting Groq generation with model %s...", model)
                result_quiz = _generate_with_groq(prompt, source_material, target_count, api_key=key)
                settings.groq_model = orig_model
                if result_quiz and len(result_quiz.questions) > 0:
                    return result_quiz
            except Exception as e:
                last_error = e
                logger.warning("Groq attempt with model %s failed: %s", model, e)
                continue

    if result_quiz is None:
        err_msg = f": {last_error}" if last_error else ""
        raise RuntimeError(f"Groq AI generation failed. Please check your GROQ_API_KEY in .env or try a shorter text.{err_msg}")

    return result_quiz


def generate_questions(
    source_material: str,
    source_type: str,
    question_count: int,
    question_type: str,
    difficulty: str,
    max_retries: int = 3,
) -> AIQuizResponse:
    """
    Generate quiz questions using Groq Cloud AI Engine.
    For requests > 25 questions, seamlessly generates in dual batches
    to avoid LLM output truncation and guarantee the exact requested count.
    """
    if source_material.lower().startswith("mock"):
        mock_questions = []
        for i in range(question_count):
            mock_questions.append(
                AIQuestion(
                    question_text=f"Mock Question {i+1} about {source_material}?",
                    question_type="mcq",
                    options={"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
                    correct_answer="A",
                    explanation=f"This is a mock explanation for question {i+1}.",
                    difficulty=difficulty
                )
            )
        return AIQuizResponse(
            title=f"Mock Quiz: {source_material}",
            questions=mock_questions
        )

    if question_count <= 25:
        result_quiz = _generate_single_pass(
            source_material, source_type, question_count, question_type, difficulty
        )
    else:
        count_1 = question_count // 2
        count_2 = question_count - count_1

        logger.info("Generating large quiz of %d questions in 2 batches (%d + %d)", question_count, count_1, count_2)
        batch_1 = _generate_single_pass(
            source_material, source_type, count_1, question_type, difficulty,
            focus_note="Part 1: Foundational definitions, core concepts, mechanisms, and key properties"
        )
        batch_2 = _generate_single_pass(
            source_material, source_type, count_2, question_type, difficulty,
            focus_note="Part 2: Advanced problem solving, analysis, edge cases, applications, and comparative reasoning"
        )

        combined = batch_1.questions + batch_2.questions
        result_quiz = AIQuizResponse(
            title=batch_1.title,
            questions=combined
        )

    # Count Guarantee: If short by 1-2 questions, fetch the remainder
    if len(result_quiz.questions) < question_count:
        missing_count = question_count - len(result_quiz.questions)
        logger.info("Current questions %d < requested %d. Fetching remaining %d questions...",
                    len(result_quiz.questions), question_count, missing_count)
        try:
            supp = _generate_single_pass(
                source_material, source_type, missing_count, question_type, difficulty,
                focus_note="Supplementary questions (ensure completely distinct from previous)"
            )
            if supp and supp.questions:
                result_quiz.questions.extend(supp.questions)
        except Exception as supp_err:
            logger.warning("Supplementary question fetch error: %s", supp_err)

    if len(result_quiz.questions) > question_count:
        result_quiz.questions = result_quiz.questions[:question_count]

    logger.info("Final delivered quiz question count: %d (requested %d)", len(result_quiz.questions), question_count)
    return result_quiz
