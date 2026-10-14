/**
 * Tipe data utama untuk Smart Water Tank
 * 
 * DEPRECATED: Gunakan src/domain/models dan src/domain/services sebagai gantinya.
 * File ini dipertahankan untuk backward compatibility.
 */

// ================== RE-EXPORT FROM DOMAIN LAYER ==================
// Domain Models
export {
  SensorData,
  SensorState,
  SensorReading,
  ButtonState,
  WaterLevel,
  WaterLevelInfo,
  WATER_LEVEL_COLORS,
  WATER_LEVEL_LABELS,
  TelemetryLog,
  TelemetryDisplay,
  Incident,
  IncidentDisplay,
  IncidentType,
  IncidentStatus,
  INCIDENT_CONFIG,
  TankInfo,
  RootStackParamList,
  MainTabParamList,
} from '../domain/models';

// Domain Services
export {
  calculateWaterLevel,
  getWaterLevelPercentage,
  getWaterLevelInfo,
  isCriticalOverflow,
  getWaterLevelAdvice,
  getProgressBarColor,
} from '../domain/services';

// ================== LEGACY EXPORTS (for backward compatibility) ==================
// These will be removed in future versions

// Sensor & Tank (legacy - use domain models instead)
export type { SensorData as SensorDataLegacy } from '../domain/models';
export type { TankInfo as TankInfoLegacy } from '../domain/models';

// Telemetry (legacy - use domain models instead)
export type { TelemetryLog as TelemetryLogLegacy } from '../domain/models';

// Incidents (legacy - use domain models instead)
export type { Incident as IncidentLegacy } from '../domain/models';

// Navigation (legacy - use domain models instead)
export type { RootStackParamList as RootStackParamListLegacy } from '../domain/models';
export type { MainTabParamList as MainTabParamListLegacy } from '../domain/models';
