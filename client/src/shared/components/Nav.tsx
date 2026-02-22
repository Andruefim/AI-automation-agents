import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './UI';
import { useAuth } from '../context/useAuth';
import styles from './Nav.module.css';

interface NavProps {
  variant?: 'landing' | 'dashboard';
}

export const Nav: React.FC<NavProps> = ({ variant = 'landing' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  if (variant === 'dashboard') {
    const links = [
      { label: 'Groups', path: '/dashboard' },
      { label: 'Digests', path: '/dashboard/digests' },
      { label: 'Settings', path: '/dashboard/settings' },
    ];
    return (
      <nav className={styles.nav}>
        <div className={styles.dashLeft}>
          <div className={styles.logo} onClick={() => navigate('/dashboard')}>
            Sled<em>iq</em>
          </div>
          <div className={styles.links}>
            {links.map(l => (
              <span
                key={l.path}
                className={[styles.link, location.pathname === l.path ? styles.active : ''].join(' ')}
                onClick={() => navigate(l.path)}
              >
                {l.label}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.userChip}>
          <div className={styles.userAv}>{user?.email?.[0]?.toUpperCase() ?? '?'}</div>
          <span>{user?.email ?? 'User'}</span>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Logout
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.logo} onClick={() => navigate('/')}>
        Sled<em>iq</em>
      </div>
      <div className={styles.navRight}>
        <Button variant="ghost" onClick={() => navigate('/login')}>Sign in</Button>
        <Button variant="primary" onClick={() => navigate('/register')}>Get started free</Button>
      </div>
    </nav>
  );
};
