"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useRef } from "react";
import styles from "./tabs.module.css";

type TabItem = {
  id: string;
  label: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  /** 選択中タブの id（制御コンポーネント） */
  value: string;
  onChange: (id: string) => void;
  /** tablist の aria-label */
  label?: string;
};

export function Tabs({ items, value, onChange, label }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  function focusTab(index: number) {
    const tabs = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;

    if (event.key === "ArrowRight") {
      next = (index + 1) % items.length;
    } else if (event.key === "ArrowLeft") {
      next = (index - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = items.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    onChange(items[next].id);
    focusTab(next);
  }

  return (
    <div ref={listRef} className={styles.tabs} role="tablist" aria-label={label}>
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={selected ? `${styles.tab} ${styles.active}` : styles.tab}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
