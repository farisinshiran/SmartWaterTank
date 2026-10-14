/**
 * Water Level Domain Model
 * Represents the water level state of the tank
 */

export type WaterLevel = 'EMPTY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL';

export interface WaterLevelInfo {
  level: WaterLevel;
  percentage: number;
  color: string;
  label: string;
}

export const WATER_LEVEL_COLORS: Record<WaterLevel, string> = {
  EMPTY: '#E0E0E0',
  LOW: '#FFA726',
  MEDIUM: '#66BB6A',
  HIGH: '#4FC3F7',
  FULL: '#1565C0',
};

export const WATER_LEVEL_LABELS: Record<WaterLevel, string> = {
  EMPTY: 'KOSONG',
  LOW: 'RENDAH',
  MEDIUM: 'SEDANG',
  HIGH: 'TINGGI',
  FULL: 'PENUH',
};
