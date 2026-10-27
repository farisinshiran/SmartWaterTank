/**
 * Test Container
 * Clean Architecture: Application Layer
 *
 * Wires Repositories onto Firestore. For unit testing with fake services,
 * repositories should be tested in isolation with Firestore emulators.
 *
 * NOTE: The current repository implementations (SensorRepository, TelemetryRepository)
 * create their own Firestore service internally and do not accept service injection.
 * For testing with fake data, use Firebase Emulator Suite.
 */

import type { AppContainer } from './container';

export interface TestContainer {
  container: AppContainer;
  reset(): void;
}

export function createTestContainer(): TestContainer {
  const container: AppContainer = {
    createSensorRepository: (tankId) =>
      createSensorRepository(tankId),
    createTelemetryRepository: (tankId, maxLogs) =>
      createTelemetryRepository(tankId, maxLogs),
    createIncidentRepository: (tankId) =>
      createIncidentRepository(tankId),
    createTankRepository: (tankId) =>
      createTankRepository(tankId),
  };

  return {
    container,
    reset() {
      // No-op: real-time Firestore listeners handle updates
    },
  };
}

// Import the actual repository factories for test container
import {
  createSensorRepository,
  createTelemetryRepository,
  createIncidentRepository,
  createTankRepository,
} from '../data/repositories';

