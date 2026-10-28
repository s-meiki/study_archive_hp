"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createDefaultProgressState, createProgressStore, type ProgressStore } from "./progress-store";
import { Button } from "../ui/button";
import styles from "./progress-context.module.css";
import type { ProgressState } from "./types";

const SERVER_SNAPSHOT: ProgressState = createDefaultProgressState();

function getServerSnapshot(): ProgressState {
  return SERVER_SNAPSHOT;
}

type ProgressContextValue = {
  state: ProgressState;
  hydrated: boolean;
  update: (mutator: (current: ProgressState) => ProgressState) => void;
  store: ProgressStore;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => createProgressStore(), []);
  const state = useSyncExternalStore(store.subscribe, store.get, getServerSnapshot);
  const saveError = useSyncExternalStore(store.subscribe, store.getError, () => null);
  const [hydrated, setHydrated] = useState(false);

  // Server render and first client render both use the default snapshot (getServerSnapshot).
  // The lazy localStorage read in get() does not notify, so it cannot trigger a
  // post-hydration re-render on its own. hydrate() loads localStorage and notifies once,
  // surfacing persisted progress right after mount without any hydration mismatch.
  useEffect(() => {
    store.hydrate();
    setHydrated(true);
  }, [store]);

  const value = useMemo<ProgressContextValue>(
    () => ({ state, hydrated, update: store.update.bind(store), store }),
    [state, hydrated, store]
  );

  return <ProgressContext.Provider value={value}>
    {saveError ? <aside role="alert" className={styles.warning}>
      <p>{saveError}</p>
      <Button type="button" variant="secondary" size="sm" onClick={() => {
        const url = URL.createObjectURL(new Blob([store.exportJson()], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "study-progress-unsaved.json";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}>現在の進捗をダウンロード</Button>
      <p>ダウンロード後、ページを再読み込みして保存環境を確認してください。</p>
    </aside> : null}
    {children}
  </ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (value === null) {
    throw new Error("useProgress は ProgressProvider の内側でのみ利用できます。");
  }
  return value;
}
