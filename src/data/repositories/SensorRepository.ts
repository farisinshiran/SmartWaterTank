/**
 * Sensor Repository
 * Clean Architecture: Data Layer - Repository
 *
 * Repository acts as the single source of truth for sensor data.
 * Uses Firestore real-time listeners for ESP32 sensor data.
 *
 * Data flow:
 *   ESP32 → Firestore (telemetry_logs collection)
 *         → FirebaseFirestoreService (subscribeToLogs)
 *         → SensorRepository (map DTO → Domain Model)
 *         → useTankMonitor hook → Dashboard Screen
 */

import { SensorData, SensorState } from '../../domain/models';
import type { SensorDataDto } from '../dtos';
import { subscribeToLogs } from '../services/FirebaseFirestoreService';
import type { FirestoreLogDTO, SubscribeToLogs } from '../services/firestoreTypes';
import {
  mapSensorDtoToWaterLevel,
  mapSensorDtoToPercentage,
} from '../mappers/waterLevelMapper';
import { FIRESTORE_CONFIG } from '../services/firestoreTypes';

/**
 * UI State for sensor data
 */
export interface SensorUiState {
  sensorData: SensorData;
  waterLevelLabel: ReturnType<typeof mapSensorDtoToWaterLevel>;
  waterLevelPercentage: number;
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
}

/**
 * Sensor Repository interface
 */
export interface ISensorRepository {
  subscribe(callback: (state: SensorUiState) => void): () => void;
}

/**
 * Default tank ID — matches ESP32 configuration
 */
const DEFAULT_TANK_ID = FIRESTORE_CONFIG.defaultTankId;

/**
 * Create Sensor Repository instance
 * Reads the latest document from Firestore telemetry_logs in real-time.
 */
export function createSensorRepository(
  tankId: string = DEFAULT_TANK_ID,
  subscribe: SubscribeToLogs = subscribeToLogs,
): ISensorRepository {
  return {
    /**
     * Subscribe to sensor data changes via Firestore real-time listener.
     * Returns unsubscribe function.
     */
    subscribe(callback: (state: SensorUiState) => void): () => void {
      return subscribe(
        tankId,
        1,
        (logs: FirestoreLogDTO[]) => {
          const latest = logs[0];
          const dto: SensorDataDto | null = latest
            ? {
                sensor20Percent: latest.sensor20Percent,
                legacySensor50Percent: latest.legacySensor50Percent,
                sensor90Percent: latest.sensor90Percent,
                pumpStatusRead: latest.pumpStatusRead,
              }
            : null;
          const safeDto: SensorDataDto = dto ?? {
            sensor20Percent: false,
            sensor90Percent: false,
            pumpStatusRead: 'OFF',
          };
          const state: SensorUiState = {
            sensorData: {
              sensor20Percent: safeDto.sensor20Percent ?? false,
              legacySensor50Percent: safeDto.legacySensor50Percent,
              sensor90Percent: safeDto.sensor90Percent ?? false,
              pumpStatusRead: safeDto.pumpStatusRead ?? 'OFF',
            },
            waterLevelLabel: mapSensorDtoToWaterLevel(safeDto),
            waterLevelPercentage: mapSensorDtoToPercentage(safeDto),
            isConnected: true,
            lastUpdate: latest?.createdAt ?? null,
            error: null,
          };
          callback(state);
        },
        (error: Error) => callback({
          sensorData: {
            sensor20Percent: false,
            sensor90Percent: false,
            pumpStatusRead: 'OFF',
          },
          waterLevelLabel: 'LOW',
          waterLevelPercentage: 10,
          isConnected: false,
          lastUpdate: null,
          error: `Gagal memuat data sensor dari Firestore: ${error.message}`,
        }),
      );
    },
  };
}

/**
 * Get current sensor state as sensor reading
 */
export function getSensorState(uiState: SensorUiState): SensorState {
  return {
    sensor90Percent: uiState.sensorData.sensor90Percent,
    sensor20Percent: uiState.sensorData.sensor20Percent,
    pumpStatusRead: uiState.sensorData.pumpStatusRead,
  };
}

/**
 * Check if critical overflow condition
 */
export function isCriticalOverflow(uiState: SensorUiState): boolean {
  return (
    uiState.sensorData.sensor90Percent &&
    uiState.sensorData.pumpStatusRead === 'ON'
  );
}
