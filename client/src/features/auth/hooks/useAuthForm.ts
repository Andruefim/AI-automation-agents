import { useState, useCallback } from 'react';
import { useAuth } from '../../../shared/context/useAuth';

export function useLoginForm(onSuccess: () => void) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        await login(email, password);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Cannot reach server. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, onSuccess],
  );

  return { email, setEmail, password, setPassword, error, loading, submit };
}

export function useRegisterForm(onSuccess: () => void) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      setLoading(true);
      try {
        await register(email, password);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Cannot reach server. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [email, password, register, onSuccess],
  );

  return { name, setName, email, setEmail, password, setPassword, error, loading, submit };
}
