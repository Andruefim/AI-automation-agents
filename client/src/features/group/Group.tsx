import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../../shared/components/Nav';
import { Card, Badge, Toggle, Button, OrbBg, Spinner } from '../../shared/components/UI';
import { useGroup } from './hooks/useGroup';
import styles from './Group.module.css';

const BARS = [35, 55, 70, 100, 60, 45, 30];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const Group: React.FC = () => {
  const navigate = useNavigate();
  const { group, loading, error, updateSettings } = useGroup();

  const settings = group?.settingsJson ?? {};
  const digest = settings.digestEnabled !== false;
  const reminders = settings.remindersEnabled !== false;
  const webSearch = settings.webSearchEnabled === true;
  const frequency = (settings.digestFrequency as string) ?? 'daily-9am';

  const setDigest = useCallback(
    (on: boolean) => updateSettings({ digestEnabled: on }),
    [updateSettings],
  );
  const setReminders = useCallback(
    (on: boolean) => updateSettings({ remindersEnabled: on }),
    [updateSettings],
  );
  const setWebSearch = useCallback(
    (on: boolean) => updateSettings({ webSearchEnabled: on }),
    [updateSettings],
  );
  const setFrequency = useCallback(
    (value: string) => updateSettings({ digestFrequency: value }),
    [updateSettings],
  );

  const title = group?.title ?? 'Unnamed group';
  const botHandle = group?.bot?.botUsername ? `@${group.bot.botUsername}` : '—';
  const createdAt = group?.createdAt
    ? new Date(group.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  if (loading) {
    return (
      <div className={styles.page}>
        <OrbBg />
        <Nav variant="dashboard" />
        <div className={styles.body}>
          <div className={styles.loading}>
            <Spinner size={24} />
            <span>Loading group…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className={styles.page}>
        <OrbBg />
        <Nav variant="dashboard" />
        <div className={styles.body}>
          <p className={styles.error}>{error ?? 'Group not found.'}</p>
          <button className={styles.back} onClick={() => navigate('/dashboard')}>
            ← All groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <OrbBg />
      <Nav variant="dashboard" />
      <div className={styles.body}>
        <button className={styles.back} onClick={() => navigate('/dashboard')}>
          ← All groups
        </button>

        <div className={styles.hero}>
          <div className={styles.heroIcon}>💻</div>
          <div className={styles.heroInfo}>
            <h2>{title}</h2>
            <p>
              {botHandle} {createdAt && `· Connected ${createdAt}`}
            </p>
          </div>
          <div className={styles.heroBadges}>
            <Badge color="green" dot>
              Active
            </Badge>
            <Button variant="ghost" size="sm">
              ⚙ Settings
            </Button>
          </div>
        </div>

        <div className={styles.grid}>
          <div>
            <p className={styles.sectionTitle}>Overview</p>
            <div className={styles.statsRow}>
              <StatCard val="—" label="Total messages" delta="—" dimDelta />
              <StatCard val="—" label="Bot queries" delta="—" dimDelta />
              <StatCard val="—" label="Members" delta="—" dimDelta />
            </div>

            <Card className={styles.chartCard}>
              <p className={styles.sectionTitle} style={{ marginBottom: 4 }}>
                Activity · Last 7 days
              </p>
              <div className={styles.chartBars}>
                {BARS.map((h, i) => (
                  <div
                    key={i}
                    className={[styles.bar, h === 100 ? styles.barHi : ''].join(' ')}
                    style={{ height: `${h}%` }}
                    title={`${DAYS[i]}: ${h} msgs`}
                  />
                ))}
              </div>
              <div className={styles.chartLabels}>
                {DAYS.map(d => (
                  <span key={d} className={styles.chartLabel}>
                    {d}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          <div className={styles.sidePanel}>
            <p className={styles.sectionTitle}>Settings</p>

            <Card className={styles.settingCard}>
              <div className={styles.settingRow}>
                <span className={styles.settingName}>Daily digest</span>
                <Toggle on={digest} onChange={setDigest} />
              </div>
              <p className={styles.settingDesc}>
                Send a summary of key decisions and topics to all members with linked accounts.
              </p>
              {digest && (
                <select
                  className={styles.select}
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                >
                  <option value="daily-9am">Every day at 9:00 AM</option>
                  <option value="daily-6pm">Every day at 6:00 PM</option>
                  <option value="weekly-mon">Every Monday</option>
                  <option value="weekly-fri">Every Friday</option>
                </select>
              )}
            </Card>

            <Card className={styles.settingCard}>
              <div className={styles.settingRow}>
                <span className={styles.settingName}>Smart reminders</span>
                <Toggle on={reminders} onChange={setReminders} />
              </div>
              <p className={styles.settingDesc}>
                Auto-detect tasks and deadlines mentioned in chat and send DM reminders.
              </p>
            </Card>

            <Card className={styles.settingCard}>
              <div className={styles.settingRow}>
                <span className={styles.settingName}>Web search</span>
                <Toggle on={webSearch} onChange={setWebSearch} />
              </div>
              <p className={styles.settingDesc}>
                Allow the bot to fetch real-time information when answering queries.
              </p>
            </Card>

            <p className={styles.sectionTitle} style={{ marginTop: 8 }}>
              Members
            </p>

            <div className={styles.linkBanner}>
              <span className={styles.linkBannerIcon}>🔗</span>
              <div>
                <strong>Link your account</strong>
                <p>Share slediq.io/link so members can connect accounts and use private chat.</p>
              </div>
            </div>

            <Card className={styles.membersCard}>
              <p className={styles.muted}>Member list from Telegram (coming soon)</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  val: string;
  label: string;
  delta: string;
  dimDelta?: boolean;
}> = ({ val, label, delta, dimDelta }) => (
  <Card className={styles.statCard}>
    <span className={styles.sv}>{val}</span>
    <span className={styles.sl}>{label}</span>
    <span className={[styles.delta, dimDelta ? styles.deltaDim : ''].join(' ')}>{delta}</span>
  </Card>
);
