/**
 * Fake TelemetryService
 */

import type { ITelemetryService } from '../../data/services/ITelemetryService';
import type { TelemetryLogDto } from '../../data/dtos';

export interface FakeTelemetryServiceState {
  current: Record<string, TelemetryLogDto> | null;
  logs: { tankId: string; sensor20Percent: boolean; sensor90Percent: boolean; pumpStatusRead: 'ON' | 'OFF' }[];
  subscribers: Array<(data: Record<string, TelemetryLogDto> | null) => void>;
}

export function createFakeTelemetryService(): ITelemetryService & {
  state: FakeTelemetryServiceState;
  set(data: Record<string, TelemetryLogDto> | null): void;
  reset(): void;
} {
  const state: FakeTelemetryServiceState = {
    current: null,
    logs: [],
    subscribers: [],
  };

  return {
    state,

    subscribe(_tankId, callback) {
      state.subscribers.push(callback);
      Promise.resolve().then(() => callback(state.current));
      return () => {
        state.subscribers = state.subscribers.filter((cb) => cb !== callback);
      };
    },

    async log(tankId, sensor20Percent, sensor90Percent, pumpStatusRead) {
      state.logs.push({ tankId, sensor20Percent, sensor90Percent, pumpStatusRead });
      const id = `log-${state.logs.length}`;
      const next = {
        ...(state.current ?? {}),
        [id]: { sensor20Percent, sensor90Percent, pumpStatusRead, timestamp: Date.now() },
      };
      state.current = next;
      state.subscribers.forEach((cb) => cb(next));
      return id;
    },

    set(data) {
      state.current = data;
      state.subscribers.forEach((cb) => cb(data));
    },

    reset() {
      state.current = null;
      state.logs = [];
      state.subscribers = [];
    },
  };
}
