/**
 * RegisterForm Component
 * User registration form
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isValidEmail, validatePassword } from '../../utils/helpers';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { error: showError, success: showSuccess } = useToast();

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

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const result = await register(formData.email, formData.password);

      if (result.success) {
        showSuccess('Welcome to Screech! 🦉');
      } else {
        showError(result.error || 'Registration failed');
      }
    } catch (err) {
      showError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, label: '' };

    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

    return {
      strength,
      label: labels[strength],
      color: colors[strength]
    };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <Card className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🦉</div>
        <h1 className="text-2xl font-bold text-screech-accent mb-2">
          Join Screech
        </h1>
        <p className="text-screech-textMuted">
          Create your anonymous identity
        </p>
      </div>

      {/* Features */}
      <div className="mb-6 p-4 bg-screech-dark rounded-xl">
        <p className="text-sm text-screech-textMuted mb-3">
          When you sign up, you'll get:
        </p>
        <ul className="space-y-2">
          <FeatureItem text="Random anonymous username" />
          <FeatureItem text="Assigned to a clan" />
          <FeatureItem text="Unique avatar color" />
        </ul>
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
          hint="We'll never share your email"
          required
          autoComplete="email"
          autoFocus
        />

        <div>
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
            autoComplete="new-password"
          />

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full ${
                      level <= passwordStrength.strength
                        ? passwordStrength.color
                        : 'bg-screech-border'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-screech-textMuted">
                Password strength: {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          icon={Lock}
          required
          autoComplete="new-password"
        />

        {/* Terms Agreement */}
        <p className="text-xs text-screech-textMuted">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="text-screech-accent hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-screech-accent hover:underline">
            Privacy Policy
          </Link>
        </p>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          loading={loading}
          icon={UserPlus}
          className="mt-6"
        >
          Create Account
        </Button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-screech-textMuted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-screech-accent font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
};

/**
 * Feature Item Component
 */
const FeatureItem = ({ text }) => {
  return (
    <li className="flex items-center gap-2 text-sm text-screech-text">
      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-screech-accent/20 text-screech-accent">
        <Check size={12} />
      </span>
      {text}
    </li>
  );
};

export default RegisterForm;