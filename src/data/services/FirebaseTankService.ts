/**
 * Firebase Tank Service
 * Clean Architecture: Data Layer - Service
 * 
 * Handles raw Firebase operations for tank data.
 * This service is stateless and only performs Firebase CRUD operations.
 */

import { ref, onValue, set, update, off, DataSnapshot } from 'firebase/database';
import { database } from '../../config/firebase';
import { TankInfo } from '../../domain/models';

/**
 * Get Firebase reference for tank
 */
const getTankRef = (tankId: string) => ref(database, `tanks/${tankId}`);

/**
 * Get Firebase reference for all tanks
 */
const getTanksRef = () => ref(database, 'tanks');

/**
 * Subscribe to tank data changes
 * @returns Unsubscribe function
 */
export function subscribeToTank(
  tankId: string,
  callback: (tank: TankInfo | null) => void
): () => void {
  const tankRef = getTankRef(tankId);
  
  const handler = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      callback({
        tankId: snapshot.key || tankId,
        location: data.location || '',
        createdAt: data.createdAt || 0,
        lastSeen: data.lastSeen || 0,
      });
    } else {
      callback(null);
    }
  };
  
  onValue(tankRef, handler);
  
  return () => off(tankRef, 'value', handler);
}

/**
 * Subscribe to all tanks
 * @returns Unsubscribe function
 */
export function subscribeToAllTanks(
  callback: (tanks: TankInfo[]) => void
): () => void {
  const tanksRef = getTanksRef();
  
  const handler = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      const tanks: TankInfo[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        tankId: key,
        location: value.location || '',
        createdAt: value.createdAt || 0,
        lastSeen: value.lastSeen || 0,
      }));
      callback(tanks);
    } else {
      callback([]);
    }
  };
  
  onValue(tanksRef, handler);
  
  return () => off(tanksRef, 'value', handler);
}

/**
 * Create or update tank data
 */
export function updateTankData(tankId: string, data: Partial<TankInfo>): Promise<void> {
  return update(getTankRef(tankId), {
    ...data,
    lastSeen: Date.now(),
  });
}

/**
 * Set tank data (overwrite)
 */
export function setTankData(tankId: string, data: TankInfo): Promise<void> {
  return set(getTankRef(tankId), {
    location: data.location,
    createdAt: data.createdAt,
    lastSeen: data.lastSeen,
  });
}
