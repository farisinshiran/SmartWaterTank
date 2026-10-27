/**
 * Tank Repository
 * Clean Architecture: Data Layer - Repository
 *
 * Repository acts as the single source of truth for tank data.
 * It uses Data Services (Firebase SDK) and returns Domain Models.
 */

import { TankInfo } from '../../domain/models';
import {
  subscribeToTank,
  subscribeToAllTanks,
  updateTankData,
} from '../services/FirebaseTankService';
import type { ITankService } from '../services/ITankService';
import { TankDto } from '../dtos';
import { mapTankDtoToTank, mapTankDtoArrayToTanks } from '../mappers/tankMapper';
import { FIRESTORE_CONFIG } from '../services/firestoreTypes';

/**
 * UI State for tank
 */
export interface TankUiState {
  tank: TankInfo | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * All Tanks UI State
 */
export interface AllTanksUiState {
  tanks: TankInfo[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Tank Repository interface
 */
export interface ITankRepository {
  subscribe(callback: (state: TankUiState) => void): () => void;
  subscribeToAll(callback: (state: AllTanksUiState) => void): () => void;
  updateLastSeen(): Promise<void>;
}

/**
 * Default tank ID
 */
const DEFAULT_TANK_ID = FIRESTORE_CONFIG.defaultTankId;

/**
 * Create Tank Repository instance
 *
 * @param tankId   The tank to scope reads/writes to
 * @param service  Optional service override (used by tests via DI container)
 */
export function createTankRepository(
  tankId: string = DEFAULT_TANK_ID,
  service: ITankService = {
    subscribeToOne: subscribeToTank,
    subscribeAll: subscribeToAllTanks,
  }
): ITankRepository {
  return {
    /**
     * Subscribe to single tank
     */
    subscribe(callback: (state: TankUiState) => void): () => void {
      return service.subscribeToOne(tankId, (dto: TankDto | null) => {
        if (dto) {
          callback({
            tank: mapTankDtoToTank(dto, tankId),
            isLoading: false,
            error: null,
          });
        } else {
          callback({
            tank: null,
            isLoading: false,
            error: 'Tank not found',
          });
        }
      });
    },

    /**
     * Subscribe to all tanks
     */
    subscribeToAll(callback: (state: AllTanksUiState) => void): () => void {
      return service.subscribeAll((tanks: Record<string, TankDto> | null) => {
        callback({
          tanks: mapTankDtoArrayToTanks(tanks),
          isLoading: false,
          error: null,
        });
      });
    },

    /**
     * Update tank last seen timestamp
     */
    async updateLastSeen(): Promise<void> {
      await updateTankData(tankId, { lastSeen: Date.now() });
    },
  };
}

/**
 * Get tank by ID from list
 */
export function getTankById(tanks: TankInfo[], tankId: string): TankInfo | undefined {
  return tanks.find((t) => t.tankId === tankId);
}

/**
 * Sort tanks by last seen
 */
export function sortTanksByLastSeen(tanks: TankInfo[]): TankInfo[] {
  return [...tanks].sort((a, b) => b.lastSeen - a.lastSeen);
}

/**
 * Filter tanks with recent activity
 */
export function filterRecentTanks(tanks: TankInfo[], maxAgeMs: number = 3600000): TankInfo[] {
  const now = Date.now();
  return tanks.filter((t) => now - t.lastSeen < maxAgeMs);
}
