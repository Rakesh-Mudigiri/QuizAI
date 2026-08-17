import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiForm } from '../api';
import QuizLoadingScreen from '../components/ui/QuizLoadingScreen';
import { useAuth } from '../context/AuthContext';
import './Create.css';

const countPresets = [5, 10, 15, 20, 30];
const timerPresets = [
  { label: 'Untimed', value: 0 },
  { label: '5 Mins', value: 5 },
  { label: '10 Mins', value: 10 },
  { label: '15 Mins', value: 15 },
  { label: '20 Mins', value: 20 },
];
const types = [
  { value: 'MCQ', label: 'Multiple Choice', icon: 'format_list_bulleted' },
  { value: 'True/False', label: 'True / False', icon: 'rule' },
  { value: 'Short Answer', label: 'Short Answer', icon: 'short_text' },
  { value: 'Mixed', label: 'Mixed', icon: 'shuffle' },
];
const diffs = [
  { value: 'Easy', color: '#10B981' },
  { value: 'Medium', color: '#F59E0B' },
  { value: 'Hard', color: '#EF4444' },
  { value: 'Mixed', color: '#3B82F6' },
];

export default function Create() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'text'
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [count, setCount] = useState(10);

  const [type, setType] = useState('MCQ');
  const [diff, setDiff] = useState('Medium');

  const [timerMinutes, setTimerMinutes] = useState(0);
  const [isCustomTimer, setIsCustomTimer] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState('');
  const [timerWarning, setTimerWarning] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preparedQuiz, setPreparedQuiz] = useState(null);

  useEffect(() => {
    const topicParam = searchParams.get('topic');
    if (topicParam) {
      setTopic(topicParam);
      setInputMode('text');
    }
  }, [searchParams]);

  const handleFileChange = (f) => {
    if (f) {
      if (!f.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a valid PDF document (.pdf).');
        return;
      }
      setError('');
      setFile(f);
      setInputMode('upload');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    setError('');

    // Check if user is logged in
    if (!isAuthenticated) {
      nav('/login?redirect=/create');
      return;
    }

    if (inputMode === 'upload' && !file) {
      setError('Please upload a PDF document.');
      return;
    }
    if (inputMode === 'text' && !topic.trim()) {
      setError('Please enter a topic or study text.');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('user_name', user?.name || 'Student');
      if (user?.email) fd.append('user_email', user.email);
      if (user?.id && !isNaN(Number(user.id))) fd.append('user_id', String(user.id));
      fd.append('question_count', count);
      fd.append('question_type', type);
      fd.append('difficulty', diff);

      let result;
      if (inputMode === 'upload') {
        fd.append('file', file);
        result = await apiForm('/api/quiz/generate/pdf', fd);
      } else {
        fd.append('topic', topic.trim());
        result = await apiForm('/api/quiz/generate/topic', fd);
      }
      
      const timeQuery = timerMinutes > 0 ? `?time=${timerMinutes}` : '';
      setPreparedQuiz({
        quiz_id: result.quiz_id,
        timeQuery,
        count,
        type,
        difficulty: diff,
        title: result.title || topic.trim() || (file ? file.name : "Custom Quiz")
      });
    } catch (err) {
      setError(err.message || 'Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };



  return (




    <div className="create-container">
      {/* Header */}
      <div className="create-page-header">
        <h1>Generate Quiz</h1>
        <p>Configure your source material and study parameters to generate AI questions.</p>
      </div>

      {error && (
        <div className="create-error">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          {error}
        </div>
      )}

      {/* Source Material Card */}
      <div className="create-card">
        <div className="card-title">
          <span className="material-symbols-outlined title-icon">data_object</span>
          Source Material
        </div>

        <div className="source-options-row">
          <div 
            className={`source-option ${inputMode === 'upload' ? 'active' : ''}`}
            onClick={() => setInputMode('upload')}
          >
            {inputMode === 'upload' && (
              <span className="material-symbols-outlined check-icon">check_circle</span>
            )}
            <span className="material-symbols-outlined icon" style={{ color: 'var(--primary)' }}>upload_file</span>
            <span className="opt-title">Upload Document</span>
            <span className="opt-sub">PDF (Max 10MB)</span>
          </div>
          
          <div 
            className={`source-option ${inputMode === 'text' ? 'active' : ''}`}
            onClick={() => setInputMode('text')}
          >
            {inputMode === 'text' && (
              <span className="material-symbols-outlined check-icon">check_circle</span>
            )}
            <span className="material-symbols-outlined icon">edit_note</span>
            <span className="opt-title">Enter Topic or Text</span>
            <span className="opt-sub">Paste notes or type a subject</span>
          </div>
        </div>

        {inputMode === 'upload' ? (
          <div 
            className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span className="material-symbols-outlined cloud-icon">cloud_upload</span>
            <span className="drop-title">{file ? file.name : 'Drag & drop your PDF file here'}</span>
            <span className="drop-sub">{file ? `${(file.size/1024/1024).toFixed(2)} MB · Click to change` : 'or click to browse from device'}</span>
            <input 
              type="file" 
              ref={fileRef} 
              accept=".pdf" 
              onChange={(e) => handleFileChange(e.target.files?.[0])} 
              hidden 
            />
          </div>
        ) : (
          <div className="text-input-zone">
            <textarea 
              className="topic-textarea" 
              placeholder="e.g. Operating Systems process scheduling algorithms, Cell Biology, Quantum Mechanics..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Quiz Settings Card */}
      <div className="create-card">
        <div className="card-title">
          <span className="material-symbols-outlined title-icon" style={{ color: 'var(--primary)' }}>settings</span>
          Quiz Settings
        </div>

        {/* Number of Questions */}
        <div className="setting-group">
          <div className="setting-label">Number of Questions</div>
          <div className="chips-row count-chips">
            {countPresets.map(c => (
              <button
                key={c}
                type="button"
                className={`set-chip ${count === c ? 'active' : ''}`}
                onClick={() => setCount(c)}
              >
                {c} Questions
              </button>
            ))}
          </div>
        </div>

        {/* Question Type */}
        <div className="setting-group question-type-group">
          <div className="setting-label">Question Type</div>
          <div className="chips-grid">
            {types.map(t => (
              <button
                key={t.value}
                type="button"
                className={`set-chip type-chip ${type === t.value ? 'active' : ''}`}
                onClick={() => setType(t.value)}
              >
                <span className="material-symbols-outlined chip-icon-sm">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty — Spaced from Question Types */}
        <div className="setting-group difficulty-group">
          <div className="setting-label">Difficulty Level</div>
          <div className="chips-row diff-chips">
            {diffs.map(d => (
              <button
                key={d.value}
                type="button"
                className={`set-chip diff-chip ${diff === d.value ? 'active' : ''}`}
                onClick={() => setDiff(d.value)}
              >
                <span className="diff-dot" style={{ background: d.color }} />
                {d.value}
              </button>
            ))}
          </div>
        </div>

        {/* Timer Selection */}
        <div className="setting-group timer-group">
          <div className="setting-label">Timer Duration</div>
          <div className="chips-row timer-chips">
            {timerPresets.map(t => (
              <button
                key={t.value}
                type="button"
                className={`set-chip ${!isCustomTimer && timerMinutes === t.value ? 'active' : ''}`}
                onClick={() => {
                  setIsCustomTimer(false);
                  setTimerWarning('');
                  setTimerMinutes(t.value);
                }}
              >
                <span className="material-symbols-outlined chip-icon-sm" style={{ fontSize: 16 }}>timer</span>
                {t.label}
              </button>
            ))}

            {/* Custom Timer Option */}
            <button
              type="button"
              className={`set-chip custom-chip ${isCustomTimer ? 'active' : ''}`}
              onClick={() => {
                setIsCustomTimer(true);
                setCustomTimerInput('');
                setTimerMinutes(0);
                setTimerWarning('');
              }}
            >
              <span className="material-symbols-outlined chip-icon-sm">more_time</span>
              Custom Time
            </button>
          </div>

          {isCustomTimer && (
            <div className="custom-input-box animated-fade-in">
              <label htmlFor="custom-timer-input">Enter custom timer in minutes (1 - 120 / max 2 hrs):</label>
              <div className="custom-input-wrap custom-stepper-wrap">
                <button
                  type="button"
                  className="timer-step-btn minus-btn"
                  onClick={() => {
                    const current = parseInt(customTimerInput, 10);
                    const base = isNaN(current) || current <= 0 ? 5 : current;
                    const next = Math.max(1, base - 5);
                    setCustomTimerInput(String(next));
                    setTimerMinutes(next);
                    setTimerWarning('');
                  }}
                  title="Decrease 5 minutes"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>

                <input
                  id="custom-timer-input"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="e.g. 25"
                  value={customTimerInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setCustomTimerInput(raw);
                    if (raw === '') {
                      setTimerWarning('');
                      setTimerMinutes(0);
                      return;
                    }
                    const parsed = parseInt(raw, 10);
                    if (isNaN(parsed) || parsed < 1) {
                      setTimerWarning('⚠️ Minimum duration is 1 minute.');
                      setTimerMinutes(1);
                    } else if (parsed > 120) {
                      setTimerWarning('⚠️ Custom time cannot exceed 2 hours (120 minutes). Capped at 120 mins.');
                      setTimerMinutes(120);
                    } else {
                      setTimerWarning('');
                      setTimerMinutes(parsed);
                    }
                  }}
                  className={`custom-number-input ${timerWarning ? 'has-warning' : ''}`}
                />

                <button
                  type="button"
                  className="timer-step-btn plus-btn"
                  onClick={() => {
                    const current = parseInt(customTimerInput, 10);
                    const base = isNaN(current) || current <= 0 ? 0 : current;
                    const next = Math.min(120, base + 5);
                    setCustomTimerInput(String(next));
                    setTimerMinutes(next);
                    setTimerWarning('');
                  }}
                  title="Increase 5 minutes"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>

                <span className="custom-input-suffix">Minutes</span>
              </div>

              {timerWarning && (
                <div className="custom-popup-warn-banner">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
                  <span>{timerWarning}</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Footer Action */}
      <div className="create-actions">
        <button
          type="button"
          className={`generate-submit-btn ${loading ? 'loading' : ''}`}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading && (
            <span className="material-symbols-outlined spin-icon">progress_activity</span>
          )}
          {loading ? 'Analyzing Content & Generating...' : 'Generate Quiz Now'}
        </button>
      </div>

      {(loading || error || preparedQuiz) && (
        <div className="white-loading-page">
          {preparedQuiz ? (
            <div className="quiz-ready-card">
              <div className="success-icon-container">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <h2 className="quiz-ready-title">Quiz is Ready!</h2>
              <p className="quiz-ready-subtitle">
                Your AI quiz <strong>"{preparedQuiz.title}"</strong> has been prepared and is ready for you to start.
              </p>
              
              <div className="quiz-info-pills">
                <div className="info-pill">
                  <span className="material-symbols-outlined">format_list_bulleted</span>
                  {preparedQuiz.count} Questions
                </div>
                <div className="info-pill">
                  <span className="material-symbols-outlined">style</span>
                  {preparedQuiz.type}
                </div>
                <div className="info-pill">
                  <span className="material-symbols-outlined">signal_cellular_alt</span>
                  {preparedQuiz.difficulty}
                </div>
                {timerMinutes > 0 && (
                  <div className="info-pill">
                    <span className="material-symbols-outlined">timer</span>
                    {timerMinutes} Mins
                  </div>
                )}
              </div>

              <button
                className="start-quiz-btn"
                onClick={() => {
                  const targetUrl = `/quiz/${preparedQuiz.quiz_id}${preparedQuiz.timeQuery}`;
                  setPreparedQuiz(null);
                  nav(targetUrl);
                }}
              >
                <span className="material-symbols-outlined">play_circle</span>
                Start Quiz
              </button>
            </div>
          ) : (
            <QuizLoadingScreen 
              error={error} 
              onRetry={() => {
                setError('');
                setLoading(false);
              }} 
            />
          )}
        </div>
      )}

    </div>
  );
}

