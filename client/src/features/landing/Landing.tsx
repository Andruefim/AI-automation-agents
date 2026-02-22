import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../../shared/components/Nav';
import { Button, Badge, OrbBg } from '../../shared/components/UI';
import styles from './Landing.module.css';

const features = [
  { icon: '🧠', title: 'Infinite group memory',   desc: 'Slediq indexes every message with semantic search. Ask anything about discussions — even months ago.' },
  { icon: '🔒', title: 'Private by default',       desc: 'Your own bot token, your own data. Nothing shared with third parties. Local model option available.' },
  { icon: '📬', title: 'Smart digests',            desc: 'Daily or weekly summary of decisions, open questions and action items delivered to your DMs.' },
  { icon: '⚡', title: 'Cross-group context',      desc: 'Message the bot privately and it synthesises knowledge across all your groups at once.' },
];

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <OrbBg />
      <Nav variant="landing" />

      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <Badge color="blue" dot>Now in early access</Badge>
        </div>
        <h1 className={styles.h1}>
          Your Telegram group<br />
          <span className={styles.gradient}>finally remembers</span>
        </h1>
        <p className={styles.sub}>
          Slediq gives your group chat a long-term memory. Ask anything —
          decisions, discussions, facts — across months of history.
        </p>
        <div className={styles.cta}>
          <Button size="lg" onClick={() => navigate('/register')}>Start for free</Button>
          <Button size="lg" variant="ghost">See how it works ↓</Button>
        </div>

        <div className={styles.window}>
          <div className={styles.winBar}>
            <span className={styles.dr} />
            <span className={styles.dy} />
            <span className={styles.dg} />
            <span className={styles.winTitle}>💬 Dev Team · 4 members</span>
          </div>
          <div className={styles.chatBody}>
            <ChatMsg side="left"  avatar="A" text="what was the decision we made about auth last month?" />
            <ChatMsg side="left"  avatar="M" text="no idea, too many messages to scroll through" />
            <ChatMsg side="left"  avatar="A" text={<><span className={styles.mention}>@slediq</span> what did we decide about the auth approach?</>} />
            <ChatMsg side="right" avatar="🤖" bot text="On Nov 14th you decided to go with JWT + refresh tokens stored in httpOnly cookies. The main reason was to avoid XSS risks. Alex suggested adding a Redis-based token blacklist for logout." />
          </div>
        </div>
      </section>

      <section className={styles.features}>
        {features.map(f => (
          <div key={f.title} className={styles.feat}>
            <div className={styles.featIcon}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className={styles.footer}>
        © 2025 Slediq · Made with ☕ ·{' '}
        <a href="#" style={{ color: 'var(--dim)' }}>Privacy</a>
      </footer>
    </div>
  );
};

const ChatMsg: React.FC<{
  side: 'left' | 'right';
  avatar: string;
  text: React.ReactNode;
  bot?: boolean;
}> = ({ side, avatar, text, bot }) => (
  <div className={[styles.msg, side === 'right' ? styles.msgRight : ''].join(' ')}>
    <div className={[styles.av, bot ? styles.avBot : ''].join(' ')}>{avatar}</div>
    <div className={[styles.bub, bot ? styles.bubBot : styles.bubUser].join(' ')}>{text}</div>
  </div>
);
