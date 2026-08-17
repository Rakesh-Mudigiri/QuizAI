import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, formatDate } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  GraduationCap, 
  Mail, 
  BookOpen, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  Edit3, 
  PlusCircle, 
  Shuffle, 
  Calendar, 
  ArrowRight, 
  Clock, 
  FileText,
  X,
  Copy,
  Check,
  ShieldCheck,
  HelpCircle,
  Info,
  LogOut,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import './Profile.css';

// 1. Laurel Wreath Emblem (Milestone Problem Solver)
function LaurelWreathLogo({ size = 42 }) {
  return (
    <div
      className="exact-laurel-badge"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: 'linear-gradient(180deg, #FFE8D6 0%, #FFF5ED 50%, #FFFFFF 100%)',
        border: '1.5px solid #F6DDCF',
        boxShadow: '0 4px 12px rgba(184, 83, 56, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 36 36"
        fill="none"
      >
        <path d="M12 8C13.5 9 14 11.5 13 13C12 11.5 9.5 11 8 9.5C9.5 8 10.5 7 12 8Z" fill="#B85338" />
        <path d="M9 13C11 13.5 12 15.5 11 17C9.5 16 7.5 15.5 6 14C7.5 12.5 7.5 12.5 9 13Z" fill="#B85338" />
        <path d="M9 18C11 18.5 11.5 20.5 10.5 22C9 21 7.5 20 6.5 18.5C7.5 17 7.5 17.5 9 18Z" fill="#B85338" />
        <path d="M11 23C13 23 13.5 25 12 26.5C10.5 25.5 9.5 24 9 22.5C9.5 22 10 22.5 11 23Z" fill="#B85338" />
        <path d="M14 15C15.5 16 15.5 18 14 19.5C13 18 12.5 16.5 12.5 15C13 14.5 13.5 14.5 14 15Z" fill="#B85338" />

        <path d="M24 8C22.5 9 22 11.5 23 13C24 11.5 26.5 11 28 9.5C26.5 8 25.5 7 24 8Z" fill="#B85338" />
        <path d="M27 13C25 13.5 24 15.5 25 17C26.5 16 28.5 15.5 30 14C28.5 12.5 28.5 12.5 27 13Z" fill="#B85338" />
        <path d="M27 18C25 18.5 24.5 20.5 25.5 22C27 21 28.5 20 29.5 18.5C28.5 17 28.5 17.5 27 18Z" fill="#B85338" />
        <path d="M25 23C23 23 22.5 25 24 26.5C25.5 25.5 26.5 24 27 22.5C26.5 22 26 22.5 25 23Z" fill="#B85338" />
        <path d="M22 15C20.5 16 20.5 18 22 19.5C23 18 23.5 16.5 23.5 15C23 14.5 22.5 14.5 22 15Z" fill="#B85338" />

        <path d="M14 27C16 26 19 26 21 27C18.5 28.5 16.5 28.5 14 27Z" fill="#B85338" />
        <path d="M12 28.5C15 27.5 20 27.5 23 28.5C20 30 15 30 12 28.5Z" fill="#B85338" />
      </svg>
    </div>
  );
}

// 2. Circular Trophy Badge (GenAI Quiz Architect)
function TrophyBadgeLogo({ size = 42 }) {
  return (
    <div
      className="exact-trophy-badge"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #475569 0%, #1E293B 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
        border: '1.5px solid #64748B',
      }}
    >
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 32 32"
        fill="none"
      >
        <path
          d="M10 8H22V14.5C22 17.8 19.3 20.5 16 20.5C12.7 20.5 10 17.8 10 14.5V8Z"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M10 10H7.5C6.1 10 5 11.1 5 12.5C5 13.9 6.1 15 7.5 15H10"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M22 10H24.5C25.9 10 27 11.1 27 12.5C27 13.9 25.9 15 24.5 15H22"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M16 20.5V24.5"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M9.5 24.5H22.5"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// Curated Preset Avatars
const PRESET_AVATARS = [
  { id: 'bot_blue', name: 'Cyber Blue', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlphaBot_42' },
  { id: 'bot_neon', name: 'Neon Scout', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonMatrix_88' },
  { id: 'adv_sam', name: 'Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SamScholar' },
  { id: 'adv_maya', name: 'Scholar Maya', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MayaTech' },
  { id: 'notion_dev', name: 'Code Minimal', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=DevPro' },
  { id: 'lorelei_aria', name: 'Aria Focus', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=AriaFocus' },
  { id: 'micah_leo', name: 'Leo Genius', url: 'https://api.dicebear.com/7.x/micah/svg?seed=LeoGenius' },
];

export default function Profile() {
  const { user, updateUserProfile, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [isBadgeGuideOpen, setIsBadgeGuideOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form edit states
  const [candidateName, setCandidateName] = useState(() => user?.name || 'Alex Student');
  const [candidateRole, setCandidateRole] = useState(() => user?.role || 'Computer Science Student');
  const [collegeName, setCollegeName] = useState(() => user?.college || 'Institute of Technology');
  const [targetField, setTargetField] = useState(() => user?.field || 'Data Structures & Algorithms');
  const [userBio, setUserBio] = useState(() => user?.bio || 'Preparing for engineering interviews and tests with AI quizzes.');
  const [gradYear, setGradYear] = useState(() => user?.gradYear || '2026');
  
  const [currentAvatar, setCurrentAvatar] = useState(() => {
    return user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.email || 'student')}`;
  });
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  useEffect(() => {
    if (user) {
      if (user.name) setCandidateName(user.name);
      if (user.role) setCandidateRole(user.role);
      if (user.college) setCollegeName(user.college);
      if (user.field) setTargetField(user.field);
      if (user.bio) setUserBio(user.bio);
      if (user.gradYear) setGradYear(user.gradYear);
      if (user.avatar) setCurrentAvatar(user.avatar);
    }
  }, [user]);

  const studentName = candidateName || user?.name || 'Student';
  const studentEmail = user?.email || 'student@university.edu';
  const avatarUrl = currentAvatar || user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(studentName)}`;

  const [profileStats, setProfileStats] = useState(null);

  useEffect(() => {
    setLoading(true);
    const fetchProfileData = async () => {
      try {
        const queryParams = user?.email
          ? `?user_email=${encodeURIComponent(user.email)}`
          : `?user_name=${encodeURIComponent(studentName)}`;
        const quizData = await apiGet(`/api/quizzes${queryParams}`);
        setQuizzes(quizData || []);
        
        const statsData = await apiGet(`/api/student/profile${queryParams}`);
        setProfileStats(statsData);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user, studentName]);

  const handleRollRandomAvatar = () => {
    const styles = ['bottts', 'adventurer', 'lorelei', 'notionists', 'micah', 'avataaars'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomSeed = 'student_' + Math.random().toString(36).substring(2, 9);
    const newAvatar = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodeURIComponent(randomSeed)}`;
    setCurrentAvatar(newAvatar);
  };

  const handleQuickAvatarShuffle = (e) => {
    e.stopPropagation();
    const styles = ['bottts', 'adventurer', 'lorelei', 'notionists', 'micah', 'avataaars'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomSeed = 'student_' + Math.random().toString(36).substring(2, 9);
    const newAvatar = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodeURIComponent(randomSeed)}`;
    setCurrentAvatar(newAvatar);
    if (updateUserProfile) {
      updateUserProfile({ avatar: newAvatar });
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const finalAvatar = customAvatarUrl.trim() || currentAvatar;
    const updatedData = {
      name: candidateName.trim(),
      role: candidateRole,
      college: collegeName.trim(),
      field: targetField,
      bio: userBio.trim(),
      gradYear,
      avatar: finalAvatar,
    };

    if (updateUserProfile) {
      updateUserProfile(updatedData);
    }
    setIsEditModalOpen(false);
  };

  const handleCopyVerification = (token) => {
    navigator.clipboard?.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleSignOut = () => {
    if (logout) logout();
    navigate('/login');
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      if (deleteAccount) {
        await deleteAccount();
      }
      setIsDeleteModalOpen(false);
      navigate('/login');
    } catch (err) {
      console.error('Delete account failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-wrapper">
        <div className="profile-loading-box">
          <div className="profile-spinner"></div>
          <h3>Loading Student Activity...</h3>
        </div>
      </div>
    );
  }

  // Calculate real student activity stats from database profileStats
  const totalQuizzes = profileStats?.stats?.quizzes_completed ?? profileStats?.total_completed ?? 0;
  const totalQuestions = profileStats?.stats?.total_questions ?? profileStats?.total_questions ?? 0;
  const averageScore = profileStats?.stats?.average_score ?? profileStats?.avg_score ?? 0;

  // Subjects derived from database profileStats
  const subjects = profileStats?.stats?.subject_performance || profileStats?.subject_performance || [];

  // Helper for 7 Badge Tiers based on Questions Solved
  const getBadgeTierInfo = (qCount) => {
    if (qCount >= 10000) return { name: 'Conqueror', icon: '⚔️', color: '#EF4444', required: 10000, desc: '10,000+ Questions Solved' };
    if (qCount >= 5000)  return { name: 'Quiz Master', icon: '⚡', color: '#8B5CF6', required: 5000, desc: '5,000 Questions Solved' };
    if (qCount >= 1000)  return { name: 'Master', icon: '👑', color: '#F59E0B', required: 1000, desc: '1,000 Questions Solved' };
    if (qCount >= 500)   return { name: 'Diamond', icon: '💎', color: '#06B6D4', required: 500, desc: '500 Questions Solved' };
    if (qCount >= 250)   return { name: 'Gold', icon: '🥇', color: '#EAB308', required: 250, desc: '250 Questions Solved' };
    if (qCount >= 100)   return { name: 'Silver', icon: '🥈', color: '#94A3B8', required: 100, desc: '100 Questions Solved' };
    if (qCount >= 50)    return { name: 'Bronze', icon: '🥉', color: '#D97706', required: 50, desc: '50 Questions Solved' };
    return { name: 'Novice', icon: '🎯', color: '#64748B', required: 50, desc: 'Locked (Reach 50 Solved)' };
  };

  const tierInfo = getBadgeTierInfo(totalQuestions);
  const isUnlocked = totalQuestions >= 50;

  // 7 Tier Badge System (Bronze, Silver, Gold, Diamond, Master, Quiz Master, Conqueror)
  const verifiedAchievements = [
    {
      id: 'problem_solver_milestone',
      renderBadge: (size = 40) => <LaurelWreathLogo size={size} />,
      title: `${tierInfo.icon} ${tierInfo.name} Badge`,
      tier: isUnlocked ? `${tierInfo.name} Tier` : 'Locked (Reach 50 Qs)',
      category: 'Question Solved Milestone',
      tagline: `Solve questions to level up tiers`,
      desc: isUnlocked 
        ? `Unlocked ${tierInfo.name} Badge by solving ${totalQuestions} questions!`
        : `Solve ${50 - totalQuestions} more questions to unlock Bronze Badge (${totalQuestions}/50 Solved).`,
      quickStat: `${totalQuestions} Questions Solved`,
      unlocked: isUnlocked,
      currentTier: tierInfo,
      howAchievedSteps: [
        { stepNum: '🥉 Bronze', title: '50 Questions', detail: 'Solve 50 practice questions total.' },
        { stepNum: '🥈 Silver', title: '100 Questions', detail: 'Solve 100 practice questions total.' },
        { stepNum: '🥇 Gold', title: '250 Questions', detail: 'Solve 250 practice questions total.' },
        { stepNum: '💎 Diamond', title: '500 Questions', detail: 'Solve 500 practice questions total.' },
        { stepNum: '👑 Master', title: '1,000 Questions', detail: 'Solve 1,000 practice questions total.' },
        { stepNum: '⚡ Quiz Master', title: '5,000 Questions', detail: 'Solve 5,000 practice questions total.' },
        { stepNum: '⚔️ Conqueror', title: '10,000+ Questions', detail: 'Solve 10,000+ practice questions total.' },
      ],
      token: `QA-BADGE-TIER-${tierInfo.name.toUpperCase().replace(/\s+/g, '_')}-${totalQuestions}`,
    }
  ];

  return (
    <div className="profile-page-wrapper">
      
      {/* ── 1. Student Profile Hero Card ── */}
      <div className="profile-hero-card">
        <div className="hero-left">
          <div className="avatar-wrapper" onClick={() => setIsEditModalOpen(true)} title="Click to edit profile picture">
            <img src={avatarUrl} alt={studentName} className="avatar-img" />
            <span className="online-dot" title="Active"></span>
            <button
              className="avatar-quick-shuffle-btn"
              onClick={handleQuickAvatarShuffle}
              title="Click to shuffle avatar"
            >
              <Shuffle size={12} />
            </button>
          </div>

          <div className="hero-user-details">
            <div className="hero-name-row">
              <h2>{studentName}</h2>
              <div className="verified-student-pill">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Verified Student</span>
              </div>
            </div>
            
            <p className="hero-subtitle">
              🎓 <strong>{candidateRole}</strong> • 🏛️ {collegeName} • Class of {gradYear}
            </p>

            <div className="hero-meta-row">
              <span className="hero-email-tag">
                <Mail size={13} />
                {studentEmail}
              </span>
              <span className="hero-goal-tag">
                <BookOpen size={13} />
                {targetField}
              </span>
            </div>

            {userBio && (
              <p className="hero-bio-text">"{userBio}"</p>
            )}
          </div>
        </div>

        <div className="hero-right">
          <button className="btn-primary-action" onClick={() => navigate('/create')}>
            <PlusCircle size={16} />
            <span>New Quiz</span>
          </button>
          <button className="btn-secondary-action" onClick={() => setIsEditModalOpen(true)}>
            <Edit3 size={16} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* ── 2. The 4 Activity Metrics ── */}
      <div className="stats-grid-4">
        <div className="stat-card">
          <div className="stat-icon stat-blue">
            <TrendingUp size={20} />
          </div>
          <div className="stat-data">
            <span className="stat-num">{totalQuizzes}</span>
            <span className="stat-title">Quizzes Completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-green">
            <Sparkles size={20} />
          </div>
          <div className="stat-data">
            <span className="stat-num">{averageScore}%</span>
            <span className="stat-title">Average Score</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-purple">
            <FileText size={20} />
          </div>
          <div className="stat-data">
            <span className="stat-num">{totalQuestions}</span>
            <span className="stat-title">Questions Solved</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-orange">
            <Award size={20} />
          </div>
          <div className="stat-data">
            <span className="stat-num">{subjects.length}</span>
            <span className="stat-title">Subjects Studied</span>
          </div>
        </div>
      </div>

      {/* ── 3. Balanced Grid Layout: Subject Mastery (Left) & Badges (Right) ── */}
      <div className="profile-two-column-layout">
        
        {/* Left: Subject Mastery & Topics */}
        <div className="profile-left-col">
          <div className="section-card-compact">
            <div className="section-header-compact">
              <h3 className="section-title-sm">Subject Mastery & Topics</h3>
              <span className="section-badge-sm">{subjects.length} Topics</span>
            </div>

            <div className="subject-list-compact">
              {subjects.length === 0 ? (
                <div className="empty-sm" style={{ padding: '14px 4px', color: '#64748B', fontSize: '0.85rem' }}>
                  No subject records yet. Complete a quiz to see your live topic mastery!
                </div>
              ) : (
                subjects.map((sub, i) => {
                  const pct = sub.percentage;
                  const color = pct >= 85 ? '#10B981' : pct >= 75 ? '#3B82F6' : '#F59E0B';

                  return (
                    <div className="subject-row-compact" key={i}>
                      <div className="subject-row-top">
                        <span className="subject-name-sm">{sub.subject}</span>
                        <span className="subject-pct-sm" style={{ color }}>{pct}%</span>
                      </div>
                      <div className="bar-track-compact">
                        <div className="bar-fill-compact" style={{ width: `${pct}%`, background: color }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Badges */}
        <div className="profile-right-col">
          <div className="section-card-compact">
            <div>
              <div className="section-header-compact">
                <div>
                  <h3 className="section-title-sm">Badges</h3>
                  <p className="section-sub-sm">Click any badge to inspect tier progress & details.</p>
                </div>
              </div>

              <div className="achievements-compact-list">
                {verifiedAchievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`achievement-card-compact ${ach.unlocked ? 'unlocked' : 'locked'}`}
                    onClick={() => setSelectedAchievement(ach)}
                  >
                    <div className="ach-left-wrap">
                      <div className="badge-logo-wrapper">
                        {ach.renderBadge(40)}
                      </div>
                      <div>
                        <div className="ach-title-row">
                          <h4 className="ach-title-text">{ach.title}</h4>
                          <span className="ach-tier-pill" style={{ background: `${tierInfo.color}15`, color: tierInfo.color, border: `1px solid ${tierInfo.color}30` }}>{ach.tier}</span>
                        </div>
                        <p className="ach-desc-text">{ach.desc}</p>
                        <span className="ach-stat-chip">✓ {ach.quickStat}</span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Small button at bottom right to explain badges and how to achieve */}
            <div className="badges-footer-row">
              <button 
                type="button" 
                className="btn-explain-badges-sm"
                onClick={() => setIsBadgeGuideOpen(true)}
              >
                <HelpCircle size={14} />
                <span>How to Earn Badges?</span>
              </button>
            </div>
          </div>
        </div>

      </div>



      {/* ── 4. Account Settings & Session Management ── */}
      <div className="profile-account-management-card">
        <div className="account-mgmt-left">
          <div className="account-mgmt-icon">
            <User size={20} />
          </div>
          <div>
            <h4 className="account-mgmt-title">Account & Security</h4>
            <p className="account-mgmt-sub">Manage your active session or permanently remove your student profile and quiz records from the Cloud Database.</p>
          </div>
        </div>

        <div className="account-mgmt-actions">
          <button 
            type="button" 
            className="btn-profile-signout"
            onClick={handleSignOut}
            title="Sign out of your account"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>

          <button 
            type="button" 
            className="btn-profile-delete"
            onClick={() => setIsDeleteModalOpen(true)}
            title="Permanently delete account from database"
          >
            <Trash2 size={16} />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* ── 5. Badge Inspection Modal ── */}
      {selectedAchievement && (() => {
        const allTiers = [
          { name: 'Bronze',    icon: '🥉', required: 50,    next: 100   },
          { name: 'Silver',    icon: '🥈', required: 100,   next: 250   },
          { name: 'Gold',      icon: '🥇', required: 250,   next: 500   },
          { name: 'Diamond',   icon: '💎', required: 500,   next: 1000  },
          { name: 'Master',    icon: '👑', required: 1000,  next: 5000  },
          { name: 'Quiz Master',icon: '⚡', required: 5000, next: 10000 },
          { name: 'Conqueror', icon: '⚔️', required: 10000, next: null  },
        ];
        const currentIdx = allTiers.findIndex(t => t.name === tierInfo.name);
        const nextTier = isUnlocked && currentIdx >= 0 && currentIdx < allTiers.length - 1
          ? allTiers[currentIdx + 1] : null;
        const prevRequired = isUnlocked && currentIdx >= 0 ? allTiers[currentIdx].required : 0;
        const nextRequired = nextTier ? nextTier.required : (isUnlocked ? null : 50);
        const progressPct = nextRequired
          ? Math.min(100, Math.round(((totalQuestions - prevRequired) / (nextRequired - prevRequired)) * 100))
          : 100;
        const moreNeeded = nextRequired ? nextRequired - totalQuestions : 0;

        return (
          <div className="modal-backdrop-pro" onClick={() => setSelectedAchievement(null)}>
            <div className="modal-card-pro modal-badge-proof" onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="modal-header-pro">
                <div className="modal-title-row">
                  <ShieldCheck size={20} style={{ color: '#4F46E5' }} />
                  <h3>My Badge</h3>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedAchievement(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Badge centered */}
              <div className="bdg-modal-center">
                <div className="bdg-modal-logo-wrap">
                  {selectedAchievement.renderBadge(72)}
                </div>
                <div className="bdg-modal-name">{isUnlocked ? `${tierInfo.name} Badge` : 'Novice — Not Yet Unlocked'}</div>
                <div className="bdg-modal-qs">{totalQuestions} Questions Solved</div>
              </div>

              {/* Progress to next tier */}
              {nextTier ? (
                <div className="bdg-progress-box">
                  <div className="bdg-progress-label-row">
                    <span>Progress to <strong>{nextTier.icon} {nextTier.name}</strong></span>
                    <span>{totalQuestions} / {nextRequired}</span>
                  </div>
                  <div className="bdg-progress-track">
                    <div className="bdg-progress-fill" style={{ width: `${progressPct}%`, background: tierInfo.color }} />
                  </div>
                  <div className="bdg-progress-hint">
                    Solve <strong>{moreNeeded} more questions</strong> to reach {nextTier.icon} {nextTier.name}!
                  </div>
                </div>
              ) : !isUnlocked ? (
                <div className="bdg-progress-box">
                  <div className="bdg-progress-label-row">
                    <span>Progress to <strong>🥉 Bronze</strong></span>
                    <span>{totalQuestions} / 50</span>
                  </div>
                  <div className="bdg-progress-track">
                    <div className="bdg-progress-fill" style={{ width: `${Math.min(100, Math.round((totalQuestions / 50) * 100))}%`, background: '#D97706' }} />
                  </div>
                  <div className="bdg-progress-hint">
                    Solve <strong>{50 - totalQuestions} more questions</strong> to unlock 🥉 Bronze!
                  </div>
                </div>
              ) : (
                <div className="bdg-progress-box bdg-max-tier">
                  🎉 You've reached the highest tier — <strong>Conqueror</strong>!
                </div>
              )}

              {/* Tier checklist */}
              <div className="bdg-tiers-list">
                <div className="bdg-tiers-label">All Tiers</div>
                {allTiers.map((t, i) => {
                  const achieved = totalQuestions >= t.required;
                  const isCurrent = t.name === tierInfo.name && isUnlocked;
                  return (
                    <div key={i} className={`bdg-tier-row ${isCurrent ? 'bdg-tier-current' : ''} ${achieved ? 'bdg-tier-done' : 'bdg-tier-locked'}`}>
                      <span className="bdg-tier-icon">{t.icon}</span>
                      <span className="bdg-tier-name">{t.name}</span>
                      <span className="bdg-tier-req">{t.required.toLocaleString()} Qs</span>
                      <span className="bdg-tier-status">{achieved ? '✓' : '🔒'}</span>
                    </div>
                  );
                })}
              </div>

              <div className="modal-actions-row">
                <button className="btn-save-modal" onClick={() => setSelectedAchievement(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}


      {/* ── 4.5. Badge Explanation & Guide Modal (What are Badges & How to Achieve) ── */}
      {isBadgeGuideOpen && (
        <div className="modal-backdrop-pro" onClick={() => setIsBadgeGuideOpen(false)}>
          <div className="modal-card-pro modal-badge-guide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <div className="modal-title-row">
                <ShieldCheck size={22} className="text-indigo-600" />
                <h3>What is a Badge & How to Achieve?</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsBadgeGuideOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="badge-guide-intro">
              <p>
                In <strong>QuizAI</strong>, badges are automatically unlocked as you solve practice questions across your subject quizzes!
              </p>
            </div>

            <div className="badge-guide-cards-list">
              
              <div className="badge-guide-item-card">
                <div className="guide-badge-section">
                  <div className="guide-subhead" style={{ fontSize: '0.9rem', marginBottom: 8 }}>🏆 Question Solved Milestone Tiers:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { icon: '🥉', name: 'Bronze', count: '50 Questions Solved', color: '#D97706' },
                      { icon: '🥈', name: 'Silver', count: '100 Questions Solved', color: '#94A3B8' },
                      { icon: '🥇', name: 'Gold', count: '250 Questions Solved', color: '#EAB308' },
                      { icon: '💎', name: 'Diamond', count: '500 Questions Solved', color: '#06B6D4' },
                      { icon: '👑', name: 'Master', count: '1,000 Questions Solved', color: '#F59E0B' },
                      { icon: '⚡', name: 'Quiz Master', count: '5,000 Questions Solved', color: '#8B5CF6' },
                      { icon: '⚔️', name: 'Conqueror', count: '10,000+ Questions Solved', color: '#EF4444' },
                    ].map((tier, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#F8FAFC',
                        border: `1px solid #E2E8F0`,
                        borderLeft: `4px solid ${tier.color}`,
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.2rem' }}>{tier.icon}</span>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>{tier.name} Badge</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: tier.color, background: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', border: `1px solid ${tier.color}40` }}>
                          {tier.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            <div className="modal-actions-row" style={{ marginTop: 16 }}>
              <button className="btn-save-modal" onClick={() => setIsBadgeGuideOpen(false)}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Edit Profile Modal ── */}
      {isEditModalOpen && (
        <div className="modal-backdrop-pro" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card-pro" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <div className="modal-title-row">
                <Edit3 size={20} className="text-indigo-600" />
                <h3>Edit Student Profile</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              {/* Avatar Selector */}
              <div className="form-group-avatar">
                <label>Profile Avatar</label>
                <div className="avatar-picker-row">
                  <img src={customAvatarUrl || currentAvatar} alt="Current" className="modal-avatar-preview" />
                  <div className="avatar-picker-controls">
                    <button type="button" className="btn-roll-avatar" onClick={handleRollRandomAvatar}>
                      <Shuffle size={14} />
                      Roll Random Avatar
                    </button>
                    <div className="preset-avatars-grid">
                      {PRESET_AVATARS.map((av) => (
                        <img
                          key={av.id}
                          src={av.url}
                          alt={av.name}
                          className={`preset-avatar-thumb ${currentAvatar === av.url ? 'active' : ''}`}
                          onClick={() => {
                            setCurrentAvatar(av.url);
                            setCustomAvatarUrl('');
                          }}
                          title={av.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="p_name">Full Name</label>
                  <input
                    id="p_name"
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="p_college">College / University</label>
                  <input
                    id="p_college"
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Institute of Technology"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="p_role">Student Status / Role</label>
                  <select
                    id="p_role"
                    value={candidateRole}
                    onChange={(e) => setCandidateRole(e.target.value)}
                  >
                    <option value="Computer Science Student">🎓 Computer Science Student</option>
                    <option value="Software Engineering Scholar">💻 Software Engineering Scholar</option>
                    <option value="Competitive Exam Aspirant">📚 Competitive Exam Aspirant</option>
                    <option value="Engineering & Tech Student">⚙️ Engineering & Tech Student</option>
                    <option value="Lifelong Tech Learner">🧠 Lifelong Tech Learner</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="p_field">Primary Subject Focus</label>
                  <select
                    id="p_field"
                    value={targetField}
                    onChange={(e) => setTargetField(e.target.value)}
                  >
                    <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="Operating Systems & Architecture">Operating Systems & Architecture</option>
                    <option value="Database Systems & SQL">Database Systems & SQL</option>
                    <option value="Web & Full-Stack Development">Web & Full-Stack Development</option>
                    <option value="General Aptitude & Reasoning">General Aptitude & Reasoning</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="p_bio">Student Bio / Goal</label>
                <textarea
                  id="p_bio"
                  rows={3}
                  value={userBio}
                  onChange={(e) => setUserBio(e.target.value)}
                  placeholder="Share your learning focus or goals..."
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-cancel-modal" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-modal">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8. Delete Account Confirmation Modal ── */}
      {isDeleteModalOpen && (
        <div className="modal-backdrop-pro" onClick={() => !isDeleting && setIsDeleteModalOpen(false)}>
          <div className="modal-card-pro modal-delete-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <div className="delete-warning-icon-wrap">
                <AlertTriangle size={32} color="#EF4444" />
              </div>
              <h3 className="delete-modal-title">Delete Your Account?</h3>
              <p className="delete-modal-subtitle">
                This action is <strong>permanent and cannot be undone</strong>. All your account credentials, generated quizzes, test attempts, and profile performance statistics will be completely erased from the Cloud Database.
              </p>
            </div>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-delete-cancel"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete-confirm-final"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting Account...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
