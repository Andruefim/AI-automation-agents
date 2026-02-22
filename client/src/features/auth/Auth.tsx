import React from 'react';
import { Nav } from '../../shared/components/Nav';
import { OrbBg } from '../../shared/components/UI';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import styles from './Auth.module.css';

export const Login: React.FC = () => (
  <div className={styles.page}>
    <OrbBg />
    <Nav variant="landing" />
    <div className={styles.wrap}>
      <LoginForm />
    </div>
  </div>
);

export const Register: React.FC = () => (
  <div className={styles.page}>
    <OrbBg />
    <Nav variant="landing" />
    <div className={styles.wrap}>
      <RegisterForm />
    </div>
  </div>
);
