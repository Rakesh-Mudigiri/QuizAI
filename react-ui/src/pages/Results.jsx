import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SlideToUnlock } from '@/components/ui/reward-card';
import { AppleActivityCard } from '../components/ui/apple-activity-ring';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../api';
import './Results.css';

const SubmittedCheckIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default function Results() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [result, setResult] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Unlock state: user must swipe the slider to reveal results
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);

  useEffect(() => {
    const fetchRes = async () => {
      try {
        const storedAns = sessionStorage.getItem(`quiz_${id}_answers`);
        const storedRes = sessionStorage.getItem(`quiz_${id}_result`);
        if (storedRes) {
          try {
            const resParsed = JSON.parse(storedRes);
            setResult({ ...resParsed, userAnswers: storedAns ? JSON.parse(storedAns) : {} });
            setLoading(false);
            apiGet(`/api/quiz/${id}`).then(setQuiz).catch(() => {});
            return;
          } catch (jsonErr) {
            console.error('Failed parsing stored result', jsonErr);
          }
        }
        // Fallback fetch from backend API
        const r = await apiGet(`/api/results/${id}`);
        setResult(r);
        apiGet(`/api/quiz/${id}`).then(setQuiz).catch(() => {});
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRes();
  }, [id]);

  const handleUnlock = () => {
    setIsUnlocked(true);
    setTimeout(() => {
      setShowFullResults(true);
    }, 250);
  };

  if (loading) return (
    <div className="results-page">
      <div className="results-loading">
        <span className="material-symbols-outlined spin-icon" style={{ fontSize: 32 }}>progress_activity</span>
        <p style={{ marginTop: '16px', fontWeight: 600 }}>Analyzing answers & evaluating score...</p>
      </div>
    </div>
  );

  if (error || !result) return (
    <div className="results-page">
      <div className="results-error">
        <span className="material-symbols-outlined" style={{ fontSize: 40, marginBottom: 12 }}>info</span>
        <p>{error || 'No result found for this quiz.'}</p>
        <button className="res-btn-solid" style={{ marginTop: 16 }} onClick={() => nav('/history')}>
          Back to Library
        </button>
      </div>
    </div>
  );

  const total = quiz?.questions?.length || (result.correct_answers + result.wrong_answers + result.unanswered) || 0;
  const correct = result.correct_answers ?? result.score ?? 0;
  const wrong = result.wrong_answers ?? (total - correct);
  const unanswered = result.unanswered ?? 0;
  const pct = result.percentage ?? (total > 0 ? Math.round((correct / total) * 100) : 0);

  const reviewList = result.review || result.detailed_results || [];

  const getQ = (qid) => quiz?.questions?.find(q => q.id === qid) || {};
  const getOptText = (q, val) => {
    if (!val) return '(Unanswered)';
    if (val === 'A') return q.option_a || 'Option A';
    if (val === 'B') return q.option_b || 'Option B';
    if (val === 'C') return q.option_c || 'Option C';
    if (val === 'D') return q.option_d || 'Option D';
    return val;
  };

  // Unlocked item in green theme when swiped
  const UnlockedCard = () => (
    <div 
      onClick={() => setShowFullResults(true)}
      className="mt-6 flex h-14 w-full cursor-pointer items-center justify-between rounded-full bg-[#10B981] p-2 text-white shadow-lg transition-transform hover:scale-105"
    >
      <div className="pl-3">
        <p className="text-sm font-bold">Quiz Submitted & Analyzed!</p>
        <p className="text-xs opacity-90">Click to view scorecard →</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
        <SubmittedCheckIcon className="h-6 w-6 text-[#10B981]" />
      </div>
    </div>
  );

  return (
    <div className="results-page">
      {/* Top Navbar */}
      <header className="quiz-topnav">
        <div className="quiz-topnav-inner">
          <div className="quiz-brand" onClick={() => nav('/')} style={{ cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>psychology</span>
            <span className="quiz-brand-text">QuizAI</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="nav-btn-sm" onClick={() => nav(`/quiz/${id}`)}>Retake Quiz</button>
            <button className="nav-btn-sm" onClick={() => nav('/history')}>History</button>
            <button className="nav-btn-sm" onClick={() => nav('/')}>Home</button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {!showFullResults ? (
        /* ── Slide To Unlock Card (Quiz Submitted Successfully) ── */
        <div style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            background: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
            padding: '32px 24px',
            textAlign: 'center'
          }}>
            {/* Glowing Green Submitted Check Circle */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px auto',
              borderRadius: '50%',
              background: '#ECFDF5',
              border: '2px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)'
            }}>
              <SubmittedCheckIcon style={{ width: '44px', height: '44px', color: '#10B981' }} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Quiz Submitted Successfully!
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: '1.5', marginBottom: '24px' }}>
              Your answers have been analyzed and evaluated. Slide the handle below to reveal your scorecard and explanations!
            </p>

            {/* Slide To Unlock Slider */}
            <SlideToUnlock
              onUnlock={handleUnlock}
              unlockedContent={<UnlockedCard />}
              sliderText="Slide to check results"
              shimmer={true}
              className="max-w-none border-0 p-0 shadow-none"
            >
              <div style={{ display: 'none' }} />
            </SlideToUnlock>
          </div>
        </div>
      ) : (
        /* ── Results Performance Dashboard ── */
        <div className="res-body">
          
          {/* Main Score Card */}
          <div className="res-top-card">
            <div className="res-header-layout">
              <div className="res-header-left">
                <div className="status-badge-row">
                  {pct >= 70 ? (
                    <span className="status-badge pass">Passed</span>
                  ) : (
                    <span className="status-badge retry">Needs Practice</span>
                  )}
                </div>

                <h1>Quiz Performance</h1>
                <p className="res-subtitle">{quiz?.title || quiz?.source_name || 'Study Quiz'}</p>
              </div>
            </div>

            <AppleActivityCard 
              title={`Score Rings Breakdown (${pct}%)`}
              correct={correct}
              wrong={wrong}
              unanswered={unanswered}
              total={total}
              className="res-apple-rings"
            />

            <hr className="res-divider" />

            <div className="res-stats-row">
              <div className="res-stat-item">
                <span className="material-symbols-outlined stat-icon-green">check_circle</span>
                <span className="stat-num">{correct}</span>
                <span className="stat-lbl">Correct</span>
              </div>
              <div className="res-stat-item">
                <span className="material-symbols-outlined stat-icon-red">cancel</span>
                <span className="stat-num">{wrong}</span>
                <span className="stat-lbl">Incorrect</span>
              </div>
              <div className="res-stat-item">
                <span className="material-symbols-outlined stat-icon-gray">help</span>
                <span className="stat-num">{unanswered}</span>
                <span className="stat-lbl">Skipped</span>
              </div>
            </div>
          </div>

          <h2 className="res-review-heading">Answer Breakdown & Explanations</h2>

          <div className="res-review-list">
            {reviewList.map((dr, idx) => {
              const q = getQ(dr.question_id);
              const qText = dr.question_text || q.question_text || `Question ${idx + 1}`;
              const isCorr = dr.is_correct;
              const uAnsTxt = getOptText(q, dr.your_answer || dr.user_answer);
              const cAnsTxt = getOptText(q, dr.correct_answer);
              const expl = dr.explanation || q.explanation;

              return (
                <div key={idx} className="res-review-card">
                  <div className="rev-header">
                    <div className="rev-q-text"><strong>{idx + 1}.</strong> {qText}</div>
                    {isCorr ? (
                      <div className="rev-pill pill-correct">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span> Correct
                      </div>
                    ) : (
                      <div className="rev-pill pill-incorrect">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span> Incorrect
                      </div>
                    )}
                  </div>

                  <div className="rev-ans-blocks">
                    {isCorr ? (
                      <div className="ans-block ans-correct-bg">
                        <span className="material-symbols-outlined block-icon-green">check_circle</span>
                        <div>
                          <div className="ans-lbl">Your Choice</div>
                          <div className="ans-val">{uAnsTxt}</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="ans-block ans-incorrect-bg">
                          <span className="material-symbols-outlined block-icon-red">cancel</span>
                          <div>
                            <div className="ans-lbl-red">Your Choice</div>
                            <div className="ans-val-strike">{uAnsTxt}</div>
                          </div>
                        </div>
                        <div className="ans-block ans-correct-bg">
                          <span className="material-symbols-outlined block-icon-green">check_circle</span>
                          <div>
                            <div className="ans-lbl">Correct Answer</div>
                            <div className="ans-val">{cAnsTxt}</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {expl && (
                    <div className="expl-block">
                      <div className="expl-lbl">
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>lightbulb</span> AI Explanation
                      </div>
                      <div className="expl-txt">{expl}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="res-actions">
            <button className="res-btn-outline" onClick={() => nav(`/quiz/${id}`)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>replay</span> Retake Quiz
            </button>
            <button className="res-btn-solid" onClick={() => nav('/create')}>
              Generate Another Quiz <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
