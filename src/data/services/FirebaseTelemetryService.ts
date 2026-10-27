/**
 * Firebase Telemetry Service
 * Clean Architecture: Data Layer - Service
 * 
 * Handles raw Firebase operations for telemetry/log data.
 * This service is stateless and only performs Firebase CRUD operations.
 */

import { ref, push, onValue, off, DataSnapshot, query, orderByKey, limitToLast } from 'firebase/database';
import { database } from '../../config/firebase';
import { TelemetryLog } from '../../domain/models';

/**
 * Get Firebase reference for telemetry logs
 */
const getTelemetryRef = (tankId: string) => ref(database, `tanks/${tankId}/telemetry`);

/**
 * Subscribe to telemetry log changes
 * @returns Unsubscribe function
 */
export function subscribeToTelemetryLogs(
  tankId: string,
  callback: (logs: TelemetryLog[]) => void,
  maxLogs: number = 50
): () => void {
  const telemetryRef = query(getTelemetryRef(tankId), orderByKey(), limitToLast(maxLogs));
  
  const handler = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      const logs: TelemetryLog[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        tankId,
        sensor20Percent: value.sensor20Percent ?? false,
        sensor90Percent: value.sensor90Percent ?? false,
        pumpStatusRead: value.pumpStatusRead ?? 'OFF',
        timestamp: value.timestamp || 0,
      }));
      callback(logs.reverse()); // Newest first
    } else {
      callback([]);
    }
  };
  
  onValue(telemetryRef, handler);
  
  return () => off(telemetryRef, 'value', handler);
}

/**
 * Push a new telemetry log entry
 */
export function pushTelemetryLog(
  tankId: string,
  sensor20Percent: boolean,
  sensor90Percent: boolean,
  pumpStatusRead: 'ON' | 'OFF'
): Promise<string> {
  const telemetryRef = getTelemetryRef(tankId);
  const newLogRef = push(telemetryRef);
  
  return newLogRef.then((ref) => {
    return set(ref, {
      sensor20Percent,
      sensor90Percent,
      pumpStatusRead,
      timestamp: Date.now(),
    }).then(() => ref.key || '');
  });
}

/**
 * Subscribe to latest telemetry log
 * @returns Unsubscribe function
 */
export function subscribeToLatestTelemetryLog(
  tankId: string,
  callback: (log: TelemetryLog | null) => void
): () => void {
  const telemetryRef = query(getTelemetryRef(tankId), orderByKey(), limitToLast(1));
  
  const handler = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      const [key, value] = Object.entries(data)[0] as [string, any];
      callback({
        id: key,
        tankId,
        sensor20Percent: value.sensor20Percent ?? false,
        sensor90Percent: value.sensor90Percent ?? false,
        pumpStatusRead: value.pumpStatusRead ?? 'OFF',
        timestamp: value.timestamp || 0,
      });
    } else {
      callback(null);
    }
  };
  
  onValue(telemetryRef, handler);
  
  return () => off(telemetryRef, 'value', handler);
}
