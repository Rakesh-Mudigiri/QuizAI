import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { SmokeyBackground, SignupForm } from '../components/ui/login-form';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, googleLogin } = useAuth();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSignup = async (formData) => {
    setError('');
    setLoading(true);
    try {
      await signup(formData);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    try {
      await googleLogin();
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError('Google Sign Up failed.');
    }
  };

  return (
    <div className="auth-page-container">
      {/* Smokey WebGL Shader Background with Purple Tint */}
      <SmokeyBackground color="#4F46E5" />

      {/* Floating Back to Explore */}
      <Link to="/" className="auth-back-btn">
        <ArrowLeft size={16} />
        <span>Explore Quizzes</span>
      </Link>

      {/* Perfectly Centered Glassmorphism Signup Card */}
      <SignupForm
        onSubmit={handleSignup}
        onGoogleLogin={handleGoogleSignup}
        onSwitchToLogin={() => navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`)}
        error={error}
        loading={loading}
      />
    </div>
  );
}
