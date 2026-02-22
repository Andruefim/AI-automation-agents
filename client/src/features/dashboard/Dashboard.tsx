import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../../shared/components/Nav';
import { Button, OrbBg, Spinner } from '../../shared/components/UI';
import { useGroupsList } from './hooks/useGroupsList';
import { GroupCard } from './components/GroupCard';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { groups, loading, error, refetch } = useGroupsList();

  return (
    <div className={styles.page}>
      <OrbBg />
      <Nav variant="dashboard" />
      <div className={styles.body}>
        <div className={styles.header}>
          <div>
            <h2>Your Groups</h2>
            <p>
              {groups.length} group{groups.length !== 1 ? 's' : ''} connected
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard/connect')}>+ Connect group</Button>
        </div>

        {error && (
          <p className={styles.error}>
            {error}{' '}
            <button type="button" className={styles.retry} onClick={() => refetch()}>
              Retry
            </button>
          </p>
        )}

        {loading ? (
          <div className={styles.loading}>
            <Spinner size={24} />
            <span>Loading groups…</span>
          </div>
        ) : (
          <div className={styles.grid}>
            {groups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                onClick={() => navigate(`/dashboard/groups/${g.id}`)}
              />
            ))}
            <div className={styles.addCard} onClick={() => navigate('/dashboard/connect')}>
              <span className={styles.plus}>+</span>
              <span>Connect new group</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
