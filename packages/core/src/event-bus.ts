import type { EngineEvents } from "@achievement-watcher/shared";

export interface EngineEventBus {
  on<K extends keyof EngineEvents>(event: K, listener: (data: EngineEvents[K]) => void): void;
  off<K extends keyof EngineEvents>(event: K, listener: (data: EngineEvents[K]) => void): void;
  emit<K extends keyof EngineEvents>(event: K, data: EngineEvents[K]): void;
}

export function createEventBus(): EngineEventBus {
  // Map from event name to set of listener functions
  const listeners = new Map<string, Set<(data: unknown) => void>>();

  function getListeners(event: string): Set<(data: unknown) => void> {
    let set = listeners.get(event);
    if (!set) {
      set = new Set();
      listeners.set(event, set);
    }
    return set;
  }

  return {
    on<K extends keyof EngineEvents>(event: K, listener: (data: EngineEvents[K]) => void): void {
      getListeners(event as string).add(listener as (data: unknown) => void);
    },

    off<K extends keyof EngineEvents>(event: K, listener: (data: EngineEvents[K]) => void): void {
      getListeners(event as string).delete(listener as (data: unknown) => void);
    },

    emit<K extends keyof EngineEvents>(event: K, data: EngineEvents[K]): void {
      const set = listeners.get(event as string);
      if (!set) return;
      for (const listener of set) {
        listener(data);
      }
    },
  };
}
