/**
 * Telemetry Domain Model
 * Represents telemetry log data from the water tank
 */

export interface TelemetryLog {
  id: string;
  tankId: string;
  sensor20Percent: boolean;
  legacySensor50Percent?: boolean;
  sensor90Percent: boolean;
  pumpStatusRead: 'ON' | 'OFF';
  timestamp: number;
}

export interface TelemetryDisplay {
  id: string;
  tankId: string;
  sensor20Percent: boolean;
  legacySensor50Percent?: boolean;
  sensor90Percent: boolean;
  pumpStatusRead: 'ON' | 'OFF';
  timestamp: Date;
  waterLevelLabel: string;
  waterLevelPercentage: number;
}
