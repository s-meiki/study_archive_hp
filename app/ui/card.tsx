import type { ReactNode } from "react";
import styles from "./card.module.css";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return <div className={className ? `${styles.card} ${className}` : styles.card}>{children}</div>;
}

type CardHeaderProps = {
  title: ReactNode;
  action?: ReactNode;
  sub?: ReactNode;
};

export function CardHeader({ title, action, sub }: CardHeaderProps) {
  return (
    <>
      <header className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {action}
      </header>
      {sub ? <p className={styles.sub}>{sub}</p> : null}
    </>
  );
}
