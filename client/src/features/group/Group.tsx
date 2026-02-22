import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../../shared/components/Nav';
import { Card, Badge, Toggle, Button, OrbBg } from '../../shared/components/UI';
import styles from './Group.module.css';

const MEMBERS = [
  { name: 'Alex',   handle: '@alex_dev', linked: true  },
  { name: 'Maria',  handle: '@maria_k',  linked: true  },
  { name: 'Denis',  handle: '@denis99',  linked: true  },
  { name: 'Sergey', handle: '@sr_dev',   linked: false },
  { name: 'Natasha',handle: '@nat_pm',   linked: false },
];

const BARS = [35, 55, 70, 100, 60, 45, 30];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const Group: React.FC = () => {
  const navigate = useNavigate();
  const [digest,     setDigest]     = useState(true);
  const [reminders,  setReminders]  = useState(true);
  const [webSearch,  setWebSearch]  = useState(false);
  const [frequency,  setFrequency]  = useState('daily-9am');

  return (
    <div className={styles.page}>
      <OrbBg />
      <Nav variant="dashboard" />
      <div className={styles.body}>
        <button className={styles.back} onClick={() => navigate('/dashboard')}>
          ← All groups
        </button>

        {/* hero */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}>💻</div>
          <div className={styles.heroInfo}>
            <h2>Dev Team</h2>
            <p>@devteam_slediq_bot · Connected Jan 12, 2025</p>
          </div>
          <div className={styles.heroBadges}>
            <Badge color="green" dot>Active</Badge>
            <Button variant="ghost" size="sm">⚙ Settings</Button>
          </div>
        </div>

        <div className={styles.grid}>
          {/* left column */}
          <div>
            <p className={styles.sectionTitle}>Overview</p>
            <div className={styles.statsRow}>
              <StatCard val="14,218" label="Total messages"  delta="↑ +340 this week" />
              <StatCard val="341"    label="Bot queries"     delta="↑ +28 this week" />
              <StatCard val="8"      label="Members"         delta="5 linked accounts" dimDelta />
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
                {DAYS.map(d => <span key={d} className={styles.chartLabel}>{d}</span>)}
              </div>
            </Card>
          </div>

          {/* right column */}
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

            <p className={styles.sectionTitle} style={{ marginTop: 8 }}>Members</p>

            <div className={styles.linkBanner}>
              <span className={styles.linkBannerIcon}>🔗</span>
              <div>
                <strong>3 members not linked</strong>
                <p>Share slediq.io/link so they can connect accounts and use private chat.</p>
              </div>
            </div>

            <Card className={styles.membersCard}>
              {MEMBERS.map(m => (
                <div key={m.handle} className={styles.memberRow}>
                  <div className={styles.mAv}>{m.name[0]}</div>
                  <div className={styles.mName}>
                    {m.name} <span className={styles.mHandle}>{m.handle}</span>
                  </div>
                  <span className={m.linked ? styles.linked : styles.unlinked}>
                    {m.linked ? 'linked' : 'not linked'}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── sub ──────────────────────────────────────────────────────
const StatCard: React.FC<{ val: string; label: string; delta: string; dimDelta?: boolean }> = ({ val, label, delta, dimDelta }) => (
  <Card className={styles.statCard}>
    <span className={styles.sv}>{val}</span>
    <span className={styles.sl}>{label}</span>
    <span className={[styles.delta, dimDelta ? styles.deltaDim : ''].join(' ')}>{delta}</span>
  </Card>
);
