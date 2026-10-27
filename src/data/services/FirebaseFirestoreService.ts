// Android/native implementation using @react-native-firebase/firestore.
import {
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';
import {
  FIRESTORE_CONFIG,
  FirestoreLogDTO,
  LogsCallback,
  LogsErrorCallback,
} from './firestoreTypes';

export const TELEMETRY_COLLECTION = FIRESTORE_CONFIG.telemetryCollection;

type FirestoreLogData = {
  tankId?: string;
  sensor20Percent?: unknown;
  sensor50Percent?: unknown;
  sensor90Percent?: unknown;
  pumpStatusRead?: unknown;
  createdAt?: { toDate?: () => Date } | Date | number;
};

function toDate(value: FirestoreLogData['createdAt']): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function mapDocument(
  id: string,
  data: FirestoreLogData,
  tankId: string,
): FirestoreLogDTO | null {
  const createdAt = toDate(data.createdAt);
  if (!createdAt) return null;

  return {
    id,
    tankId: data.tankId ?? tankId,
    sensor20Percent: data.sensor20Percent === true,
    legacySensor50Percent:
      data.sensor20Percent === undefined && data.sensor50Percent === true,
    sensor90Percent: data.sensor90Percent === true,
    pumpStatusRead: data.pumpStatusRead === 'ON' ? 'ON' : 'OFF',
    createdAt,
  };
}

export function subscribeToLogs(
  tankId: string,
  max: number,
  onData: LogsCallback,
  onError: LogsErrorCallback,
): () => void {
  const logsQuery = query(
    collection(getFirestore(), TELEMETRY_COLLECTION),
    where('tankId', '==', tankId),
    orderBy('createdAt', 'desc'),
    limit(max),
  );

  return onSnapshot(
    logsQuery,
    (snapshot) => {
      const rows = snapshot.docs
        .map((document) =>
          mapDocument(
            document.id,
            document.data({ serverTimestamps: 'estimate' }) as FirestoreLogData,
            tankId,
          ),
        )
        .filter((row): row is FirestoreLogDTO => row !== null);
      onData(rows);
    },
    onError,
  );
}
