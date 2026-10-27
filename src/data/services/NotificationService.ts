import { PermissionsAndroid, Platform } from 'react-native';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage as subscribeToForegroundMessage,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import {
  collection,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import type { AlarmSettings, NotificationSeverity, NotificationStatus, UserNotification } from './NotificationTypes';

export type { AlarmSettings, NotificationSeverity, NotificationStatus, UserNotification } from './NotificationTypes';

const FUNCTIONS_REGION = 'asia-southeast1';
const db = getFirestore();
const messagingInstance = getMessaging();

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

function mapNotification(id: string, data: Record<string, unknown>): UserNotification {
  return {
    id,
    tankId: typeof data.tankId === 'string' ? data.tankId : '',
    type: data.type as UserNotification['type'],
    severity: data.severity as NotificationSeverity,
    title: typeof data.title === 'string' ? data.title : 'Notifikasi Smart Water Tank',
    body: typeof data.body === 'string' ? data.body : '',
    status: data.status as NotificationStatus,
    createdAt: toDate(data.createdAt),
    resolvedAt: toDate(data.resolvedAt),
  };
}

export function subscribeToMembership(
  uid: string,
  tankId: string,
  onData: (isMember: boolean) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'tank_members', tankId, 'members', uid),
    (snapshot) => onData(snapshot.exists() && snapshot.data()?.active === true),
    onError,
  );
}

export function subscribeToAlarmSettings(
  tankId: string,
  onData: (settings: AlarmSettings | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'alarm_settings', tankId),
    (snapshot) => {
      const data = snapshot.data();
      onData(data ? { enabled: data.enabled === true } : null);
    },
    onError,
  );
}

export async function setAlarmEnabled(
  tankId: string,
  uid: string,
  enabled: boolean,
): Promise<void> {
  await updateDoc(doc(db, 'alarm_settings', tankId), {
    enabled,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToNotifications(
  uid: string,
  onData: (notifications: UserNotification[]) => void,
  onError: (error: Error) => void,
): () => void {
  const items = query(
    collection(db, 'user_notifications', uid, 'items'),
    orderBy('createdAt', 'desc'),
    limit(30),
  );
  return onSnapshot(
    items,
    (snapshot) => onData(snapshot.docs.map((item) =>
      mapNotification(item.id, item.data() as Record<string, unknown>))),
    onError,
  );
}

export async function updateNotificationStatus(
  uid: string,
  notificationId: string,
  status: 'READ' | 'ACKNOWLEDGED',
): Promise<void> {
  const changes: Record<string, unknown> = { status };
  if (status === 'READ') changes.readAt = serverTimestamp();
  if (status === 'ACKNOWLEDGED') changes.acknowledgedAt = serverTimestamp();
  await updateDoc(doc(db, 'user_notifications', uid, 'items', notificationId), changes);
}

export async function sendTestNotification(): Promise<number> {
  const call = httpsCallable(getFunctions(undefined, FUNCTIONS_REGION), 'sendTestNotification');
  const result = await call({});
  const data = result.data as { deviceCount?: unknown };
  return typeof data.deviceCount === 'number' ? data.deviceCount : 0;
}

export async function registerForPushNotifications(uid: string): Promise<void> {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Izin notifikasi Android belum diberikan.');
    }
  } else if (Platform.OS === 'ios') {
    const status = await requestPermission(messagingInstance);
    if (
      status !== AuthorizationStatus.AUTHORIZED &&
      status !== AuthorizationStatus.PROVISIONAL
    ) {
      throw new Error('Izin notifikasi iOS belum diberikan.');
    }
  }

  const token = await getToken(messagingInstance);
  if (!token) throw new Error('Firebase tidak mengembalikan token push untuk perangkat ini.');

  const deviceId = encodeURIComponent(token);
  await setDoc(doc(db, 'users', uid, 'devices', deviceId), {
    ownerUid: uid,
    token,
    platform: Platform.OS,
    enabled: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function listenForForegroundPush(
  callback: (title: string, body: string) => void,
): () => void {
  return subscribeToForegroundMessage(messagingInstance, (message) => {
    callback(
      message.notification?.title ?? 'Notifikasi Smart Water Tank',
      message.notification?.body ?? 'Ada pembaruan alarm toren.',
    );
  });
}

export function listenForTokenRefresh(uid: string): () => void {
  return onTokenRefresh(messagingInstance, (token) => {
    void setDoc(doc(db, 'users', uid, 'devices', encodeURIComponent(token)), {
      ownerUid: uid,
      token,
      platform: Platform.OS,
      enabled: true,
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch((error: unknown) => {
      console.error('Failed to save refreshed FCM token:', error);
    });
  });
}
