/**
 * DI Container Types
 * Clean Architecture: Application Layer
 *
 * A typed bag of factory functions that produce the data-layer components
 * the ViewModels depend on. The container itself is a pure description.
 */

import type {
  ISensorRepository,
  ITelemetryRepository,
  IIncidentRepository,
  ITankRepository,
} from '../data/repositories';

export interface AppContainer {
  createSensorRepository(tankId?: string): ISensorRepository;
  createTelemetryRepository(tankId?: string, maxLogs?: number): ITelemetryRepository;
  createIncidentRepository(tankId?: string): IIncidentRepository;
  createTankRepository(tankId?: string): ITankRepository;
}
