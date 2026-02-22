import React from 'react';
import styles from './UI.module.css';

// ── Button ──────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'ghost' | 'secondary' | 'danger';
type BtnSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  fullWidth?: boolean;
  as?: 'button' | 'a';
  href?: string;
  target?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', fullWidth,
  children, className, as: Tag = 'button', href, target, ...rest
}) => {
  const cls = [
    styles.btn,
    styles[`btn-${variant}`],
    styles[`btn-${size}`],
    fullWidth ? styles['btn-block'] : '',
    className ?? '',
  ].join(' ');

  if (Tag === 'a') {
    return <a href={href} target={target} className={cls}>{children}</a>;
  }
  return <button className={cls} {...rest}>{children}</button>;
};

// ── Card ────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}
export const Card: React.FC<CardProps> = ({ children, className, hover, ...rest }) => (
  <div className={[styles.card, hover ? styles['card-hover'] : '', className ?? ''].join(' ')} {...rest}>
    {children}
  </div>
);

// ── Input ───────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const Input: React.FC<InputProps> = ({ label, error, className, ...rest }) => (
  <div className={styles['input-group']}>
    {label && <label className={styles['input-label']}>{label}</label>}
    <input className={[styles.input, error ? styles['input-error'] : '', className ?? ''].join(' ')} {...rest} />
    {error && <span className={styles['input-err-msg']}>{error}</span>}
  </div>
);

// ── Toggle ──────────────────────────────────────────────────────
interface ToggleProps {
  on: boolean;
  onChange: (val: boolean) => void;
}
export const Toggle: React.FC<ToggleProps> = ({ on, onChange }) => (
  <div
    className={[styles.toggle, on ? styles['toggle-on'] : ''].join(' ')}
    onClick={() => onChange(!on)}
    role="switch"
    aria-checked={on}
  />
);

// ── Badge ───────────────────────────────────────────────────────
type BadgeColor = 'green' | 'blue' | 'dim';
interface BadgeProps {
  color?: BadgeColor;
  dot?: boolean;
  children: React.ReactNode;
}
export const Badge: React.FC<BadgeProps> = ({ color = 'green', dot, children }) => (
  <span className={[styles.badge, styles[`badge-${color}`]].join(' ')}>
    {dot && <span className={styles['badge-dot']} />}
    {children}
  </span>
);

// ── Spinner ─────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <span className={styles.spinner} style={{ width: size, height: size }} />
);

// ── Orb background decoration ───────────────────────────────────
export const OrbBg: React.FC = () => (
  <>
    <div className={styles['orb-1']} />
    <div className={styles['orb-2']} />
  </>
);
