/**
 * Telemetry Mapper
 * Maps between DTO and Domain model for telemetry
 */

import { TelemetryLog, TelemetryDisplay } from '../../domain/models';
import { TelemetryLogDto } from '../dtos';
import type { FirestoreLogDTO } from '../services/firestoreTypes';
import { mapSensorDtoToPercentage } from './waterLevelMapper';

export function mapFirestoreLogToTelemetryLog(dto: FirestoreLogDTO): TelemetryLog {
  return {
    id: dto.id,
    tankId: dto.tankId,
    sensor20Percent: dto.sensor20Percent,
    legacySensor50Percent: dto.legacySensor50Percent,
    sensor90Percent: dto.sensor90Percent,
    pumpStatusRead: dto.pumpStatusRead,
    timestamp: dto.createdAt.getTime(),
  };
}

export function mapFirestoreLogsToTelemetryLogs(rows: FirestoreLogDTO[]): TelemetryLog[] {
  return rows.map(mapFirestoreLogToTelemetryLog);
}

/**
 * Map telemetry DTO to domain model
 */
export function mapTelemetryDtoToLog(dto: TelemetryLogDto, id: string, tankId: string): TelemetryLog {
  return {
    id,
    tankId,
    sensor20Percent: dto.sensor20Percent ?? false,
    legacySensor50Percent:
      dto.sensor20Percent === undefined && dto.sensor50Percent === true,
    sensor90Percent: dto.sensor90Percent ?? false,
    pumpStatusRead: dto.pumpStatusRead ?? 'OFF',
    timestamp: dto.timestamp || 0,
  };
}

/**
 * Map telemetry log to display model
 */
export function mapTelemetryLogToDisplay(log: TelemetryLog): TelemetryDisplay {
  const percentage = mapSensorDtoToPercentage({
    sensor20Percent: log.sensor20Percent,
    legacySensor50Percent: log.legacySensor50Percent,
    sensor90Percent: log.sensor90Percent,
    pumpStatusRead: log.pumpStatusRead,
  });

  // Determine water level label
  const waterLevelLabel = log.sensor90Percent
    ? 'PENUH'
    : log.sensor20Percent
      ? 'SEDANG'
      : log.legacySensor50Percent
        ? 'SEDANG'
        : 'RENDAH';

  return {
    id: log.id,
    tankId: log.tankId,
    sensor20Percent: log.sensor20Percent,
    legacySensor50Percent: log.legacySensor50Percent,
    sensor90Percent: log.sensor90Percent,
    pumpStatusRead: log.pumpStatusRead,
    timestamp: new Date(log.timestamp),
    waterLevelLabel,
    waterLevelPercentage: percentage,
  };
}

/**
 * Map array of telemetry DTOs to domain logs
 */
export function mapTelemetryDtoArrayToLogs(
  data: Record<string, TelemetryLogDto> | null,
  tankId: string
): TelemetryLog[] {
  if (!data) return [];

  return Object.entries(data)
    .map(([key, value]) => mapTelemetryDtoToLog(value, key, tankId))
    .sort((a, b) => b.timestamp - a.timestamp);
}
