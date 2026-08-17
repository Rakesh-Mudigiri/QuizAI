import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  BarChart2, 
  Trash2,
  Calendar,
  Clock,
  BookOpen
} from 'lucide-react';
import { apiGet, apiDelete, formatDate } from '../api';
import { useAuth } from '../context/AuthContext';
import './History.css';

export default function History() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'pdf', 'topic'

  const nav = useNavigate();
  const { user } = useAuth();

  const fetchQuizzes = () => {
    setLoading(true);
    const query = user?.email
      ? `?user_email=${encodeURIComponent(user.email)}`
      : user?.name
      ? `?user_name=${encodeURIComponent(user.name)}`
      : '';
    apiGet(`/api/quizzes${query}`)
      .then(setQuizzes)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuizzes();
    const onFocus = () => fetchQuizzes();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user]);

  const handleDelete = async (e, id, title) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/quiz/${id}`);
      setQuizzes(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete quiz.');
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = (q.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.source_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || q.source_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="history-page">
      
      {/* Header */}
      <div className="history-header">
        <div className="history-header-left">
          <h1>Quiz Library & History</h1>
          <p>Review and practice your generated quizzes and test assessments.</p>
        </div>
        <div className="history-header-actions">
          <button className="btn-create-quiz-hdr" onClick={() => nav('/create')}>
            + Create New Quiz
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="history-toolbar">
        <div className="search-input-wrap">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search quizzes by topic or title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <div className="filter-chips-row">
          <button 
            className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All ({quizzes.length})
          </button>
          <button 
            className={`filter-chip ${filterType === 'pdf' ? 'active' : ''}`}
            onClick={() => setFilterType('pdf')}
          >
            PDF Uploads
          </button>
          <button 
            className={`filter-chip ${filterType === 'topic' ? 'active' : ''}`}
            onClick={() => setFilterType('topic')}
          >
            Topics
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="material-symbols-outlined spin-icon" style={{ fontSize: 28 }}>progress_activity</span>
          <p>Loading quiz library...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>quiz</span>
          <p>{quizzes.length === 0 ? 'No quizzes generated yet' : 'No quizzes match your filter'}</p>
          <button className="cta-btn-sm" onClick={() => nav('/create')}>Create a Quiz Now</button>
        </div>
      ) : (
        <div className="history-list">
          {filteredQuizzes.map(q => (
            <div key={q.id} className="history-card">
              <div className="history-card-top">
                <div className="history-icon-wrap">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {q.source_type === 'pdf' ? 'description' : 'lightbulb'}
                  </span>
                </div>
                <div className="history-body">
                  <h3 className="history-title">{q.title || q.source_name || 'Subject Assessment'}</h3>
                  <div className="history-meta">
                    <span className="source-tag">{q.source_type?.toUpperCase() || 'TOPIC'}</span>
                    <span>{q.question_count || 10} Questions</span>
                    <span>·</span>
                    <span className={`diff-lbl diff-${(q.difficulty || 'medium').toLowerCase()}`}>{q.difficulty || 'Medium'}</span>
                    <span>·</span>
                    <span>{formatDate(q.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="history-card-actions">
                <button className="card-action-btn primary" onClick={() => nav(`/quiz/${q.id}`)}>
                  <Play size={14} />
                  <span>Take Quiz</span>
                </button>

                <button className="card-action-btn secondary" onClick={() => nav(`/results/${q.id}`)}>
                  <BarChart2 size={14} />
                  <span>Results</span>
                </button>

                <button className="card-action-btn danger" onClick={(e) => handleDelete(e, q.id, q.title)} title="Delete Quiz">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
