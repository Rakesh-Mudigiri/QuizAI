import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../api';
import { useAuth } from '../context/AuthContext';
import './Quiz.css';

export default function Quiz() {
  const { user } = useAuth();
  const { id } = useParams();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [reviewMarks, setReviewMarks] = useState({});
  const [idx, setIdx] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Timer
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    setLoading(true);
    setQuiz(null);
    setQuestions([]);
    setAnswers({});
    setReviewMarks({});
    setIdx(0);
    setError('');
    setTimeLeft(null);
    setSubmitting(false);

    apiGet(`/api/quiz/${id}`).then(data => {
      setQuiz(data);
      const sortedQ = (data.questions || []).sort((a, b) => a.order_index - b.order_index);
      setQuestions(sortedQ);
      const t = parseInt(params.get('time'), 10);
      if (t > 0) setTimeLeft(t * 60);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id, params]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { 
          clearInterval(interval); 
          handleSubmit(true); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft !== null]);

  const q = questions[idx];
  const total = questions.length;

  const toggleReviewMark = (questionObj) => {
    if (!questionObj) return;
    const qid = questionObj.id;
    setReviewMarks(prev => ({ ...prev, [qid]: !prev[qid] }));
  };

  const selectOption = (letter) => {
    if (!q) return;
    setAnswers(prev => ({ ...prev, [q.id]: letter }));
  };

  const clearCurrentResponse = () => {
    if (!q) return;
    setAnswers(prev => {
      const next = { ...prev };
      delete next[q.id];
      return next;
    });
  };

  const saveShort = (val) => {
    if (!q) return;
    if (val.trim()) setAnswers(prev => ({ ...prev, [q.id]: val }));
    else clearCurrentResponse();
  };

  // Submit confirmation modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const handleOpenSubmitModal = () => {
    setShowSubmitModal(true);
  };

  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false);
  };

  const jumpToQuestionAndClose = (targetIndex) => {
    setIdx(targetIndex);
    setShowSubmitModal(false);
  };

  const handleSubmitDirect = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);
    try {
      const payload = {
        answers: questions.map(item => ({ question_id: item.id, selected_answer: answers[item.id] || null })),
        user_name: user?.name || 'Student',
        user_email: user?.email || null,
        user_id: (user?.id && !isNaN(Number(user.id))) ? Number(user.id) : null,
      };
      const result = await apiPost(`/api/quiz/${id}/submit`, payload);
      sessionStorage.setItem(`quiz_${id}_answers`, JSON.stringify(answers));
      sessionStorage.setItem(`quiz_${id}_result`, JSON.stringify(result));
      nav(`/results/${id}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  const handleSubmit = (auto = false) => {
    if (auto) {
      handleSubmitDirect();
    } else {
      handleOpenSubmitModal();
    }
  };

  const buildOptions = (targetQ) => {
    if (!targetQ) return [];
    const opts = [];
    if (targetQ.option_a) opts.push({ letter: 'A', text: targetQ.option_a });
    if (targetQ.option_b) opts.push({ letter: 'B', text: targetQ.option_b });
    if (targetQ.option_c) opts.push({ letter: 'C', text: targetQ.option_c });
    if (targetQ.option_d) opts.push({ letter: 'D', text: targetQ.option_d });
    return opts;
  };

  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // Summary counts
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = total - answeredCount;
  const reviewCount = Object.values(reviewMarks).filter(Boolean).length;

  const currentQAnswered = answers[q?.id] !== undefined && answers[q?.id] !== null;

  if (loading) return (
    <div className="quiz-page">
      <div className="quiz-loading">
        <span className="material-symbols-outlined spin-icon" style={{ fontSize: 36, color: 'var(--primary)' }}>progress_activity</span>
        <p style={{ marginTop: '16px', fontWeight: 600 }}>Preparing quiz questions...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="quiz-page">
      <div className="quiz-error">
        <span className="material-symbols-outlined" style={{ fontSize: 44, marginBottom: 12 }}>error</span>
        <p style={{ fontWeight: 600 }}>{error}</p>
        <button className="quiz-btn-prev" style={{ marginTop: 20 }} onClick={() => nav('/')}>Return Home</button>
      </div>
    </div>
  );

  return (
    <div className="quiz-page">
      {/* Top nav */}
      <header className="quiz-topnav">
        <div className="quiz-topnav-inner">
          <div className="quiz-brand" style={{ cursor: 'default', userSelect: 'none' }} title="Quiz in progress">
            <span className="material-symbols-outlined brand-icon" style={{ color: '#2563EB', fontSize: 24 }}>psychology</span>
            <span className="quiz-brand-text">QuizAI</span>
          </div>

          <div className="quiz-title-header">
            {quiz?.title || 'Active Quiz'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {timeLeft !== null && (
              <div className={`timer-pill ${timeLeft <= 60 ? 'danger' : timeLeft <= 300 ? 'warning' : ''}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>timer</span>
                {fmtTime(timeLeft)}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Split Layout: Left Question Area + Right Question Palette */}
      <div className="quiz-split-container">
        
        {/* ── LEFT COLUMN: Active Question Card ── */}
        <div className="quiz-main-area">
          <div className="quiz-question-card">
            
            {/* Header: Question Number & Tags & Review Toggle */}
            <div className="quiz-card-header">
              <div className="quiz-q-pills">
                <span className="quiz-q-num-badge">Question {idx + 1} of {total}</span>
                {q?.difficulty && <span className="quiz-tag">{q.difficulty}</span>}
                {q?.question_type && <span className="quiz-tag">{q.question_type.toUpperCase()}</span>}
              </div>

              {/* Mark as Review Button (Yellow Theme) */}
              <button 
                type="button"
                className={`quiz-review-toggle-btn ${reviewMarks[q?.id] ? 'active' : ''}`}
                onClick={() => toggleReviewMark(q)}
                title="Mark this question to review later"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: reviewMarks[q?.id] ? "'FILL' 1" : "'FILL' 0" }}>
                  flag
                </span>
                {reviewMarks[q?.id] ? 'Marked for Review' : 'Mark for Review'}
              </button>
            </div>

            {/* Question Text */}
            <h2 className="quiz-question-text">{q?.question_text}</h2>

            {/* Options List */}
            <div className="quiz-options-list">
              {q?.question_type === 'short_answer' ? (
                <textarea
                  className="quiz-short-input"
                  placeholder="Type your answer explanation here..."
                  value={answers[q?.id] || ''}
                  onChange={e => saveShort(e.target.value)}
                />
              ) : (
                buildOptions(q).map(opt => {
                  const isSelected = answers[q?.id] === opt.letter;
                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      className={`quiz-option-button ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectOption(opt.letter)}
                    >
                      <div className={`quiz-option-radio ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <div className="quiz-radio-dot" />}
                      </div>
                      <span className="quiz-option-letter">{opt.letter}.</span>
                      <span className="quiz-option-content">{opt.text}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Row: Prev, Clear, Next/Submit */}
          <div className="quiz-actions-bar">
            <button
              type="button"
              className="quiz-btn-prev"
              disabled={idx === 0}
              onClick={() => setIdx(i => i - 1)}
            >
              ← Previous
            </button>

            {answers[q?.id] && (
              <button
                type="button"
                className="quiz-btn-clear"
                onClick={clearCurrentResponse}
              >
                Clear Selection
              </button>
            )}

            {idx < total - 1 ? (
              <button
                type="button"
                className="quiz-btn-next"
                onClick={() => setIdx(i => i + 1)}
              >
                Next Question →
              </button>
            ) : (
              <button
                type="button"
                className="quiz-btn-submit-main"
                onClick={() => handleSubmit()}
                disabled={submitting}
              >
                {submitting ? 'Scoring...' : '✓ Submit Quiz'}
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Question Palette Sidebar ── */}
        <aside className="quiz-palette-sidebar">
          <div className="quiz-palette-title">
            <span>Question Palette</span>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
              {answeredCount}/{total} Done
            </span>
          </div>

          {/* Summary Status Badges: Answered (Green), Unanswered (Blank), Review (Yellow) */}
          <div className="palette-status-summary">
            <div className="palette-status-card status-answered-card">
              <span className="palette-stat-count">{answeredCount}</span>
              <span className="palette-stat-lbl">Answered</span>
            </div>
            <div className="palette-status-card status-unanswered-card">
              <span className="palette-stat-count">{unansweredCount}</span>
              <span className="palette-stat-lbl">Unanswered</span>
            </div>
            <div className="palette-status-card status-review-card">
              <span className="palette-stat-count">{reviewCount}</span>
              <span className="palette-stat-lbl">Review</span>
            </div>
          </div>

          {/* Question Grid: Numbered Tiles */}
          <div className="palette-grid">
            {questions.map((item, index) => {
              const isAns = !!answers[item.id];
              const isRev = !!reviewMarks[item.id];
              const isCur = index === idx;

              let cellClass = 'palette-cell ';
              if (isAns) {
                cellClass += 'is-answered '; // Green
              } else {
                cellClass += 'is-unanswered '; // Blank / Neutral
              }

              if (isRev) {
                cellClass += 'is-review '; // Yellow / Amber
              }

              if (isCur) {
                cellClass += 'is-current '; // Glowing ring
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  className={cellClass.trim()}
                  onClick={() => setIdx(index)}
                  title={`Question ${index + 1}: ${isAns ? 'Answered' : 'Unanswered'}${isRev ? ' (Marked for Review)' : ''}`}
                >
                  {index + 1}
                  {isRev && <span className="cell-star-badge">★</span>}
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="palette-legend">
            <div className="legend-row">
              <span className="legend-dot green"></span>
              <span>Answered</span>
            </div>
            <div className="legend-row">
              <span className="legend-dot blank"></span>
              <span>Unanswered</span>
            </div>
            <div className="legend-row">
              <span className="legend-dot yellow"></span>
              <span>Marked for Review</span>
            </div>
          </div>

          {/* Direct Submit Button */}
          <button
            type="button"
            className="palette-submit-btn"
            onClick={() => handleSubmit()}
            disabled={submitting}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </aside>

      </div>

      {/* ── ULTRA-PROFESSIONAL SUBMISSION & UNANSWERED QUESTIONS MODAL ── */}
      {showSubmitModal && (
        <div className="quiz-modal-backdrop" onClick={handleCloseSubmitModal}>
          <div className="quiz-submit-modal" onClick={e => e.stopPropagation()}>
            
            {/* Modal Close Icon */}
            <button
              type="button"
              className="modal-close-icon-btn"
              onClick={handleCloseSubmitModal}
              title="Close modal"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Modal Header Badge & Icon */}
            <div className="submit-modal-header-block">
              {unansweredCount > 0 ? (
                <div className="modal-alert-icon-wrap warning-mode">
                  <span className="material-symbols-outlined modal-main-icon">warning</span>
                </div>
              ) : (
                <div className="modal-alert-icon-wrap success-mode">
                  <span className="material-symbols-outlined modal-main-icon">verified</span>
                </div>
              )}

              <h2 className="submit-modal-title">
                {unansweredCount > 0
                  ? `Ready to Submit? (${unansweredCount} Unanswered)`
                  : 'Ready to Submit Your Quiz?'}
              </h2>

              <p className="submit-modal-subtitle">
                {unansweredCount > 0
                  ? `You have answered ${answeredCount} of ${total} questions. Unanswered questions will receive 0 points.`
                  : `Great job! You have answered all ${total} questions and are ready for scoring.`}
              </p>
            </div>

            {/* Progress Bar & Mini Stats */}
            <div className="submit-modal-stats-box">
              <div className="modal-progress-bar-track">
                <div
                  className="modal-progress-bar-fill"
                  style={{ width: `${total > 0 ? (answeredCount / total) * 100 : 0}%` }}
                />
              </div>

              <div className="modal-stats-grid">
                <div className="modal-stat-pill answered-stat">
                  <span className="stat-pill-dot green"></span>
                  <span className="stat-pill-val">{answeredCount}</span>
                  <span className="stat-pill-label">Answered</span>
                </div>

                <div className={`modal-stat-pill ${unansweredCount > 0 ? 'unanswered-stat-warn' : 'neutral-stat'}`}>
                  <span className={`stat-pill-dot ${unansweredCount > 0 ? 'amber' : 'gray'}`}></span>
                  <span className="stat-pill-val">{unansweredCount}</span>
                  <span className="stat-pill-label">Unanswered</span>
                </div>

                {reviewCount > 0 && (
                  <div className="modal-stat-pill review-stat">
                    <span className="stat-pill-dot yellow"></span>
                    <span className="stat-pill-val">{reviewCount}</span>
                    <span className="stat-pill-label">In Review</span>
                  </div>
                )}
              </div>
            </div>

            {/* If Unanswered Questions Exist — Quick Jump Palette */}
            {unansweredCount > 0 && (
              <div className="modal-unanswered-section">
                <div className="unanswered-section-header">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#D97706' }}>
                    touch_app
                  </span>
                  <span>Click any question to jump and answer:</span>
                </div>

                <div className="modal-unanswered-chips-grid">
                  {questions
                    .map((item, originalIndex) => ({ item, originalIndex }))
                    .filter(({ item }) => !answers[item.id])
                    .map(({ item, originalIndex }) => {
                      const isRev = !!reviewMarks[item.id];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="modal-unanswered-chip"
                          onClick={() => jumpToQuestionAndClose(originalIndex)}
                          title={`Jump to Question ${originalIndex + 1}`}
                        >
                          <span className="chip-q-num">Q{originalIndex + 1}</span>
                          {isRev && <span className="chip-rev-star">★</span>}
                          <span className="chip-jump-arrow">→</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="submit-modal-actions-footer">
              <button
                type="button"
                className="modal-btn-review"
                onClick={handleCloseSubmitModal}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  arrow_back
                </span>
                {unansweredCount > 0 ? 'Review & Answer Questions' : 'Back to Quiz'}
              </button>

              <button
                type="button"
                className={`modal-btn-submit-final ${unansweredCount > 0 ? 'submit-anyway' : 'submit-primary'}`}
                onClick={handleSubmitDirect}
                disabled={submitting}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {submitting ? 'progress_activity' : 'check_circle'}
                </span>
                {submitting
                  ? 'Submitting...'
                  : unansweredCount > 0
                  ? 'Submit Quiz Anyway'
                  : 'Submit & View Score'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
