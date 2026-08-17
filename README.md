# 🎓 QuizAI — Intelligent Multi-Modal Assessment Platform

QuizAI is an AI-powered quiz generation and assessment platform that transforms study materials (PDF lecture notes, textbooks, syllabus documents) and technical topics into interactive, self-assessing quizzes with comprehensive explanations.

---

## ✨ Features

- 📄 **PDF Study Material Ingestion**: Extracts text from any study PDF using PyMuPDF.
- 💡 **Topic-Based Quiz Generation**: Instant quiz generation across any subject or curriculum topic.
- ⚡ **Groq Cloud AI Engine**: Lightning-fast question formulation with `Llama 3.3-70B` and `Llama 3.1-8B` models.
- ⏱️ **Interactive Exam Simulator**: Timed sessions, real-time question palette, and review flagging.
- 📊 **Smart Scorecard & Activity Rings**: Instant auto-grading, Apple Activity Rings accuracy breakdown, and in-depth AI explanations.
- 📚 **Personal Quiz Library**: Filter, search, retake, and manage all generated assessments.
- 🔐 **Authentication**: Email/Password login, salted SHA-256 security, and student profiles.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Modern Vanilla CSS Design System
- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic
- **Database**: TiDB Cloud MySQL / SQLite, SQLAlchemy ORM
- **AI / LLM Engine**: Groq Cloud SDK (`llama-3.3-70b-versatile` & `llama-3.1-8b-instant`)
- **PDF Processing**: PyMuPDF (`fitz`)

---

## 🚀 Quickstart

### 1. Install Python & Frontend Dependencies
```bash
pip install -r requirements.txt
cd react-ui && npm install && npm run build && cd ..
```

### 2. Configure Environment Variables (`.env`)
```ini
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
DATABASE_URL=sqlite:///./quiz_generator.db
ALLOWED_ORIGINS=*
PORT=8000
```

### 3. Run the Application
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Open your browser at **http://localhost:8000** (or **http://localhost:5173** in Vite development mode).
