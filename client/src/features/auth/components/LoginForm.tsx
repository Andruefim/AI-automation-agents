import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../../../shared/components/UI';
import { useLoginForm } from '../hooks/useAuthForm';
import styles from '../Auth.module.css';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { email, setEmail, password, setPassword, error, loading, submit } = useLoginForm(() =>
    navigate('/dashboard'),
  );

  return (
    <Card className={styles.card}>
      <h2>Welcome back</h2>
      <p className={styles.sub}>Sign in to your Slediq account</p>
      <form onSubmit={submit} className={styles.form}>
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
  );
};
