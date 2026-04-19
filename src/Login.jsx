import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import './Login.css';

function validatePassword(pw) {
  const errors = [];
  if (pw.length < 6)                   errors.push('At least 6 characters');
  if (!/[A-Z]/.test(pw))              errors.push('At least 1 uppercase letter');
  if (!/[a-z]/.test(pw))              errors.push('At least 1 lowercase letter');
  if (!/[0-9]/.test(pw))              errors.push('At least 1 number');
  if (!/[^A-Za-z0-9]/.test(pw))       errors.push('At least 1 special character (e.g. !@#$%)');
  return errors;
}

export default function Login() {
  const { login } = useAuth();

  // ── Login state ──
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Mode: 'login' | 'register' ──
  const [mode, setMode] = useState('login');

  // ── Register state ──
  const [firstName, setFirstName]           = useState('');
  const [lastName, setLastName]             = useState('');
  const [regEmail, setRegEmail]             = useState('');
  const [regPassword, setRegPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regError, setRegError]             = useState('');
  const [regLoading, setRegLoading]         = useState('');
  const [regSuccess, setRegSuccess]         = useState('');

  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // ── Login submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError('Invalid email or password. Please try again.');
      } else {
        localStorage.setItem('access_token', data.access_token);
        login(data.access_token);
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Register submit ──
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!firstName.trim() || !lastName.trim()) {
      setRegError('First name and last name are required.');
      return;
    }

    const pwErrors = validatePassword(regPassword);
    if (pwErrors.length > 0) {
      setRegError(pwErrors[0]);
      return;
    }

    if (regPassword !== confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setRegLoading(true);

    // ─── TODO (Backend): Call POST /auth/signup here ──────────────────────────
    // Endpoint : POST http://127.0.0.1:5000/auth/signup
    // Headers  : { 'Content-Type': 'application/json' }
    // Body     : {
    //               customerFName : firstName.trim(),
    //               customerLName : lastName.trim(),
    //               email         : regEmail.trim(),
    //               password      : regPassword,
    //               licenseNo     : '',   // add field if required by User model
    //               phone         : '',   // add field if required by User model
    //            }
    // On success (200): setRegSuccess('Account created! Please sign in.');
    //                   then switch back → setMode('login')
    // On error  (400): setRegError(data.Error ?? 'Registration failed.');
    // ──────────────────────────────────────────────────────────────────────────

    setRegLoading(false);
  };

  const switchToRegister = () => {
    setError('');
    setRegError('');
    setRegSuccess('');
    setMode('register');
  };

  const switchToLogin = () => {
    setRegError('');
    setRegSuccess('');
    setMode('login');
  };

  const pwErrors = validatePassword(regPassword);

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Card */}
      <div className={`login-card${mode === 'register' ? ' register-mode' : ''}`}>
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
            </svg>
          </div>
          <div className="login-brand-text">
            <span className="login-brand-name">ParkIT</span>
            <span className="login-brand-sub">Smart Parking System</span>
          </div>
        </div>

        {/* ══════════════ LOGIN VIEW ══════════════ */}
        {mode === 'login' && (
          <>
            <h1 className="login-heading">Welcome back</h1>
            <p className="login-sub">Sign in to access your dashboard</p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="text"
                    className="form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button id="login-submit" type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              {/* ── Register button ── */}
              <button type="button" className="register-btn" onClick={switchToRegister}>
                Create an Account
              </button>
            </form>
          </>
        )}

        {/* ══════════════ REGISTER VIEW ══════════════ */}
        {mode === 'register' && (
          <>
            <h1 className="login-heading">Create Account</h1>
            <p className="login-sub">Fill in your details to register</p>

            <form className="login-form" onSubmit={handleRegister}>
              {/* First Name + Last Name */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-fname">First Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      id="reg-fname"
                      type="text"
                      className="form-input"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-lname">Last Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      id="reg-lname"
                      type="text"
                      className="form-input"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="reg-password"
                    type="password"
                    className="form-input"
                    placeholder="Create a password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                {/* Live password rules */}
                {regPassword.length > 0 && (
                  <ul className="password-hint">
                    {[
                      { test: regPassword.length >= 6,          label: 'At least 6 characters' },
                      { test: /[A-Z]/.test(regPassword),        label: 'At least 1 uppercase letter' },
                      { test: /[a-z]/.test(regPassword),        label: 'At least 1 lowercase letter' },
                      { test: /[0-9]/.test(regPassword),        label: 'At least 1 number' },
                      { test: /[^A-Za-z0-9]/.test(regPassword), label: 'At least 1 special character' },
                    ].map(({ test, label }) => (
                      <li key={label} className={test ? 'hint-ok' : 'hint-fail'}>
                        {test ? '✓' : '✗'} {label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="reg-confirm"
                    type="password"
                    className="form-input"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                {confirmPassword.length > 0 && (
                  <ul className="password-hint">
                    <li className={confirmPassword === regPassword ? 'hint-ok' : 'hint-fail'}>
                      {confirmPassword === regPassword ? '✓' : '✗'} Passwords match
                    </li>
                  </ul>
                )}
              </div>

              {/* Error */}
              {regError && (
                <div className="login-error" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {regError}
                </div>
              )}

              {/* Success */}
              {regSuccess && (
                <div className="login-success" role="status">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
                  </svg>
                  {regSuccess}
                </div>
              )}

              {/* Submit — TODO: backend team wire up /auth/signup here */}
              <button
                id="register-submit"
                type="submit"
                className="login-btn"
                disabled={!!regLoading || pwErrors.length > 0 || confirmPassword !== regPassword}
              >
                {regLoading ? 'Creating account…' : 'Register'}
              </button>

              <button type="button" className="register-toggle" onClick={switchToLogin}>
                Already have an account? <span>Sign In</span>
              </button>
            </form>
          </>
        )}

        <p className="login-hint">ParkIT © {new Date().getFullYear()} – All rights reserved</p>
      </div>
    </div>
  );
}
