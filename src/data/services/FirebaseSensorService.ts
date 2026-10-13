/**
 * Firebase Sensor Service
 * Clean Architecture: Data Layer - Service
 * 
 * Handles raw Firebase operations for sensor data.
 * This service is stateless and only performs Firebase CRUD operations.
 */

import { ref, onValue, set, update, off, DataSnapshot } from 'firebase/database';
import { database } from '../../config/firebase';
import { SensorData } from '../../domain/models';

/**
 * Get Firebase reference for sensor data
 */
const getSensorRef = (tankId: string) => ref(database, `tanks/${tankId}/sensor`);

/**
 * Get Firebase reference for pump control
 */
const getPumpRef = (tankId: string) => ref(database, `tanks/${tankId}/pump`);

/**
 * Subscribe to sensor data changes
 * @returns Unsubscribe function
 */
export function subscribeToSensorData(
  tankId: string,
  callback: (sensorData: SensorData) => void
): () => void {
  const sensorRef = getSensorRef(tankId);
  
  const handler = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    callback({
      sensor50Percent: data?.sensor50Percent ?? false,
      sensor90Percent: data?.sensor90Percent ?? false,
      pumpStatusRead: data?.pumpStatusRead ?? 'OFF',
      lastUpdate: data?.lastUpdate ?? 0,
    });
  };
  
  onValue(sensorRef, handler);
  
  return () => off(sensorRef, 'value', handler);
}

/**
 * Write sensor data to Firebase
 */
export function writeSensorData(tankId: string, data: SensorData): Promise<void> {
  return set(getSensorRef(tankId), {
    sensor50Percent: data.sensor50Percent,
    sensor90Percent: data.sensor90Percent,
    pumpStatusRead: data.pumpStatusRead,
    lastUpdate: data.lastUpdate ?? Date.now(),
  });
}

/**
 * Update sensor data (partial update)
 */
export function updateSensorData(tankId: string, data: Partial<SensorData>): Promise<void> {
  return update(getSensorRef(tankId), {
    ...data,
    lastUpdate: Date.now(),
  });
}

/**
 * Control pump state
 */
export function setPumpState(tankId: string, pumpStatus: 'ON' | 'OFF'): Promise<void> {
  return set(getPumpRef(tankId), {
    status: pumpStatus,
    lastToggle: Date.now(),
  });
}

/**
 * Get pump control reference for subscribing
 */
const getPumpControlRef = (tankId: string) => ref(database, `tanks/${tankId}/pump/control`);

/**
 * Subscribe to pump control commands
 * @returns Unsubscribe function
 */
export function subscribeToPumpControl(
  tankId: string,
  callback: (command: 'ON' | 'OFF' | null) => void
): () => void {
  const controlRef = getPumpControlRef(tankId);
  
  const handler = (snapshot: DataSnapshot) => {
    callback(snapshot.val());
  };
  
  onValue(controlRef, handler);
  
  return () => off(controlRef, 'value', handler);
}
