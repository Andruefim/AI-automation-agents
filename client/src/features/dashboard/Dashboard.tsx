import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../../shared/components/Nav';
import { Button, Card, Badge, OrbBg } from '../../shared/components/UI';
import styles from './Dashboard.module.css';

const GROUPS = [
  { id: '1', emoji: '💻', name: 'Dev Team',      bot: '@devteam_slediq_bot',    msgs: '14.2k', members: 8,  queries: 341 },
  { id: '2', emoji: '📈', name: 'Investors Hub', bot: '@invest_slediq_bot',     msgs: '8.7k',  members: 24, queries: 129 },
  { id: '3', emoji: '🏠', name: 'Family',        bot: '@family_slediq_bot',     msgs: '2.1k',  members: 5,  queries: 21  },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <OrbBg />
      <Nav variant="dashboard" />
      <div className={styles.body}>
        <div className={styles.header}>
          <div>
            <h2>Your Groups</h2>
            <p>3 groups connected · 2 active digests</p>
          </div>
          <Button onClick={() => navigate('/dashboard/connect')}>+ Connect group</Button>
        </div>

        <div className={styles.grid}>
          {GROUPS.map(g => (
            <GroupCard key={g.id} group={g} onClick={() => navigate(`/dashboard/groups/${g.id}`)} />
          ))}
          <div className={styles.addCard} onClick={() => navigate('/dashboard/connect')}>
            <span className={styles.plus}>+</span>
            <span>Connect new group</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Group card ─────────────────────────────────────────────────
const GroupCard: React.FC<{ group: typeof GROUPS[0]; onClick: () => void }> = ({ group, onClick }) => (
  <Card className={styles.gc} onClick={onClick}>
    <div className={styles.gcTop}>
      <div className={styles.gcIcon}>{group.emoji}</div>
      <div>
        <div className={styles.gcName}>{group.name}</div>
        <div className={styles.gcBot}>{group.bot}</div>
      </div>
    </div>
    <div className={styles.gcStats}>
      <Stat val={group.msgs}           label="Messages" />
      <Stat val={group.members}        label="Members" />
      <Stat val={group.queries}        label="Queries" />
    </div>
    <div className={styles.gcFoot}>
      <Badge color="green" dot>Active</Badge>
      <Button variant="secondary" size="sm" onClick={e => { e.stopPropagation(); }}>Manage</Button>
    </div>
  </Card>
);

const Stat: React.FC<{ val: string | number; label: string }> = ({ val, label }) => (
  <div className={styles.stat}>
    <div className={styles.sv}>{val}</div>
    <div className={styles.sl}>{label}</div>
  </div>
);
