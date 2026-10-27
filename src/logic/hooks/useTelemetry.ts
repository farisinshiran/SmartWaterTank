/**
 * useTelemetry ViewModel
 * Clean Architecture: UI Layer - ViewModel
 * 
 * Manages telemetry history state and transforms data for UI consumption.
 * Uses Repository layer for data access from Firestore.
 */

import { useState, useEffect, useMemo } from 'react';
import { TelemetryLog } from '../../types';
import {
  createTelemetryRepository,
  TelemetryUiState,
} from '../../data/repositories/TelemetryRepository';
import { FIRESTORE_CONFIG } from '../../data/services/firestoreTypes';

/**
 * UI State for Telemetry screen
 */
export interface UseTelemetryResult {
  logs: TelemetryLog[];
  isLoading: boolean;
  error: string | null;
}

const MAX_HISTORY = FIRESTORE_CONFIG.maxHistoryEntries;

/**
 * Telemetry ViewModel Hook
 * 
 * Architecture: View → ViewModel → Repository → FirestoreService → Firestore (ESP32 history)
 * 
 * @param limit - Maximum number of logs to display
 */
export const useTelemetry = (
  limit: number = MAX_HISTORY
): UseTelemetryResult => {
  // UI State
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create repository instance (memoized)
  const telemetryRepository = useMemo(
    () => createTelemetryRepository(FIRESTORE_CONFIG.defaultTankId, limit),
    [limit]
  );

  // Subscribe to telemetry logs via Repository
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = () => {
      try {
        setIsLoading(true);
        
        unsubscribe = telemetryRepository.subscribe((state: TelemetryUiState) => {
          setLogs(state.logs);
          setIsLoading(state.isLoading);
          setError(state.error);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat riwayat telemetry');
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [telemetryRepository]);

  return {
    logs,
    isLoading,
    error,
  };
};
