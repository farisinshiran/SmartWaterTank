/**
 * Repositories - Barrel Export
 * Clean Architecture: Data Layer - Repositories
 * 
 * Repository is the single source of truth for data.
 * It uses Data Services and returns Domain Models.
 */

export { createSensorRepository, getSensorState, isCriticalOverflow } from './SensorRepository';
export type { SensorUiState, ISensorRepository } from './SensorRepository';

export { createTelemetryRepository, transformLogsToDisplay, filterLogsByTimeRange, getLatestLog } from './TelemetryRepository';
export type { TelemetryUiState, ITelemetryRepository } from './TelemetryRepository';

export { createIncidentRepository, getActiveIncidents, getResolvedIncidents, groupIncidentsByType } from './IncidentRepository';
export type { IncidentUiState, IIncidentRepository } from './IncidentRepository';

export { createTankRepository, getTankById, sortTanksByLastSeen, filterRecentTanks } from './TankRepository';
export type { TankUiState, AllTanksUiState, ITankRepository } from './TankRepository';

