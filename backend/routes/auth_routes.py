"""
Professional Authentication & Email Verification routes.
Supports 6-digit OTP email verification, Password Hashing, Cloud MySQL User Persistence,
and Google Single Sign-On.
"""
import os
import smtplib
import logging
import random
import time
import re
import hashlib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database.database import get_db
from backend.database.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Temporary in-memory store for 6-digit verification codes
verification_store: Dict[str, dict] = {}

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'


# --- Password Hashing Utilities ---
def hash_password(password: str) -> str:
    """Generate salted SHA-256 hash for secure storage."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    return f"{salt}${hashed}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored salt$hash."""
    if not stored_hash or "$" not in stored_hash:
        return False
    salt, original_hash = stored_hash.split("$", 1)
    test_hash = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    return secrets.compare_digest(original_hash, test_hash)


# --- Optional Real SMTP Dispatcher ---
def send_real_smtp_email(to_email: str, code: str, name: str = "Student") -> bool:
    """Send real HTML verification email via SMTP if configured in .env."""
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("SMTP_FROM", smtp_user or "auth@quizai.com")

    if not (smtp_host and smtp_user and smtp_pass):
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔑 Your QuizAI Verification Code: {code}"
        msg["From"] = f"QuizAI Platform <{sender_email}>"
        msg["To"] = to_email

        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 20px; letter-spacing: 0.5px;">
                    ✨ QuizAI
                </div>
            </div>
            <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px; text-align: center;">Verify Your Student Account</h2>
            <p style="font-size: 14px; color: #64748b; line-height: 1.5; text-align: center; margin-bottom: 24px;">
                Hi {name}, use the 6-digit verification code below to activate your QuizAI account. This code is valid for <strong>10 minutes</strong>.
            </p>
            <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">
                    {code}
                </div>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.4;">
                If you did not request this verification code, please ignore this email.
            </p>
        </div>
        """
        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(sender_email, [to_email], msg.as_string())
        server.quit()
        logger.info(f"✅ Real SMTP Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.warning(f"SMTP dispatch failed ({e}). Falling back to simulated logger.")
        return False


# --- Request Models ---
class SendVerificationRequest(BaseModel):
    email: str
    name: Optional[str] = "Student"


class VerifyCodeRequest(BaseModel):
    email: str
    code: str


class RegisterUserRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = None
    role: Optional[str] = "Computer Science Student"
    field: Optional[str] = "Data Structures & Algorithms"
    college: Optional[str] = "Institute of Technology"
    bio: Optional[str] = "Preparing for engineering tests with AI."
    grad_year: Optional[str] = "2026"
    avatar: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    email: str
    name: Optional[str] = "Google Scholar"
    avatar: Optional[str] = None
    role: Optional[str] = "Computer Science Scholar"
    college: Optional[str] = "Global Tech Academy"


# --- Endpoints ---

@router.post("/send-verification")
def send_verification_code(payload: SendVerificationRequest):
    email_clean = payload.email.strip().lower()
    
    if not re.match(EMAIL_REGEX, email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address (e.g. user@example.com)."
        )
    
    code = f"{random.randint(100000, 999999)}"
    expires_at = time.time() + 600  # 10 minutes
    
    verification_store[email_clean] = {
        "code": code,
        "expires_at": expires_at,
        "created_at": time.time(),
        "name": payload.name or "Student"
    }
    
    logger.info(f"📧 [Email Verification] Code for {email_clean} is {code} (valid for 10m)")
    
    # Try real email if configured
    smtp_sent = send_real_smtp_email(email_clean, code, payload.name or "Student")
    
    return {
        "status": "success",
        "message": f"Verification code sent to {email_clean}",
        "email": email_clean,
        "expires_in": 600,
        "code_preview": code if not smtp_sent else None,  # Provided in dev mode for 1-click test
        "is_smtp_dispatched": smtp_sent
    }


@router.post("/verify-code")
def verify_code(payload: VerifyCodeRequest):
    email_clean = payload.email.strip().lower()
    entered_code = payload.code.strip()
    
    record = verification_store.get(email_clean)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found for this email. Please request a new code."
        )
        
    if time.time() > record["expires_at"]:
        del verification_store[email_clean]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one."
        )
        
    if record["code"] != entered_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect verification code. Please check and try again."
        )
        
    del verification_store[email_clean]
    
    return {
        "status": "verified",
        "message": "Email successfully verified!",
        "email": email_clean
    }


@router.post("/register")
def register_user(payload: RegisterUserRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in."
        )
    
    pwd_hash = hash_password(payload.password) if payload.password else None
    
    user = User(
        name=payload.name.strip() or "Student",
        email=email_clean,
        password_hash=pwd_hash,
        role=payload.role or "Computer Science Student",
        field=payload.field or "Data Structures & Algorithms",
        college=payload.college or "Institute of Technology",
        bio=payload.bio or "Preparing for engineering tests with AI.",
        grad_year=payload.grad_year or "2026",
        avatar=payload.avatar or f"https://api.dicebear.com/7.x/bottts/svg?seed={email_clean}",
        is_verified=1,
        created_at=datetime.utcnow()
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "id": f"usr_{user.id}",
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "field": user.field,
        "college": user.college,
        "bio": user.bio,
        "gradYear": user.grad_year,
        "avatar": user.avatar,
        "joinedAt": user.created_at.isoformat()
    }


@router.post("/login")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email. Please check or sign up."
        )
        
    if user.password_hash and not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again."
        )
        
    return {
        "id": f"usr_{user.id}",
        "name": user.name,
        "email": user.email,
        "role": user.role or "Computer Science Student",
        "field": user.field or "Data Structures & Algorithms",
        "college": user.college or "Institute of Technology",
        "bio": user.bio or "Preparing for tests with AI quizzes.",
        "gradYear": user.grad_year or "2026",
        "avatar": user.avatar or f"https://api.dicebear.com/7.x/bottts/svg?seed={user.email}",
        "joinedAt": user.created_at.isoformat() if user.created_at else datetime.utcnow().isoformat()
    }


@router.post("/google")
def google_auth(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        user = User(
            name=payload.name or "Google Scholar",
            email=email_clean,
            password_hash=None,
            role=payload.role or "Full-Stack Developer",
            field="AI & Machine Learning",
            college=payload.college or "Global Tech Academy",
            bio="Lifelong learner testing knowledge with AI quizzes.",
            grad_year="2026",
            avatar=payload.avatar or f"https://api.dicebear.com/7.x/bottts/svg?seed={email_clean}",
            is_verified=1,
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return {
        "id": f"usr_{user.id}",
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "field": user.field,
        "college": user.college,
        "bio": user.bio,
        "gradYear": user.grad_year,
        "avatar": user.avatar,
        "joinedAt": user.created_at.isoformat() if user.created_at else datetime.utcnow().isoformat()
    }


class DeleteAccountRequest(BaseModel):
    email: str


@router.post("/delete-account")
def delete_account(payload: DeleteAccountRequest, db: Session = Depends(get_db)):
    """Completely delete user account and associated quizzes and results from Cloud database."""
    from backend.database.models import Result, Quiz
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        return {"status": "ok", "message": "Account not found or already deleted."}
    
    # Delete results associated with user's name
    if user.name:
        db.query(Result).filter(Result.user_name == user.name).delete(synchronize_session=False)
    
    # Delete quizzes created by this user
    user_quizzes = db.query(Quiz).filter(Quiz.user_id == user.id).all()
    for q in user_quizzes:
        db.delete(q)
    
    # Delete the user
    db.delete(user)
    db.commit()
    logger.info(f"🗑️ [Account Deletion] User {email_clean} and all related records permanently removed from DB.")
    return {"status": "ok", "message": "Account and all associated data permanently removed."}
