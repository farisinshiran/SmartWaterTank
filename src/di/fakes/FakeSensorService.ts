/**
 * Fake SensorService
 * Clean Architecture: Application Layer / Test Doubles
 *
 * In-memory replacement for the real Firebase sensor service. It exposes
 * `set(data)` to feed canned values, an internal call log, and a simple
 * `reset()` helper. Used by createTestContainer().
 */

import type { ISensorService } from '../../data/services/ISensorService';
import type { SensorDataDto } from '../../data/dtos';

export interface FakeSensorServiceState {
  current: SensorDataDto | null;
  writes: { tankId: string; data: SensorDataDto }[];
  updates: { tankId: string; data: Partial<SensorDataDto> }[];
  subscribers: Array<(data: SensorDataDto | null) => void>;
}

export function createFakeSensorService(): ISensorService & {
  state: FakeSensorServiceState;
  set(data: SensorDataDto | null): void;
  reset(): void;
} {
  const state: FakeSensorServiceState = {
    current: null,
    writes: [],
    updates: [],
    subscribers: [],
  };

  return {
    state,

    subscribe(tankId, callback) {
      state.subscribers.push(callback);
      // Push current value asynchronously so it mimics a real Firebase roundtrip
      Promise.resolve().then(() => callback(state.current));
      return () => {
        state.subscribers = state.subscribers.filter((cb) => cb !== callback);
      };
    },

    async write(tankId, data) {
      state.writes.push({ tankId, data });
      state.current = data;
      state.subscribers.forEach((cb) => cb(data));
    },

    async update(tankId, data) {
      state.updates.push({ tankId, data });
      state.current = { ...(state.current ?? {
        sensor20Percent: false,
        sensor90Percent: false,
        pumpStatusRead: 'OFF',
      }), ...data };
      state.subscribers.forEach((cb) => cb(state.current));
    },

    set(data) {
      state.current = data;
      state.subscribers.forEach((cb) => cb(data));
    },

    reset() {
      state.current = null;
      state.writes = [];
      state.updates = [];
      state.subscribers = [];
    },
  };
}
