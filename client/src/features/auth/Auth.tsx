import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../../shared/components/Nav';
import { Button, Card, Input, OrbBg } from '../../shared/components/UI';
import styles from './Auth.module.css';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ── Login ──────────────────────────────────────────────────────
export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Invalid credentials');
        return;
      }
      localStorage.setItem('token', data.access_token);
      navigate('/dashboard');
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <OrbBg />
      <Nav variant="landing" />
      <div className={styles.wrap}>
        <Card className={styles.card}>
          <h2>Welcome back</h2>
          <p className={styles.sub}>Sign in to your Slediq account</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" fullWidth disabled={loading} style={{ marginTop: 6 }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </Button>
          </form>
          <p className={styles.footer}>
            No account?{' '}
            <span className={styles.link} onClick={() => navigate('/register')}>
              Create one
            </span>
          </p>
        </Card>
      </div>
    </div>
  );
};

// ── Register ───────────────────────────────────────────────────
export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Registration failed');
        return;
      }
      localStorage.setItem('token', data.access_token);
      navigate('/dashboard');
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <OrbBg />
      <Nav variant="landing" />
      <div className={styles.wrap}>
        <Card className={styles.card}>
          <h2>Create account</h2>
          <p className={styles.sub}>Start for free — no credit card required</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Name"
              type="text"
              placeholder="Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="min. 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" fullWidth disabled={loading} style={{ marginTop: 6 }}>
              {loading ? 'Creating account…' : 'Create account →'}
            </Button>
          </form>
          <p className={styles.footer}>
            Already have an account?{' '}
            <span className={styles.link} onClick={() => navigate('/login')}>
              Sign in
            </span>
          </p>
        </Card>
      </div>
    </div>
  );
};
