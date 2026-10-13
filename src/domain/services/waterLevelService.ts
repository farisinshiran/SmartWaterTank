/**
 * Water Level Domain Service
 * Clean Architecture: Domain Layer - Business Logic
 * 
 * Contains all water level calculation logic independent of data sources
 */

import {
  WaterLevel,
  WaterLevelInfo,
  WATER_LEVEL_COLORS,
  WATER_LEVEL_LABELS,
} from '../models';

/**
 * Calculate water level based on sensor readings
 */
export function calculateWaterLevel(
  sensor50Percent: boolean,
  sensor90Percent: boolean
): WaterLevel {
  if (!sensor50Percent && !sensor90Percent) {
    return 'EMPTY';
  }
  if (sensor50Percent && !sensor90Percent) {
    return 'MEDIUM';
  }
  if (sensor50Percent && sensor90Percent) {
    return 'FULL';
  }
  return 'LOW';
}

/**
 * Get water level percentage (0-100)
 */
export function getWaterLevelPercentage(
  sensor50Percent: boolean,
  sensor90Percent: boolean
): number {
  if (!sensor50Percent && !sensor90Percent) {
    return 0;
  }
  if (sensor50Percent && !sensor90Percent) {
    return 65;
  }
  if (sensor50Percent && sensor90Percent) {
    return 90;
  }
  return 15;
}

/**
 * Get full water level information
 */
export function getWaterLevelInfo(
  sensor50Percent: boolean,
  sensor90Percent: boolean
): WaterLevelInfo {
  const level = calculateWaterLevel(sensor50Percent, sensor90Percent);
  return {
    level,
    percentage: getWaterLevelPercentage(sensor50Percent, sensor90Percent),
    color: WATER_LEVEL_COLORS[level],
    label: WATER_LEVEL_LABELS[level],
  };
}

/**
 * Check if current state represents critical overflow condition
 */
export function isCriticalOverflow(
  sensor50Percent: boolean,
  sensor90Percent: boolean,
  pumpStatusRead: 'ON' | 'OFF'
): boolean {
  return sensor90Percent && pumpStatusRead === 'ON';
}

/**
 * Get advice based on water level
 */
export function getWaterLevelAdvice(
  level: WaterLevel,
  pumpStatus: 'ON' | 'OFF'
): string {
  switch (level) {
    case 'EMPTY':
      return 'Tank hampir kosong. Pastikan pompa air aktif untuk mengisi ulang.';
    case 'LOW':
      return 'Level air rendah. Pompa akan segera aktif untuk mengisi tank.';
    case 'MEDIUM':
      return 'Level air sedang. Kondisi normal untuk operasi.';
    case 'HIGH':
      return 'Level air tinggi. Pantau pompa untuk mencegah overflow.';
    case 'FULL':
      if (pumpStatus === 'ON') {
        return '⚠️ KRITIS: Tank penuh dan pompa masih aktif! Matikan pompa segera.';
      }
      return 'Tank penuh. Pompa dalam kondisi standby/normal.';
    default:
      return 'Status tidak diketahui.';
  }
}

/**
 * Get progress bar color based on percentage
 */
export function getProgressBarColor(percentage: number): string {
  if (percentage <= 20) return '#FFA726'; // Orange - low
  if (percentage <= 50) return '#66BB6A'; // Green - medium
  if (percentage <= 80) return '#4FC3F7'; // Blue - high
  return '#C62828'; // Red - critical
}
