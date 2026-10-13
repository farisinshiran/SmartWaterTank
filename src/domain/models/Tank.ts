/**
 * Tank Domain Model
 * Represents tank information
 */

export interface TankInfo {
  tankId: string;
  location: string;
  createdAt: number;
  lastSeen: number;
}
