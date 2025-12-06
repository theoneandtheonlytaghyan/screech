/**
 * AuthPage Component
 * Container for authentication forms
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { PageLoader } from '../common/Loader';

const AuthPage = ({ mode = 'login' }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  // Show loading while checking auth
  if (loading) {
    return <PageLoader message="Checking authentication..." />;
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-screech-dark flex flex-col">
      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A574' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-screech-accent flex items-center justify-center gap-3">
              <span className="text-5xl">🦉</span>
              Screech
            </h1>
            <p className="text-screech-textMuted mt-2">
              Anonymous Social Network
            </p>
          </div>

          {/* Auth Form */}
          {mode === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center relative z-10">
        <p className="text-sm text-screech-textMuted">
          © {new Date().getFullYear()} Screech. All rights reserved.
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <a
            href="/about"
            className="text-xs text-screech-textMuted hover:text-screech-accent"
          >
            About
          </a>
          <a
            href="/terms"
            className="text-xs text-screech-textMuted hover:text-screech-accent"
          >
            Terms
          </a>
          <a
            href="/privacy"
            className="text-xs text-screech-textMuted hover:text-screech-accent"
          >
            Privacy
          </a>
          <a
            href="/help"
            className="text-xs text-screech-textMuted hover:text-screech-accent"
          >
            Help
          </a>
        </div>
      </footer>
    </div>
  );
};

/**
 * Login Page
 */
export const LoginPage = () => {
  return <AuthPage mode="login" />;
};

/**
 * Register Page
 */
export const RegisterPage = () => {
  return <AuthPage mode="register" />;
};

/**
 * Protected Route Component
 * Wraps routes that require authentication
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  if (loading) {
    return <PageLoader message="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
};

/**
 * Public Only Route Component
 * Wraps routes that should only be accessible when NOT authenticated
 */
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <PageLoader message="Loading..." />;
  }

  if (isAuthenticated) {
    return null;
  }

  return children;
};

export default AuthPage;