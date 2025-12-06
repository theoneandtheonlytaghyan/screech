/**
 * LoginForm Component
 * User login form
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isValidEmail } from '../../utils/helpers';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { error: showError } = useToast();

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (!result.success) {
        showError(result.error || 'Login failed');
      }
    } catch (err) {
      showError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🦉</div>
        <h1 className="text-2xl font-bold text-screech-accent mb-2">
          Welcome Back
        </h1>
        <p className="text-screech-textMuted">
          Sign in to continue to Screech
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={Mail}
          required
          autoComplete="email"
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          icon={Lock}
          required
          autoComplete="current-password"
        />

        {/* Forgot Password Link */}
        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-screech-textMuted hover:text-screech-accent"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          loading={loading}
          icon={LogIn}
          className="mt-6"
        >
          Sign In
        </Button>
      </form>

      {/* Register Link */}
      <div className="mt-6 text-center">
        <p className="text-screech-textMuted">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-screech-accent font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* Demo Account Info */}
      <div className="mt-6 pt-6 border-t border-screech-border">
        <p className="text-xs text-screech-textMuted text-center">
          🦉 Join the anonymous owl community
        </p>
      </div>
    </Card>
  );
};

export default LoginForm;