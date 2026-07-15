import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "sm";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  type = "button",
  disabled,
  onClick,
  className
}: ButtonProps) {
  const classes = [styles.button, variantClassName[variant]];

  if (size === "sm") {
    classes.push(styles.sm);
  }

  if (className) {
    classes.push(className);
  }

  const buttonClassName = classes.join(" ");

  if (href) {
    return (
      <Link className={buttonClassName} href={href} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button className={buttonClassName} type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
