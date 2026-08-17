import { createContext, useContext, useState } from 'react';
import { apiPost } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('quiz_ai_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const generateRandomAvatar = (seed) => {
    const styles = ['bottts', 'adventurer', 'lorelei', 'notionists', 'micah', 'avataaars'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const finalSeed = seed || 'scholar_' + Math.random().toString(36).substring(2, 9);
    return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodeURIComponent(finalSeed)}`;
  };

  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      // Authenticate with backend & Cloud MySQL
      const authUser = await apiPost('/api/auth/login', { email: cleanEmail, password });
      localStorage.setItem('quiz_ai_user', JSON.stringify(authUser));
      setUser(authUser);
      return authUser;
    } catch (apiErr) {
      throw new Error(apiErr.message || 'Incorrect email or password. Please check your credentials or sign up.');
    }
  };

  const signup = async (userData) => {
    let name, email, password, role, field, level, avatar, college, bio, gradYear;
    if (typeof userData === 'object' && userData !== null) {
      ({ name, email, password, role, field, level, avatar, college, bio, gradYear } = userData);
    } else {
      name = arguments[0];
      email = arguments[1];
      password = arguments[2];
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();

    if (!cleanEmail) {
      throw new Error('Please provide a valid email address.');
    }

    const payload = {
      name: cleanName || 'Student',
      email: cleanEmail,
      password: password || 'quizai123',
      role: role || 'Computer Science Student',
      field: field || 'Data Structures & Algorithms',
      college: college || 'Institute of Technology',
      bio: bio || 'Exploring engineering subjects and preparing with AI quizzes.',
      grad_year: gradYear || '2026',
      avatar: avatar || generateRandomAvatar(cleanEmail || cleanName)
    };

    // Create user in Cloud MySQL database
    const newUser = await apiPost('/api/auth/register', payload);
    localStorage.setItem('quiz_ai_user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const googleLogin = async (customDetails) => {
    const defaultGoogleUser = customDetails || {
      name: 'Demo Student',
      email: 'demo_student@university.com',
      avatar: generateRandomAvatar('demo_student'),
      role: 'Engineering Student',
      college: 'University Academy',
    };

    const authUser = await apiPost('/api/auth/google', defaultGoogleUser);
    localStorage.setItem('quiz_ai_user', JSON.stringify(authUser));
    setUser(authUser);
    return authUser;
  };

  const updateUserProfile = (updatedFields) => {
    setUser(prev => {
      const updated = {
        ...(prev || {}),
        ...updatedFields,
      };
      localStorage.setItem('quiz_ai_user', JSON.stringify(updated));

      // Also update in registered users list if email matches
      try {
        const storedUsers = JSON.parse(localStorage.getItem('quiz_ai_registered_users') || '[]');
        const idx = storedUsers.findIndex(u => u.email?.toLowerCase() === updated.email?.toLowerCase());
        if (idx !== -1) {
          storedUsers[idx] = updated;
          localStorage.setItem('quiz_ai_registered_users', JSON.stringify(storedUsers));
        }
      } catch (e) {
        console.error('Failed to sync registered users', e);
      }

      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('quiz_ai_user');
    localStorage.removeItem('quiz_ai_registered_users');
    localStorage.removeItem('quiz_ai_received_challenges');
    setUser(null);
  };

  const deleteAccount = async () => {
    if (user?.email) {
      try {
        await apiPost('/api/auth/delete-account', { email: user.email });
      } catch (err) {
        console.warn('Backend delete account error:', err);
      }
    }
    localStorage.removeItem('quiz_ai_user');
    localStorage.removeItem('quiz_ai_registered_users');
    localStorage.removeItem('quiz_ai_received_challenges');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        googleLogin,
        updateUserProfile,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
