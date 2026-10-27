/**
 * useTankMonitor ViewModel
 * Clean Architecture: UI Layer - ViewModel
 * 
 * Manages tank monitoring state and transforms data for UI consumption.
 * Uses Repository layer for data access and Domain Services for business logic.
 *
 * NOTE: This app is READ-ONLY — data is controlled by ESP32 hardware.
 * We only read from Firestore; no write operations.
 */

import { useState, useEffect, useMemo } from 'react';
import { SensorData, WaterLevel } from '../../types';
import {
  createSensorRepository,
  SensorUiState,
} from '../../data/repositories/SensorRepository';
import { isCriticalOverflow as checkCriticalOverflow } from '../../domain/services';

/**
 * UI State for Tank Monitor screen
 */
export interface UseTankMonitorResult {
  sensorData: SensorData;
  waterLevel: WaterLevel;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  isCriticalOverflow: boolean;
}

/**
 * Tank Monitor ViewModel Hook
 *
 * Architecture: View → ViewModel → Repository → FirestoreService → Firestore (ESP32 data)
 *
 * @param repoOverride  Optional pre-built repository (used by tests via DI).
 */
export const useTankMonitor = (
  repoOverride?: ReturnType<typeof createSensorRepository>
): UseTankMonitorResult => {
  // UI State
  const [sensorData, setSensorData] = useState<SensorData>({
    sensor20Percent: false,
    sensor90Percent: false,
    pumpStatusRead: 'OFF',
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Create repository instance (memoized)
  const sensorRepository = useMemo(
    () => repoOverride ?? createSensorRepository(),
    [repoOverride]
  );

  // Water level calculation using Domain Service
  const waterLevel = useMemo((): WaterLevel => {
    if (sensorData.sensor90Percent) return 'FULL';
    if (sensorData.sensor20Percent || sensorData.legacySensor50Percent) return 'MEDIUM';
    return 'LOW';
  }, [sensorData.legacySensor50Percent, sensorData.sensor20Percent, sensorData.sensor90Percent]);

  // Critical overflow check using Domain Service
  const isCriticalOverflowResult = useMemo(() => {
    return checkCriticalOverflow(
      sensorData.sensor20Percent,
      sensorData.sensor90Percent,
      sensorData.pumpStatusRead
    );
  }, [sensorData.sensor20Percent, sensorData.sensor90Percent, sensorData.pumpStatusRead]);

  // Subscribe to sensor data via Repository
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = () => {
      try {
        // Subscribe to real-time sensor data from Firestore
        unsubscribe = sensorRepository.subscribe((state: SensorUiState) => {
          setSensorData(state.sensorData);
          setIsConnected(state.isConnected);
          setLastUpdate(state.lastUpdate);
          setIsLoading(false);
          setError(state.error);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal terhubung ke Firestore');
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sensorRepository]);

  return {
    sensorData,
    waterLevel,
    isConnected,
    isLoading,
    error,
    lastUpdate,
    isCriticalOverflow: isCriticalOverflowResult,
  };
};
