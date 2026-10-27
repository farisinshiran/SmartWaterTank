/**
 * Production Container
 * Clean Architecture: Application Layer
 *
 * Default container that wires real Repositories on top of the real Services.
 */

import type { AppContainer } from './container';
import {
  createSensorRepository,
  createTelemetryRepository,
  createIncidentRepository,
  createTankRepository,
} from '../data/repositories';

export function createProductionContainer(): AppContainer {
  return {
    createSensorRepository: (tankId) => createSensorRepository(tankId),
    createTelemetryRepository: (tankId, maxLogs) => createTelemetryRepository(tankId, maxLogs),
    createIncidentRepository: (tankId) => createIncidentRepository(tankId),
    createTankRepository: (tankId) => createTankRepository(tankId),
  };
}
