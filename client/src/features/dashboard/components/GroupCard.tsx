import React from 'react';
import { Button, Card, Badge } from '../../../shared/components/UI';
import type { ChatGroup } from '../../../shared/api/groups';
import styles from '../Dashboard.module.css';

interface GroupCardProps {
  group: ChatGroup;
  onClick: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onClick }) => {
  const botHandle = group.bot?.botUsername ? `@${group.bot.botUsername}` : '—';
  const title = group.title || 'Unnamed group';

  return (
    <Card className={styles.gc} onClick={onClick}>
      <div className={styles.gcTop}>
        <div className={styles.gcIcon}>💬</div>
        <div>
          <div className={styles.gcName}>{title}</div>
          <div className={styles.gcBot}>{botHandle}</div>
        </div>
      </div>
      <div className={styles.gcStats}>
        <Stat val="—" label="Messages" />
        <Stat val="—" label="Members" />
        <Stat val="—" label="Queries" />
      </div>
      <div className={styles.gcFoot}>
        <Badge color="green" dot>
          Active
        </Badge>
        <Button variant="secondary" size="sm" onClick={e => e.stopPropagation()}>
          Manage
        </Button>
      </div>
    </Card>
  );
};

const Stat: React.FC<{ val: string | number; label: string }> = ({ val, label }) => (
  <div className={styles.stat}>
    <div className={styles.sv}>{val}</div>
    <div className={styles.sl}>{label}</div>
  </div>
);
