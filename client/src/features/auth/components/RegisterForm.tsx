import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../../../shared/components/UI';
import { useRegisterForm } from '../hooks/useAuthForm';
import styles from '../Auth.module.css';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { name, setName, email, setEmail, password, setPassword, error, loading, submit } =
    useRegisterForm(() => navigate('/dashboard'));

  return (
    <Card className={styles.card}>
      <h2>Create account</h2>
      <p className={styles.sub}>Start for free — no credit card required</p>
      <form onSubmit={submit} className={styles.form}>
        <Input
          label="Name"
          type="text"
          placeholder="Alex"
          value={name}
          onChange={e => setName(e.target.value)}
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
  );
};
