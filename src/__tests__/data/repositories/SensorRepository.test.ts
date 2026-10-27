/**
 * Tests for SensorRepository (Firestore-based)
 *
 * NOTE: These tests use Firestore emulators or skip real-time subscription tests.
 * The repository now uses Firestore onSnapshot internally and does not accept
 * service injection. For unit testing with fake data, use Firebase Emulator Suite.
 */
import { getSensorState, isCriticalOverflow, SensorUiState } from '../../../data/repositories/SensorRepository';

jest.mock('../../../data/services/FirebaseFirestoreService', () => ({
  subscribeToLogs: jest.fn(),
}));

describe('SensorRepository helpers', () => {
  it('getSensorState extracts the sensor reading from UI state', () => {
    const reading = getSensorState({
      sensorData: { sensor20Percent: false, sensor90Percent: true, pumpStatusRead: 'ON' as const },
      waterLevelLabel: 'FULL',
      waterLevelPercentage: 90,
      isConnected: true,
      lastUpdate: new Date(),
      error: null,
    });
    expect(reading).toEqual({
      sensor20Percent: false,
      sensor90Percent: true,
      pumpStatusRead: 'ON',
    });
  });

  it('isCriticalOverflow is true when sensor 90% is active and the pump is ON', () => {
    const base: SensorUiState = {
      sensorData: { sensor20Percent: false, sensor90Percent: true, pumpStatusRead: 'ON' },
      waterLevelLabel: 'FULL',
      waterLevelPercentage: 90,
      isConnected: true,
      lastUpdate: new Date(),
      error: null,
    };
    expect(
      isCriticalOverflow({
        ...base,
        sensorData: { sensor20Percent: true, sensor90Percent: true, pumpStatusRead: 'ON' },
      })
    ).toBe(true);

    expect(
      isCriticalOverflow({
        ...base,
        sensorData: { sensor20Percent: false, sensor90Percent: true, pumpStatusRead: 'ON' },
      })
    ).toBe(true);
    expect(
      isCriticalOverflow({
        ...base,
        sensorData: { sensor20Percent: true, sensor90Percent: true, pumpStatusRead: 'OFF' },
      })
    ).toBe(false);
  });
});
