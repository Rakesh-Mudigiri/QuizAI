import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Explore.css';

const popularTopics = [
  { name: 'Operating Systems', icon: 'memory' },
  { name: 'Cell Biology', icon: 'biotech' },
  { name: 'Linear Algebra', icon: 'calculate' },
  { name: 'World History', icon: 'history_edu' },
  { name: 'Machine Learning', icon: 'smart_toy' },
  { name: 'Microeconomics', icon: 'trending_up' },
];

export default function Explore() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGenerateClick = (customTopic = '') => {
    if (isAuthenticated) {
      if (customTopic) {
        navigate(`/create?topic=${encodeURIComponent(customTopic)}`);
      } else {
        navigate('/create');
      }
    } else {
      if (customTopic) {
        navigate(`/login?redirect=${encodeURIComponent(`/create?topic=${customTopic}`)}`);
      } else {
        navigate('/login?redirect=/create');
      }
    }
  };

  return (
    <div className="landing-page">
      {/* Background Grid */}
      <div className="grid-bg"></div>

      {/* Centered Content Container */}
      <div className="landing-content-container">

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-chip">
            AI-Powered Quiz Generator
          </div>

          <h1 className="hero-title">
            Turn your study materials<br />
            into <span className="hero-highlight">interactive quizzes</span><br />
            instantly.
          </h1>

          <p className="hero-desc">
            Upload lecture notes, study PDFs, or type any subject. Our AI engine generates challenging, 
            academic-grade practice quizzes with instant scoring and detailed explanations.
          </p>

          <div className="hero-actions">
            <button className="hero-btn primary-cta" onClick={() => handleGenerateClick()}>
              {isAuthenticated ? 'Generate Quiz' : 'Sign in to Generate Quiz'}
            </button>
          </div>

          {/* Quick-Start Popular Topic Pills */}
          <div className="quick-topics-row">
            <span className="quick-topics-label">Try popular subjects:</span>
            <div className="quick-topics-pills">
              {popularTopics.map(t => (
                <button
                  key={t.name}
                  className="quick-topic-pill"
                  onClick={() => handleGenerateClick(t.name)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Features / Workflow Section */}
        <section className="features-section">
          <div className="section-header-center">
            <div className="section-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
              HOW IT WORKS
            </div>
            <h2 className="section-title">Engineered for Effective Recall</h2>
            <p className="section-subtitle">
              Everything you need to master your exams, retain concepts longer, and test your knowledge.
            </p>
          </div>

          <div className="recall-steps-grid">
            
            {/* Step 1: Input & Sources */}
            <div className="recall-card">
              <div className="recall-card-top">
                <div className="recall-step-num">01</div>
                <div className="recall-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  <span className="material-symbols-outlined">upload_file</span>
                </div>
              </div>
              <h3 className="recall-card-title">Upload or Input Any Material</h3>
              <p className="recall-card-desc">
                Drop your lecture slide PDFs, syllabus notes, or simply type any subject or topic you want to study.
              </p>
              <div className="recall-pills">
                <span className="recall-pill"><span className="material-symbols-outlined">picture_as_pdf</span> PDF Documents</span>
                <span className="recall-pill"><span className="material-symbols-outlined">edit_note</span> Custom Topics</span>
              </div>
            </div>

            {/* Step 2: Custom Quiz Settings */}
            <div className="recall-card">
              <div className="recall-card-top">
                <div className="recall-step-num">02</div>
                <div className="recall-icon-wrap" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                  <span className="material-symbols-outlined">tune</span>
                </div>
              </div>
              <h3 className="recall-card-title">Tailor Difficulty & Formats</h3>
              <p className="recall-card-desc">
                Choose your challenge level (Easy, Medium, Hard) and question format (Multiple Choice, True/False, Short Answer).
              </p>
              <div className="recall-pills">
                <span className="recall-pill">MCQs</span>
                <span className="recall-pill">True / False</span>
                <span className="recall-pill">Short Answer</span>
                <span className="recall-pill">Timer Option</span>
              </div>
            </div>

            {/* Step 3: Interactive Exam Environment */}
            <div className="recall-card">
              <div className="recall-card-top">
                <div className="recall-step-num">03</div>
                <div className="recall-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
                  <span className="material-symbols-outlined">quiz</span>
                </div>
              </div>
              <h3 className="recall-card-title">Active Testing & Question Palette</h3>
              <p className="recall-card-desc">
                Take quizzes with a live right-side question navigator: green for answered, blank for skipped, and yellow for review.
              </p>
              <div className="recall-pills">
                <span className="recall-pill green-pill">🟢 Answered</span>
                <span className="recall-pill blank-pill">⚪ Unanswered</span>
                <span className="recall-pill yellow-pill">🟡 Review</span>
              </div>
            </div>

            {/* Step 4: AI Explanations & Scoring */}
            <div className="recall-card">
              <div className="recall-card-top">
                <div className="recall-step-num">04</div>
                <div className="recall-icon-wrap" style={{ background: '#FFFBEB', color: '#D97706' }}>
                  <span className="material-symbols-outlined">psychology</span>
                </div>
              </div>
              <h3 className="recall-card-title">Instant AI Score & Explanations</h3>
              <p className="recall-card-desc">
                Get immediate scores, Apple-style performance rings, and detailed AI explanations for every answer to fix mistakes.
              </p>
              <div className="recall-quote-box">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#D97706' }}>lightbulb</span>
                <span>Learn why answers are correct with conceptual clarity.</span>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
