/**
 * Telemetry Repository
 * Clean Architecture: Data Layer - Repository
 *
 * Repository acts as the single source of truth for telemetry data.
 * Reads ESP32 sensor history from Firestore telemetry_logs collection.
 *
 * Data flow:
 *   ESP32 → Firestore (telemetry_logs collection)
 *         → FirebaseFirestoreService (subscribeToLogs)
 *         → TelemetryRepository (map DTO → Domain Model)
 *         → useTelemetry hook → History Screen
 */

import { TelemetryLog, TelemetryDisplay } from '../../domain/models';
import { subscribeToLogs } from '../services/FirebaseFirestoreService';
import type { SubscribeToLogs } from '../services/firestoreTypes';
import {
  mapFirestoreLogsToTelemetryLogs,
  mapTelemetryLogToDisplay,
} from '../mappers/telemetryMapper';
import { FIRESTORE_CONFIG } from '../services/firestoreTypes';

/**
 * UI State for telemetry
 */
export interface TelemetryUiState {
  logs: TelemetryLog[];
  displayLogs: TelemetryDisplay[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Telemetry Repository interface
 */
export interface ITelemetryRepository {
  subscribe(callback: (state: TelemetryUiState) => void): () => void;
}

/**
 * Default tank ID — matches ESP32 configuration
 */
const DEFAULT_TANK_ID = FIRESTORE_CONFIG.defaultTankId;

/**
 * Create Telemetry Repository instance
 * Reads telemetry history from Firestore telemetry_logs collection in real-time.
 */
export function createTelemetryRepository(
  tankId: string = DEFAULT_TANK_ID,
  maxLogs: number = FIRESTORE_CONFIG.maxHistoryEntries,
  subscribe: SubscribeToLogs = subscribeToLogs,
): ITelemetryRepository {
  return {
    /**
     * Subscribe to telemetry history via Firestore real-time listener.
     * Returns unsubscribe function.
     */
    subscribe(callback: (state: TelemetryUiState) => void): () => void {
      return subscribe(
        tankId,
        maxLogs,
        (rows) => {
          const currentLogs = mapFirestoreLogsToTelemetryLogs(rows);
          callback({
            logs: currentLogs,
            displayLogs: currentLogs.map(mapTelemetryLogToDisplay),
            isLoading: false,
            error: null,
          });
        },
        (error) => callback({
          logs: [],
          displayLogs: [],
          isLoading: false,
          error: error.message,
        }),
      );
    },
  };
}

/**
 * Transform logs to display format with water level info
 */
export function transformLogsToDisplay(logs: TelemetryLog[]): TelemetryDisplay[] {
  return logs.map(mapTelemetryLogToDisplay);
}

/**
 * Filter logs by time range
 */
export function filterLogsByTimeRange(
  logs: TelemetryLog[],
  startTime: number,
  endTime: number
): TelemetryLog[] {
  return logs.filter((log) => log.timestamp >= startTime && log.timestamp <= endTime);
}

/**
 * Get latest log
 */
export function getLatestLog(logs: TelemetryLog[]): TelemetryLog | null {
  return logs.length > 0 ? logs[0] : null;
}
