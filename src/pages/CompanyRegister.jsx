import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../services/firebase/config';
import './CompanyRegister.css';

export function CompanyRegister() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialEmail = params.get('email') || '';
  const initialPlan = params.get('plan') || '';

  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    email: initialEmail,
    password: '',
    confirmPassword: '',
    plan: initialPlan,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const el = document.querySelector('#company-name');
    if (el) el.focus();
  }, []);

  useEffect(() => {
    // Calculate password strength
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength++;
      if (/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password)) strength++;
      if (/\d/.test(formData.password)) strength++;
      if (/[^a-zA-Z0-9]/.test(formData.password)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const slugify = (text) => {
    if (!text) return `company-${Date.now()}`;
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner/Admin name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 2) {
      newErrors.password = 'Password is too weak';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const db = getDb();
      const slug = slugify(formData.companyName || formData.ownerName || `company-${Date.now()}`);

      // Save registration request to Firestore
      const registrationRequest = {
        companyName: formData.companyName,
        ownerName: formData.ownerName,
        email: formData.email,
        plan: formData.plan || 'starter',
        slug: slug,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'company-registration-requests'), registrationRequest);

      // Show confirmation instead of navigating
      setIsSubmitted(true);
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert('Failed to submit registration request — please try again.');
    }
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$199',
      period: '/mo',
      description: 'Perfect for small teams',
      features: ['Up to 10 users', 'Basic features', 'Email support'],
      popular: false,
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '$499',
      period: '/mo',
      description: 'Best for growing teams',
      features: ['Up to 50 users', 'Advanced features', 'Priority support'],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations',
      features: ['Unlimited users', 'Custom features', 'Dedicated support'],
      popular: false,
    },
  ];

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 2) return 'Fair';
    if (passwordStrength <= 3) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#ef4444';
    if (passwordStrength <= 2) return '#f59e0b';
    if (passwordStrength <= 3) return '#3b82f6';
    return '#10b981';
  };

  // Show confirmation screen if submitted
  if (isSubmitted) {
    return (
      <div className="company-register-page">
        <div className="company-register-container">
          <div className="confirmation-section">
            <div className="confirmation-icon">✓</div>
            <h1 className="confirmation-title">Request Received!</h1>
            <p className="confirmation-message">
              Thank you for registering your company, <strong>{formData.companyName}</strong>.
            </p>
            <p className="confirmation-details">
              We've received your registration request and will contact you at <strong>{formData.email}</strong> soon to complete the setup process.
            </p>
            <p className="confirmation-note">
              Our team will review your request and get in touch with you shortly. In the meantime, you can return to our homepage.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="confirmation-button"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="company-register-page">
      <div className="company-register-container">
        {/* Header */}
        <div className="register-header">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="back-to-home-button"
          >
            ← Back to Home
          </button>
          <div className="register-icon">🏢</div>
          <h1 className="register-title">Register Your Company</h1>
          <p className="register-subtitle">
            Create your company account to get started. We'll set up an admin account for you automatically.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="register-form">
          {/* Company Information Section */}
          <div className="form-section-card">

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="company-name" className="form-label">
                  <span className="label-icon">🏢</span>
                  Company Name
                  <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="company-name"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('companyName')}
                    onBlur={() => setFocusedField('')}
                    className={`form-input ${errors.companyName ? 'error' : ''} ${
                      focusedField === 'companyName' ? 'focused' : ''
                    }`}
                    placeholder="Acme Roofing Inc."
                    required
                  />
                </div>
                {errors.companyName && <span className="error-message">{errors.companyName}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="owner-name" className="form-label">
                  <span className="label-icon">👤</span>
                  Owner / Admin Name
                  <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="owner-name"
                    name="ownerName"
                    type="text"
                    value={formData.ownerName}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('ownerName')}
                    onBlur={() => setFocusedField('')}
                    className={`form-input ${errors.ownerName ? 'error' : ''} ${
                      focusedField === 'ownerName' ? 'focused' : ''
                    }`}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                {errors.ownerName && <span className="error-message">{errors.ownerName}</span>}
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="form-section-card">

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="email" className="form-label">
                  <span className="label-icon">📧</span>
                  Email Address
                  <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    className={`form-input ${errors.email ? 'error' : ''} ${
                      focusedField === 'email' ? 'focused' : ''
                    }`}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="password" className="form-label">
                  <span className="label-icon">🔒</span>
                  Password
                  <span className="required">*</span>
                </label>
                <div className="input-wrapper password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    className={`form-input ${errors.password ? 'error' : ''} ${
                      focusedField === 'password' ? 'focused' : ''
                    }`}
                    placeholder="Create a secure password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="password-strength-bar">
                      <div
                        className="password-strength-fill"
                        style={{
                          width: `${(passwordStrength / 4) * 100}%`,
                          backgroundColor: getPasswordStrengthColor(),
                        }}
                      />
                    </div>
                    <span className="password-strength-label" style={{ color: getPasswordStrengthColor() }}>
                      {getPasswordStrengthLabel()}
                    </span>
                  </div>
                )}
                {errors.password && <span className="error-message">{errors.password}</span>}
                {formData.password && !errors.password && passwordStrength >= 2 && (
                  <span className="success-message">✓ Password meets requirements</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="confirm-password" className="form-label">
                  <span className="label-icon">🔒</span>
                  Confirm Password
                  <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField('')}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''} ${
                      focusedField === 'confirmPassword' ? 'focused' : ''
                    }`}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                {formData.confirmPassword &&
                  !errors.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <span className="success-message">✓ Passwords match</span>
                  )}
              </div>
            </div>
          </div>

          {/* Plan Selection Section */}
          <div className="form-section-card">

            <div className="plan-selection">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`plan-card ${formData.plan === plan.id ? 'selected' : ''} ${
                    plan.popular ? 'popular' : ''
                  }`}
                  onClick={() => setFormData((prev) => ({ ...prev, plan: plan.id }))}
                >
                  {plan.popular && <div className="popular-badge">Most Popular</div>}
                  <div className="plan-header">
                    <h3 className="plan-name">{plan.name}</h3>
                    <div className="plan-price">
                      <span className="price-amount">{plan.price}</span>
                      {plan.period && <span className="price-period">{plan.period}</span>}
                    </div>
                    <p className="plan-description">{plan.description}</p>
                  </div>
                  <ul className="plan-features">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="plan-feature">
                        <span className="feature-check">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="plan-select-indicator">
                    {formData.plan === plan.id ? '✓ Selected' : 'Select Plan'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Section */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={submitting}
              className={`submit-button ${submitting ? 'submitting' : ''}`}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Creating Your Company...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Create Company Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyRegister;
