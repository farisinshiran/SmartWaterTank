/**
 * Fake TankService
 */

import type { ITankService } from '../../data/services/ITankService';
import type { TankDto } from '../../data/dtos';

export interface FakeTankServiceState {
  tanks: Record<string, TankDto> | null;
  oneSubs: Map<string, Array<(data: TankDto | null) => void>>;
  allSubs: Array<(data: Record<string, TankDto> | null) => void>;
}

export function createFakeTankService(): ITankService & {
  state: FakeTankServiceState;
  reset(): void;
} {
  const state: FakeTankServiceState = {
    tanks: null,
    oneSubs: new Map(),
    allSubs: [],
  };

  return {
    state,

    subscribeToOne(tankId, callback) {
      const list = state.oneSubs.get(tankId) ?? [];
      list.push(callback);
      state.oneSubs.set(tankId, list);
      const value = state.tanks?.[tankId] ?? null;
      Promise.resolve().then(() => callback(value));
      return () => {
        const filtered = (state.oneSubs.get(tankId) ?? []).filter((cb) => cb !== callback);
        state.oneSubs.set(tankId, filtered);
      };
    },

    subscribeAll(callback) {
      state.allSubs.push(callback);
      Promise.resolve().then(() => callback(state.tanks));
      return () => {
        state.allSubs = state.allSubs.filter((cb) => cb !== callback);
      };
    },

    reset() {
      state.tanks = null;
      state.oneSubs.clear();
      state.allSubs = [];
    },
  };
}
