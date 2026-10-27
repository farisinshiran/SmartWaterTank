export interface FirestoreLogDTO {
  id: string;
  tankId: string;
  sensor20Percent: boolean;
  legacySensor50Percent?: boolean;
  sensor90Percent: boolean;
  pumpStatusRead: 'ON' | 'OFF';
  createdAt: Date;
}

export type LogsCallback = (rows: FirestoreLogDTO[]) => void;
export type LogsErrorCallback = (error: Error) => void;

export const FIRESTORE_CONFIG = {
  telemetryCollection: 'telemetry_logs',
  defaultTankId: 'toren-gedung-a-01',
  maxHistoryEntries: 50,
} as const;

export type SubscribeToLogs = (
  tankId: string,
  max: number,
  onData: LogsCallback,
  onError: LogsErrorCallback,
) => () => void;
