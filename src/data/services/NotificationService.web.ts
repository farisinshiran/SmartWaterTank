import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firestore, firebaseApp, WEB_PUSH_VAPID_KEY } from '../../config/firebase.web';
import type {
  AlarmSettings,
  NotificationSeverity,
  NotificationStatus,
  UserNotification,
} from './NotificationTypes';

export type { AlarmSettings, NotificationSeverity, NotificationStatus, UserNotification } from './NotificationTypes';

const FUNCTIONS_REGION = 'asia-southeast1';

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
    doc(firestore, 'tank_members', tankId, 'members', uid),
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
    doc(firestore, 'alarm_settings', tankId),
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
  await updateDoc(doc(firestore, 'alarm_settings', tankId), {
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
    collection(firestore, 'user_notifications', uid, 'items'),
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
  await updateDoc(doc(firestore, 'user_notifications', uid, 'items', notificationId), changes);
}

export async function sendTestNotification(): Promise<number> {
  const call = httpsCallable(getFunctions(firebaseApp, FUNCTIONS_REGION), 'sendTestNotification');
  const result = await call({});
  const data = result.data as { deviceCount?: unknown };
  return typeof data.deviceCount === 'number' ? data.deviceCount : 0;
}

export async function registerForPushNotifications(uid: string): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('Browser ini tidak mendukung Web Push.');
  }
  if (!WEB_PUSH_VAPID_KEY) {
    throw new Error('VAPID key Web Push belum dikonfigurasi di src/config/firebase.web.ts.');
  }
  if (!(await isSupported())) throw new Error('Firebase Web Messaging tidak didukung browser ini.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Izin notifikasi browser tidak diberikan.');

  const webMessaging = getMessaging(firebaseApp);
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const token = await getToken(webMessaging, {
    vapidKey: WEB_PUSH_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error('Browser tidak mengembalikan token push.');

  await setDoc(doc(firestore, 'users', uid, 'devices', encodeURIComponent(token)), {
    ownerUid: uid,
    token,
    platform: 'web',
    enabled: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function listenForForegroundPush(
  callback: (title: string, body: string) => void,
): () => void {
  let unsubscribe = () => {};
  let cancelled = false;
  void isSupported().then((supported) => {
    if (supported && !cancelled) {
      unsubscribe = onMessage(getMessaging(firebaseApp), (payload: MessagePayload) => {
        callback(
          payload.notification?.title ?? 'Notifikasi Smart Water Tank',
          payload.notification?.body ?? 'Ada pembaruan alarm toren.',
        );
      });
    }
  });
  return () => {
    cancelled = true;
    unsubscribe();
  };
}

export function listenForTokenRefresh(_uid: string): () => void {
  return () => {};
}
