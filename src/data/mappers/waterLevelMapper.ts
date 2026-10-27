/**
 * Water Level Mapper
 * Maps between DTO and Domain model for water level
 */

import {
  WaterLevel,
  WaterLevelInfo,
  WATER_LEVEL_COLORS,
  WATER_LEVEL_LABELS,
} from '../../domain/models';
import { SensorDataDto } from '../dtos';

/**
 * Calculate water level from sensor DTO
 */
export function mapSensorDtoToWaterLevel(dto: SensorDataDto): WaterLevel {
  if (dto.sensor90Percent) return 'FULL';
  if (dto.sensor20Percent || dto.legacySensor50Percent) return 'MEDIUM';
  return 'LOW';
}

/**
 * Calculate water level percentage from sensor DTO
 */
export function mapSensorDtoToPercentage(dto: SensorDataDto): number {
  if (dto.sensor90Percent) return 90;
  if (dto.sensor20Percent) return 20;
  if (dto.legacySensor50Percent) return 50;
  return 10;
}

/**
 * Map sensor DTO to full water level info
 */
export function mapSensorDtoToWaterLevelInfo(dto: SensorDataDto): WaterLevelInfo {
  const level = mapSensorDtoToWaterLevel(dto);
  return {
    level,
    percentage: mapSensorDtoToPercentage(dto),
    color: WATER_LEVEL_COLORS[level],
    label: WATER_LEVEL_LABELS[level],
  };
}
