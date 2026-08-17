import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { SmokeyBackground, LoginForm } from '../components/ui/login-form';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/';

  const handleLogin = async ({ email, password }) => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await googleLogin();
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError('Google Sign In failed.');
    }
  };

  return (
    <div className="auth-page-container">
      {/* Smokey WebGL Shader Background */}
      <SmokeyBackground color="#2563EB" />

      {/* Floating Back to Explore */}
      <Link to="/" className="auth-back-btn">
        <ArrowLeft size={16} />
        <span>Explore Quizzes</span>
      </Link>

      {/* Perfectly Centered Glassmorphism Login Card */}
      <LoginForm
        onSubmit={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        onSwitchToSignup={() => navigate(`/signup?redirect=${encodeURIComponent(redirectPath)}`)}
        error={error}
        loading={loading}
      />
    </div>
  );
}
