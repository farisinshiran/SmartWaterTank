/**
 * Fake IncidentService
 */

import type { IIncidentService } from '../../data/services/IIncidentService';
import type { IncidentDto } from '../../data/dtos';
import type { IncidentType } from '../../domain/models';

export interface FakeIncidentServiceState {
  active: Record<string, IncidentDto> | null;
  all: Record<string, IncidentDto> | null;
  created: { tankId: string; type: IncidentType; description?: string }[];
  resolved: { tankId: string; incidentId: string; resolvedAt: number }[];
  activeSubs: Array<(data: Record<string, IncidentDto> | null) => void>;
  allSubs: Array<(data: Record<string, IncidentDto> | null) => void>;
}

export function createFakeIncidentService(): IIncidentService & {
  state: FakeIncidentServiceState;
  reset(): void;
} {
  const state: FakeIncidentServiceState = {
    active: null,
    all: null,
    created: [],
    resolved: [],
    activeSubs: [],
    allSubs: [],
  };

  return {
    state,

    subscribeActive(_tankId, callback) {
      state.activeSubs.push(callback);
      Promise.resolve().then(() => callback(state.active));
      return () => {
        state.activeSubs = state.activeSubs.filter((cb) => cb !== callback);
      };
    },

    subscribeAll(callback) {
      state.allSubs.push(callback);
      Promise.resolve().then(() => callback(state.all));
      return () => {
        state.allSubs = state.allSubs.filter((cb) => cb !== callback);
      };
    },

    async create(tankId, type, description) {
      state.created.push({ tankId, type, description });
      const id = `inc-${state.created.length}`;
      return id;
    },

    async resolve(tankId, incidentId, resolvedAt) {
      state.resolved.push({ tankId, incidentId, resolvedAt });
    },

    reset() {
      state.active = null;
      state.all = null;
      state.created = [];
      state.resolved = [];
      state.activeSubs = [];
      state.allSubs = [];
    },
  };
}
