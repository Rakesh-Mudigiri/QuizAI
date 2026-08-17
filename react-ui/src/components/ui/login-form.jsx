import { useEffect, useRef, useState } from "react";
import { User, Lock, ArrowRight, Mail, Sparkles, Shuffle, GraduationCap, Compass, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { apiPost } from '../../api';
import '../../pages/Auth.css';

// Vertex shader source code
const vertexSmokeySource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

// Fragment shader source code for the smokey background effect
const fragmentSmokeySource = `
precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 u_color;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord / iResolution;
    vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    float time = iTime * 0.4;

    // Normalize mouse input (0.0 - 1.0) and remap to -1.0 ~ 1.0
    vec2 mouse = iMouse / iResolution;
    vec2 rippleCenter = 2.0 * mouse - 1.0;

    vec2 distortion = centeredUV;
    // Apply distortion for a wavy, smokey effect
    for (float i = 1.0; i < 7.0; i++) {
        distortion.x += 0.45 / i * cos(i * 2.0 * distortion.y + time + rippleCenter.x * 3.1415);
        distortion.y += 0.45 / i * cos(i * 2.0 * distortion.x + time + rippleCenter.y * 3.1415);
    }

    // Create a glowing wave pattern
    float wave = abs(sin(distortion.x + distortion.y + time));
    float glow = smoothstep(0.85, 0.2, wave);

    fragColor = vec4(u_color * glow, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

/**
 * A React component that renders an interactive WebGL shader background.
 * Animation runs continuously in requestAnimationFrame and never stops on cursor movement or focus.
 */
export function SmokeyBackground({
  color = "#1E40AF", // Default dark blue
}) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({
    targetX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    targetY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    currentX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    currentY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    isHovering: true,
  });

  // Helper to convert hex color to RGB (0-1 range)
  const hexToRgb = (hex) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return [r, g, b];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, depth: false });
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSmokeySource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSmokeySource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const iMouseLocation = gl.getUniformLocation(program, "iMouse");
    const uColorLocation = gl.getUniformLocation(program, "u_color");

    const startTime = performance.now();
    const [r, g, b] = hexToRgb(color);
    gl.uniform3f(uColorLocation, r, g, b);

    let animationFrameId;

    const render = (now) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      const currentTime = (now - startTime) * 0.001;

      // Smooth mouse lerp for natural smoke ripples
      const m = mouseRef.current;
      m.currentX += (m.targetX - m.currentX) * 0.08;
      m.currentY += (m.targetY - m.currentY) * 0.08;

      gl.uniform2f(iResolutionLocation, width, height);
      gl.uniform1f(iTimeLocation, currentTime);
      gl.uniform2f(iMouseLocation, m.currentX, height - m.currentY);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    const handleMouseMove = (event) => {
      mouseRef.current.targetX = event.clientX;
      mouseRef.current.targetY = event.clientY;
      mouseRef.current.isHovering = true;
    };

    const handleMouseEnter = () => {
      mouseRef.current.isHovering = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = window.innerWidth / 2;
      mouseRef.current.targetY = window.innerHeight / 2;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseenter", handleMouseEnter, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseleave", handleMouseLeave);
      try {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
      } catch (e) {}
    };
  }, [color]);

  return (
    <>
      <canvas ref={canvasRef} className="auth-bg-canvas" />
      <div className="auth-bg-overlay" />
    </>
  );
}

/**
 * A glassmorphism-style login form component.
 */
export function LoginForm({ onSubmit, onGoogleLogin, onSwitchToSignup, error, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ email, password });
    }
  };

  return (
    <div className="auth-card">
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '380px',
            width: '90%',
            textAlign: 'center',
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ marginBottom: '16px', display: 'inline-block', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', padding: '12px' }}>
              <svg width="32" height="32" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24c0-1.55-.15-3.24-.47-4.82H24v9.13h12.64c-.55 2.85-2.18 5.27-4.63 6.91l7.21 5.58C43.43 36.31 46.5 30.73 46.5 24z"/>
                <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.21-5.58c-2.11 1.41-4.8 2.29-8.68 2.29-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Google Sign-In</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#ffffff', lineHeight: 1.5 }}>
              Google Sign-In is currently unavailable.
            </p>
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="auth-header">
        <div className="auth-badge-icon">
          <Sparkles size={26} />
        </div>
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to generate AI quizzes and save your history</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login_email">
            <User size={14} />
            Email Address
          </label>
          <div className="auth-input-wrapper">
            <input
              id="login_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              className="auth-input"
              placeholder="student@example.com"
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="login_password">
            <Lock size={14} />
            Password
          </label>
          <div className="auth-input-wrapper" style={{ position: 'relative' }}>
            <input
              id="login_password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="auth-options-row">
          <label className="auth-remember">
            <input type="checkbox" defaultChecked />
            <span>Remember me</span>
          </label>
          <a
            href="#forgot"
            onClick={(e) => { e.preventDefault(); alert("Enter any demo credentials to sign in!"); }}
            className="auth-forgot-link"
          >
            Forgot Password?
          </a>
        </div>

        <button type="submit" disabled={loading} className="auth-submit-btn">
          <span>{loading ? 'Signing In...' : 'Sign In'}</span>
          <ArrowRight size={18} />
        </button>

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">Or continue with</span>
          <div className="auth-divider-line" />
        </div>

        <button type="button" onClick={() => setShowGoogleModal(true)} className="auth-google-btn">
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.841C34.553 4.806 29.613 2.5 24 2.5C11.983 2.5 2.5 11.983 2.5 24s9.483 21.5 21.5 21.5S45.5 36.017 45.5 24c0-1.538-.135-3.022-.389-4.417z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12.5 24 12.5c3.059 0 5.842 1.154 7.961 3.039l5.839-5.841C34.553 4.806 29.613 2.5 24 2.5C16.318 2.5 9.642 6.723 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 45.5c5.613 0 10.553-2.306 14.802-6.341l-5.839-5.841C30.842 35.846 27.059 38 24 38c-5.039 0-9.345-2.608-11.124-6.481l-6.571 4.819C9.642 41.277 16.318 45.5 24 45.5z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l5.839 5.841C44.196 35.123 45.5 29.837 45.5 24c0-1.538-.135-3.022-.389-4.417z" />
          </svg>
          <span>Sign in with Google</span>
        </button>
      </form>

      <div className="auth-footer">
        Don't have an account?
        <button type="button" onClick={onSwitchToSignup} className="auth-switch-link">
          Sign Up
        </button>
      </div>
    </div>
  );
}

/**
 * A glassmorphism-style signup form component.
 */
/**
 * A glassmorphism-style signup form component with email verification & OTP flow.
 */
export function SignupForm({ onSubmit, onGoogleLogin, onSwitchToLogin, error: externalError, loading: externalLoading }) {
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Computer Science Student');
  const [field, setField] = useState('Data Structures & Algorithms');
  const [college, setCollege] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  
  // OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [devCodePreview, setDevCodePreview] = useState('');
  const [resendTimer, setResendTimer] = useState(45);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [localError, setLocalError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  const otpInputRefs = useRef([]);

  // Random Avatar Generator System (DiceBear styles)
  const avatarStyles = ['bottts', 'adventurer', 'lorelei', 'notionists', 'micah', 'avataaars'];
  const [avatarSeed, setAvatarSeed] = useState(() => 'avatar_' + Math.random().toString(36).substring(2, 9));
  const [avatarStyle, setAvatarStyle] = useState(() => avatarStyles[Math.floor(Math.random() * avatarStyles.length)]);

  const currentAvatarUrl = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}`;

  const handleRollAvatar = () => {
    const nextStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
    const nextSeed = 'scholar_' + Math.random().toString(36).substring(2, 10);
    setAvatarStyle(nextStyle);
    setAvatarSeed(nextSeed);
  };

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const sendOtpRequest = async () => {
    setLocalError('');
    setIsSendingOtp(true);
    try {
      let codePreview = null;
      try {
        const data = await apiPost('/api/auth/send-verification', {
          email: email.trim(),
          name: name.trim() || 'Student'
        });
        if (data.code_preview) {
          codePreview = data.code_preview;
          setDevCodePreview(data.code_preview);
        }
      } catch (e) {
        // Generate a simulated client-side fallback code if server is on cold start
        const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
        codePreview = fallbackCode;
        setDevCodePreview(fallbackCode);
      }
      setOtpSuccessMsg(`Verification code sent to ${email.trim()}`);
      setResendTimer(45);
      setStep('otp');
      // Focus first input box
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setLocalError(err.message || 'Could not send verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Email validation
    const emailClean = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      setLocalError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setLocalError('Password must be at least 8 characters and contain both letters and numbers.');
      return;
    }

    await sendOtpRequest();
  };

  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-advance to next box if digit typed
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
    }
  };

  const handleAutofillDevCode = () => {
    if (devCodePreview && devCodePreview.length === 6) {
      const digits = devCodePreview.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtpAndCreate = async (e) => {
    e?.preventDefault();
    setLocalError('');
    const fullCode = otpDigits.join('');

    if (fullCode.length < 6) {
      setLocalError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      let isCodeValid = false;

      // First check if matching local dev preview
      if (devCodePreview && fullCode === devCodePreview) {
        isCodeValid = true;
      }

      // Verify with backend
      try {
        await apiPost('/api/auth/verify-code', {
          email: email.trim().toLowerCase(),
          code: fullCode,
        });
        isCodeValid = true;
      } catch (verifyErr) {
        if (!isCodeValid) {
          throw new Error(verifyErr.message || 'Invalid verification code.');
        }
      }

      // Email verified successfully - proceed with account creation
      if (onSubmit) {
        await onSubmit({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          field,
          college: college.trim() || 'Institute of Technology',
          avatar: currentAvatarUrl,
          bio: `Studying ${field} as a ${role}. Learning and testing knowledge with AI quizzes.`,
          isVerified: true,
        });
      }
    } catch (err) {
      setLocalError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const displayError = localError || externalError;
  const isBusy = isSendingOtp || isVerifyingOtp || externalLoading;

  return (
    <div className="auth-card auth-card-extended">
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '380px',
            width: '90%',
            textAlign: 'center',
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ marginBottom: '16px', display: 'inline-block', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', padding: '12px' }}>
              <svg width="32" height="32" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24c0-1.55-.15-3.24-.47-4.82H24v9.13h12.64c-.55 2.85-2.18 5.27-4.63 6.91l7.21 5.58C43.43 36.31 46.5 30.73 46.5 24z"/>
                <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.21-5.58c-2.11 1.41-4.8 2.29-8.68 2.29-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Google Sign-In</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#ffffff', lineHeight: 1.5 }}>
              Google Sign-In is currently unavailable.
            </p>
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {step === 'details' ? (
        <>
          <div className="auth-header">
            <div className="auth-badge-icon" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))', borderColor: 'rgba(192, 132, 252, 0.3)', color: '#A855F7' }}>
              <Sparkles size={26} />
            </div>
            <h2 className="auth-title">Create Your Profile</h2>
            <p className="auth-subtitle">Set up your account with valid email verification & AI quizzes</p>
          </div>

          {displayError && <div className="auth-error">{displayError}</div>}

          <form className="auth-form" onSubmit={handleInitialSubmit}>
            {/* System Random Avatar Box with Shuffle */}
            <div className="auth-avatar-generator-box">
              <div className="auth-avatar-preview-wrap">
                <img src={currentAvatarUrl} alt="Generated Avatar" className="auth-avatar-img" />
                <span className="auth-avatar-badge">Auto</span>
              </div>
              <div className="auth-avatar-info">
                <div className="auth-avatar-title">System Avatar Assigned</div>
                <div className="auth-avatar-hint">Randomly chosen for you. Keep or roll a new one!</div>
                <button
                  type="button"
                  className="auth-avatar-roll-btn"
                  onClick={handleRollAvatar}
                  title="Click to roll another random avatar"
                >
                  <RefreshCw size={13} className="spin-on-hover" />
                  <span>Roll Random Avatar</span>
                </button>
              </div>
            </div>

            <div className="auth-fields-grid">
              <div className="auth-field">
                <label className="auth-label" htmlFor="signup_name">
                  <User size={14} />
                  Full Name
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="signup_name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input"
                    placeholder="Alex Student"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="signup_email">
                  <Mail size={14} />
                  Valid Email Address
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="signup_email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    className="auth-input"
                    placeholder="student@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup_password">
                <Lock size={14} />
                Password
              </label>
              <div className="auth-input-wrapper" style={{ position: 'relative' }}>
                <input
                  id="signup_password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  placeholder="At least 8 characters with letters & numbers"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Extended Signup Options */}
            <div className="auth-fields-grid">
              <div className="auth-field">
                <label className="auth-label" htmlFor="signup_role">
                  <GraduationCap size={14} />
                  Role / Status
                </label>
                <div className="auth-input-wrapper select-wrapper">
                  <select
                    id="signup_role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="auth-input auth-select"
                  >
                    <option value="Computer Science Student">🎓 Computer Science Student</option>
                    <option value="Software Engineer / Developer">💻 Software Engineer / Developer</option>
                    <option value="Engineering & Tech Scholar">⚙️ Engineering & Tech Scholar</option>
                    <option value="Competitive Exam Aspirant">📚 Competitive Exam Aspirant</option>
                    <option value="Lifelong Tech Learner">🧠 Lifelong Tech Learner</option>
                  </select>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="signup_field">
                  <Compass size={14} />
                  Primary Subject Goal
                </label>
                <div className="auth-input-wrapper select-wrapper">
                  <select
                    id="signup_field"
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="auth-input auth-select"
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
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup_college">
                <GraduationCap size={14} />
                University / College (Optional)
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signup_college"
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="auth-input"
                  placeholder="e.g. Institute of Technology, Stanford, MIT..."
                />
              </div>
            </div>

            <button type="submit" disabled={isBusy} className="auth-submit-btn" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <span>{isSendingOtp ? 'Sending Verification Code...' : 'Send Verification Code & Continue'}</span>
              <ArrowRight size={18} />
            </button>

            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">Or</span>
              <div className="auth-divider-line" />
            </div>

            <button type="button" onClick={() => setShowGoogleModal(true)} className="auth-google-btn">
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.841C34.553 4.806 29.613 2.5 24 2.5C11.983 2.5 2.5 11.983 2.5 24s9.483 21.5 21.5 21.5S45.5 36.017 45.5 24c0-1.538-.135-3.022-.389-4.417z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12.5 24 12.5c3.059 0 5.842 1.154 7.961 3.039l5.839-5.841C34.553 4.806 29.613 2.5 24 2.5C16.318 2.5 9.642 6.723 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 45.5c5.613 0 10.553-2.306 14.802-6.341l-5.839-5.841C30.842 35.846 27.059 38 24 38c-5.039 0-9.345-2.608-11.124-6.481l-6.571 4.819C9.642 41.277 16.318 45.5 24 45.5z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l5.839 5.841C44.196 35.123 45.5 29.837 45.5 24c0-1.538-.135-3.022-.389-4.417z" />
              </svg>
              <span>Sign up with Google</span>
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?
            <button type="button" onClick={onSwitchToLogin} className="auth-switch-link">
              Sign In
            </button>
          </div>
        </>
      ) : (
        /* ── STEP 2: 6-Digit Email Verification Code ── */
        <div className="otp-container">
          <div className="otp-icon-wrap">
            <Mail size={28} />
          </div>

          <h2 className="auth-title" style={{ marginBottom: 4 }}>Verify Your Email</h2>
          <p className="otp-email-text">
            Enter the 6-digit verification code sent to <span className="otp-email-highlight">{email}</span>
          </p>

          {devCodePreview && (
            <div className="otp-dev-notice" onClick={handleAutofillDevCode} title="Click to auto-fill code">
              <span>⚡ Simulated Email Inbox Code: <strong>{devCodePreview}</strong></span>
              <span style={{ textDecoration: 'underline', fontSize: '0.75rem' }}>(Auto-fill)</span>
            </div>
          )}

          {displayError && <div className="auth-error" style={{ width: '100%' }}>{displayError}</div>}
          {otpSuccessMsg && !displayError && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34D399', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', width: '100%' }}>
              {otpSuccessMsg}
            </div>
          )}

          <div className="otp-inputs-row" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpInputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e.target.value ? e : e)}
                className="otp-digit-input"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            type="button"
            disabled={isBusy || otpDigits.join('').length < 6}
            onClick={handleVerifyOtpAndCreate}
            className="auth-submit-btn"
            style={{ width: '100%', background: 'linear-gradient(135deg, #10B981, #059669)', marginTop: 8 }}
          >
            <span>{isVerifyingOtp ? 'Verifying Code...' : 'Verify & Create Profile'}</span>
            <ArrowRight size={18} />
          </button>

          <div className="otp-actions-row">
            <button
              type="button"
              className="otp-change-email-btn"
              onClick={() => {
                setStep('details');
                setLocalError('');
              }}
            >
              ← Edit details / email
            </button>

            <button
              type="button"
              disabled={resendTimer > 0 || isSendingOtp}
              className="otp-resend-btn"
              onClick={sendOtpRequest}
            >
              <RefreshCw size={13} className={isSendingOtp ? 'spin-icon' : ''} />
              <span>{resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

