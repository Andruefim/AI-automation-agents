import { useState, useCallback, useEffect } from 'react';
import { createBot, getBotStatus } from '../../../shared/api/bots';

type Step = 1 | 2 | 3 | 4;

export function useConnectBot() {
  const [step, setStep] = useState<Step>(1);
  const [token, setToken] = useState('');
  const [botId, setBotId] = useState<number | null>(null);
  const [botUsername, setBotUsername] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [connected, setConnected] = useState(false);
  const [firstGroupId, setFirstGroupId] = useState<number | null>(null);

  const verifyToken = useCallback(async () => {
    if (!token.trim()) return;
    setVerifyError(null);
    setVerifying(true);
    try {
      const res = await createBot(token.trim());
      setBotId(res.botId);
      setBotUsername(res.botUsername);
      setStep(3);
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Invalid token');
    } finally {
      setVerifying(false);
    }
  }, [token]);

  const startPolling = useCallback(() => {
    setPolling(true);
  }, []);

  useEffect(() => {
    if (!polling || botId === null) return;
    const interval = setInterval(async () => {
      try {
        const status = await getBotStatus(botId);
        if (status.connected && status.groups.length > 0) {
          setFirstGroupId(status.groups[0].id);
          setPolling(false);
          setConnected(true);
          setStep(4);
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, botId]);

  const goBackToToken = useCallback(() => {
    setStep(2);
    setPolling(false);
  }, []);

  const reset = useCallback(() => {
    setStep(1);
    setToken('');
    setBotId(null);
    setBotUsername('');
    setVerifyError(null);
    setPolling(false);
    setConnected(false);
  }, []);

  return {
    step,
    setStep,
    token,
    setToken,
    botId,
    botUsername,
    verifying,
    verifyError,
    polling,
    connected,
    firstGroupId,
    verifyToken,
    startPolling,
    goBackToToken,
    reset,
  };
}
