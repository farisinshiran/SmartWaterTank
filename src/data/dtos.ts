/**
 * Data Transfer Objects (DTOs)
 * Clean Architecture: Data Layer
 * 
 * Raw data shapes that come from external sources (Firebase, REST APIs).
 * These are NOT domain models - they are transformed by Repository + Mapper.
 * 
 * Located here so both Services and Mappers can reference the same definitions.
 */

/**
 * Sensor data DTO from Firebase
 */
export type SensorDataDto = {
  sensor20Percent: boolean;
  legacySensor50Percent?: boolean;
  sensor90Percent: boolean;
  pumpStatusRead: 'ON' | 'OFF';
  lastUpdate?: number;
};

/**
 * Telemetry log DTO from Firebase
 */
export type TelemetryLogDto = {
  sensor20Percent: boolean;
  sensor50Percent?: boolean;
  sensor90Percent: boolean;
  pumpStatusRead: 'ON' | 'OFF';
  timestamp?: number;
  tankId?: string;
};

/**
 * Incident DTO from Firebase
 */
export type IncidentDto = {
  tankId?: string;
  type?: string;
  status?: string;
  triggeredAt?: number;
  resolvedAt?: number;
  description?: string;
};

/**
 * Tank DTO from Firebase
 */
export type TankDto = {
  location?: string;
  createdAt?: number;
  lastSeen?: number;
};
