"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { createDefaultProgressState, createProgressStore, type ProgressStore } from "./progress-store";
import type { ProgressState } from "./types";

const SERVER_SNAPSHOT: ProgressState = createDefaultProgressState();

function getServerSnapshot(): ProgressState {
  return SERVER_SNAPSHOT;
}

type ProgressContextValue = {
  state: ProgressState;
  update: (mutator: (current: ProgressState) => ProgressState) => void;
  store: ProgressStore;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => createProgressStore(), []);
  const state = useSyncExternalStore(store.subscribe, store.get, getServerSnapshot);

  // Server render and first client render both use the default snapshot (getServerSnapshot).
  // The lazy localStorage read in get() does not notify, so it cannot trigger a
  // post-hydration re-render on its own. hydrate() loads localStorage and notifies once,
  // surfacing persisted progress right after mount without any hydration mismatch.
  useEffect(() => {
    store.hydrate();
  }, [store]);

  const value = useMemo<ProgressContextValue>(
    () => ({ state, update: store.update.bind(store), store }),
    [state, store]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (value === null) {
    throw new Error("useProgress は ProgressProvider の内側でのみ利用できます。");
  }
  return value;
}
