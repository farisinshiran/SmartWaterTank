import {
  createTelemetryRepository,
  filterLogsByTimeRange,
  getLatestLog,
  transformLogsToDisplay,
} from '../../../data/repositories/TelemetryRepository';
import type { FirestoreLogDTO, SubscribeToLogs } from '../../../data/services/firestoreTypes';

jest.mock('../../../data/services/FirebaseFirestoreService', () => ({
  subscribeToLogs: jest.fn(),
}));

const timestamp = new Date('2026-10-14T04:36:16.000Z');

function makeLog(
  overrides: Partial<FirestoreLogDTO> = {},
): FirestoreLogDTO {
  return {
    id: 'log-1',
    tankId: 'toren-gedung-a-01',
    sensor20Percent: false,
    sensor90Percent: true,
    pumpStatusRead: 'OFF',
    createdAt: timestamp,
    ...overrides,
  };
}

describe('TelemetryRepository', () => {
  it('subscribes to Firestore logs and maps snapshots into domain logs', () => {
    let onData: ((rows: FirestoreLogDTO[]) => void) | undefined;
    const subscribe: SubscribeToLogs = jest.fn((_tankId, _max, next) => {
      onData = next;
      return jest.fn();
    });
    const repo = createTelemetryRepository('toren-gedung-a-01', 50, subscribe);
    const states: Array<{ logs: Array<{ id: string }>; isLoading: boolean; error: string | null }> = [];

    const unsubscribe = repo.subscribe((state) => states.push(state));
    onData?.([makeLog()]);

    expect(subscribe).toHaveBeenCalledWith(
      'toren-gedung-a-01',
      50,
      expect.any(Function),
      expect.any(Function),
    );
    expect(states).toHaveLength(1);
    expect(states[0].logs).toHaveLength(1);
    expect(states[0].logs[0].id).toBe('log-1');
    expect(unsubscribe).toBeDefined();
  });

  it('surfaces Firestore listener errors in repository state', () => {
    let onError: ((error: Error) => void) | undefined;
    const subscribe: SubscribeToLogs = jest.fn((_tankId, _max, _next, fail) => {
      onError = fail;
      return jest.fn();
    });
    const repo = createTelemetryRepository('toren-gedung-a-01', 50, subscribe);
    const states: Array<{ error: string | null }> = [];

    repo.subscribe((state) => states.push(state));
    onError?.(new Error('permission denied'));

    expect(states.at(-1)?.error).toBe('permission denied');
  });

  it('transforms domain logs to display rows', () => {
    const logs = [{
      id: 'a',
      tankId: 'toren-gedung-a-01',
      sensor20Percent: false,
      sensor90Percent: true,
      pumpStatusRead: 'ON' as const,
      timestamp: timestamp.getTime(),
    }];

    expect(transformLogsToDisplay(logs)).toMatchObject([{ id: 'a', waterLevelLabel: 'PENUH' }]);
  });

  it('filters logs by timestamp range and returns the latest row', () => {
    const logs = [
      { id: 'a', tankId: 't', sensor20Percent: false, sensor90Percent: false, pumpStatusRead: 'OFF' as const, timestamp: 100 },
      { id: 'b', tankId: 't', sensor20Percent: false, sensor90Percent: false, pumpStatusRead: 'OFF' as const, timestamp: 200 },
      { id: 'c', tankId: 't', sensor20Percent: false, sensor90Percent: false, pumpStatusRead: 'OFF' as const, timestamp: 300 },
    ];

    expect(filterLogsByTimeRange(logs, 150, 250)).toEqual([logs[1]]);
    expect(getLatestLog(logs)?.id).toBe('a');
    expect(getLatestLog([])).toBeNull();
  });
});
