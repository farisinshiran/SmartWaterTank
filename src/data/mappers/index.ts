/**
 * Data Mappers - Barrel Export
 * Clean Architecture: Data Layer - Mappers
 *
 * Maps between DTOs (Firebase/raw data) and Domain models
 */

// Re-export DTO types from the shared location
export type { SensorDataDto, TelemetryLogDto, IncidentDto, TankDto } from '../dtos';
export type { FirestoreLogDTO } from '../services/firestoreTypes';

// Water Level Mappers
export {
  mapSensorDtoToWaterLevel,
  mapSensorDtoToPercentage,
  mapSensorDtoToWaterLevelInfo,
} from './waterLevelMapper';

// Telemetry Mappers
export {
  mapFirestoreLogToTelemetryLog,
  mapFirestoreLogsToTelemetryLogs,
  mapTelemetryDtoToLog,
  mapTelemetryLogToDisplay,
  mapTelemetryDtoArrayToLogs,
} from './telemetryMapper';

// Incident Mappers
export {
  mapIncidentDtoToIncident,
  mapIncidentToDisplay,
  mapIncidentDtoArrayToIncidents,
  mapIncidentArrayToDisplay,
} from './incidentMapper';

// Tank Mappers
export {
  mapTankDtoToTank,
  mapTankDtoArrayToTanks,
} from './tankMapper';
