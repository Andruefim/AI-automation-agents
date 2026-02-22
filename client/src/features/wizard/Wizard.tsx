import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../../shared/components/Nav';
import { Button, Card, Input, OrbBg, Spinner } from '../../shared/components/UI';
import styles from './Wizard.module.css';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['BotFather', 'Token', 'Add to group', 'Done'];

export const Wizard: React.FC = () => {
  const navigate              = useNavigate();
  const [step, setStep]       = useState<Step>(1);
  const [token, setToken]     = useState('');
  const [verified, setVerified] = useState(false);
  const [polling, setPolling] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = () => {
    if (!token.trim()) return;
    setVerifying(true);
    // TODO: call POST /bots with token, then setVerified(true) on success
    setTimeout(() => { setVerifying(false); setVerified(true); }, 800);
  };

  const handleAddGroup = () => {
    setStep(3);
    setPolling(true);
  };

  // Simulate polling — replace with: GET /bots/:id/status polling
  useEffect(() => {
    if (!polling) return;
    const t = setTimeout(() => { setPolling(false); setStep(4); }, 4000);
    return () => clearTimeout(t);
  }, [polling]);

  return (
    <div className={styles.page}>
      <OrbBg />
      <Nav variant="dashboard" />
      <div className={styles.wrap}>
        <Card className={styles.card}>
          <h2>Connect a group</h2>
          <p className={styles.sub}>Follow the steps to add Slediq to your Telegram group</p>

          {/* Step progress */}
          <div className={styles.steps}>
            {STEP_LABELS.map((label, i) => {
              const n      = (i + 1) as Step;
              const done   = n < step;
              const active = n === step;
              return (
                <React.Fragment key={label}>
                  {i > 0 && <div className={styles.line} />}
                  <div className={[styles.ws, done ? styles.done : '', active ? styles.active : ''].join(' ')}>
                    <div className={styles.wsn}>{done ? '✓' : n}</div>
                    <span>{label}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className={styles.stepBody}>
              <div className={styles.info}>
                <p>
                  Open Telegram and message <code>@BotFather</code>. Send{' '}
                  <code>/newbot</code>, choose a name and username for your bot.
                  BotFather will give you a token — copy it.
                </p>
              </div>
              <div className={styles.actions}>
                <Button as="a" href="https://t.me/BotFather" target="_blank" variant="secondary">
                  Open @BotFather ↗
                </Button>
                <Button onClick={() => setStep(2)}>I have my token →</Button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className={styles.stepBody}>
              <div className={styles.info}>
                <p>
                  Paste the bot token from <code>@BotFather</code> below. We'll
                  verify it and register your bot.
                </p>
              </div>
              <div className={styles.tokenRow}>
                <Input
                  label="Bot token"
                  placeholder="123456789:ABCdef..."
                  value={token}
                  onChange={e => { setToken(e.target.value); setVerified(false); }}
                />
                {verified && <span className={styles.verified}>✓ Verified</span>}
              </div>
              <div className={styles.actions}>
                <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                {!verified
                  ? <Button onClick={handleVerify} disabled={!token.trim() || verifying}>
                      {verifying ? <><Spinner size={14} /> Verifying…</> : 'Verify token →'}
                    </Button>
                  : <Button onClick={handleAddGroup}>Continue →</Button>
                }
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className={styles.stepBody}>
              <div className={styles.info}>
                <p>
                  Your bot <code>@mygroup_slediq_bot</code> is ready. Add it to
                  your Telegram group as an admin with{' '}
                  <strong>read messages</strong> permission.
                </p>
              </div>
              <Button as="a" href="#" variant="primary">
                Add bot to group ↗
              </Button>
              {polling && (
                <div className={styles.polling}>
                  <Spinner size={16} />
                  Waiting for bot to receive first message in a group…
                </div>
              )}
              <div className={styles.actions} style={{ marginTop: 4 }}>
                <Button variant="ghost" onClick={() => { setStep(2); setPolling(false); }}>← Back</Button>
              </div>
            </div>
          )}

          {/* Step 4 — success */}
          {step === 4 && (
            <div className={styles.success}>
              <div className={styles.successIcon}>✓</div>
              <h3>Group connected!</h3>
              <p>
                Slediq is now live in <strong>Dev Team</strong>.<br />
                Members can mention <code>@mygroup_slediq_bot</code> to query
                the group memory.
              </p>
              <div className={styles.successActions}>
                <Button variant="secondary" onClick={() => navigate('/dashboard/groups/1')}>
                  View group →
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to dashboard
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
