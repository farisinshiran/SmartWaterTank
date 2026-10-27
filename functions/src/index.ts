import { initializeApp } from 'firebase-admin/app';
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentData,
  type DocumentReference,
} from 'firebase-admin/firestore';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

initializeApp();
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 10 });

const db = getFirestore();
const LOW_LEVEL_DURATION_MS = 2 * 60 * 1000;
const SENSOR_TIMEOUT_MS = 5 * 60 * 1000;
const CRITICAL_REPEAT_MS = 15 * 60 * 1000;
const TEST_COOLDOWN_MS = 60 * 1000;
const DEFAULT_TANK_ID = 'toren-gedung-a-01';

type IncidentType = 'LOW_LEVEL' | 'OVERFLOW' | 'SENSOR_OFFLINE';
type Severity = 'WARNING' | 'CRITICAL';

interface IncidentDescriptor {
  type: IncidentType;
  severity: Severity;
  title: string;
  body: string;
}

const DESCRIPTORS: Record<IncidentType, IncidentDescriptor> = {
  LOW_LEVEL: {
    type: 'LOW_LEVEL',
    severity: 'WARNING',
    title: 'Level air rendah',
    body: 'Level air berada di bawah 20% selama minimal 2 menit.',
  },
  OVERFLOW: {
    type: 'OVERFLOW',
    severity: 'CRITICAL',
    title: 'Peringatan potensi meluap',
    body: 'Sensor level air 90% aktif.',
  },
  SENSOR_OFFLINE: {
    type: 'SENSOR_OFFLINE',
    severity: 'CRITICAL',
    title: 'Sensor terputus',
    body: 'Tidak ada telemetry baru dari sensor selama minimal 5 menit.',
  },
};

interface TelemetryData {
  tankId?: unknown;
  sensor20Percent?: unknown;
  sensor50Percent?: unknown;
  sensor90Percent?: unknown;
  pumpStatusRead?: unknown;
  createdAt?: Timestamp;
}

function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

function isLowLevel(sensor20Percent: boolean, sensor90Percent: boolean): boolean {
  return !sensor20Percent && !sensor90Percent;
}

function conditionKey(type: IncidentType): string {
  if (type === 'LOW_LEVEL') return 'lowIncidentId';
  if (type === 'OVERFLOW') return 'overflowIncidentId';
  return 'offlineIncidentId';
}

function notificationPath(uid: string, incidentId: string) {
  return db.collection('user_notifications').doc(uid).collection('items').doc(incidentId);
}

async function getRecipients(tankId: string, type: IncidentType): Promise<string[]> {
  const members = await db
    .collection('tank_members')
    .doc(tankId)
    .collection('members')
    .where('active', '==', true)
    .get();

  return members.docs
    .filter((member) => type !== 'SENSOR_OFFLINE' || member.get('isManager') === true)
    .map((member) => member.id);
}

async function sendPushToUser(
  uid: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<number> {
  const devices = await db
    .collection('users')
    .doc(uid)
    .collection('devices')
    .where('enabled', '==', true)
    .get();
  const tokens = devices.docs
    .map((device) => ({
      ref: device.ref,
      token: device.get('token'),
    }))
    .filter((device): device is { ref: DocumentReference; token: string } =>
      typeof device.token === 'string' && device.token.length > 0);

  if (tokens.length === 0) return 0;

  let sent = 0;
  for (let offset = 0; offset < tokens.length; offset += 500) {
    const group = tokens.slice(offset, offset + 500);
    const message: MulticastMessage = {
      tokens: group.map((item) => item.token),
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: { priority: 'high' },
      },
      webpush: {
        headers: { Urgency: 'high' },
        fcmOptions: {
          link: 'https://smart-water-tank-e49d6.web.app/',
        },
      },
    };
    const response = await getMessaging().sendEachForMulticast(message);
    sent += response.successCount;

    const invalidTokens = response.responses
      .map((result, index) => ({ result, device: group[index] }))
      .filter(({ result }) => {
        const code = result.error?.code;
        return code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered';
      });
    await Promise.all(invalidTokens.map(({ device }) => device.ref.delete()));

    response.responses.forEach((result) => {
      if (!result.success && result.error) {
        console.error('FCM device delivery failed', { uid, code: result.error.code });
      }
    });
  }
  return sent;
}

async function setRecipientNotifications(
  recipientUids: string[],
  incidentId: string,
  incident: DocumentData,
  resetStatus: boolean,
): Promise<void> {
  for (let offset = 0; offset < recipientUids.length; offset += 400) {
    const batch = db.batch();
    const group = recipientUids.slice(offset, offset + 400);
    for (const uid of group) {
      const ref = notificationPath(uid, incidentId);
      const data: FirebaseFirestore.DocumentData = {
        incidentId,
        tankId: incident.tankId,
        type: incident.type,
        severity: incident.severity,
        title: incident.title,
        body: incident.body,
        active: true,
      };
      if (resetStatus) {
        data.status = 'NEW';
        data.createdAt = incident.startedAt ?? FieldValue.serverTimestamp();
        data.nextRepeatAt = incident.severity === 'CRITICAL'
          ? Timestamp.fromMillis(Date.now() + CRITICAL_REPEAT_MS)
          : null;
      }
      batch.set(ref, data, { merge: true });
    }
    await batch.commit();
  }
}

async function deliverIncident(
  incidentRef: DocumentReference,
  force = false,
): Promise<void> {
  const snapshot = await incidentRef.get();
  if (!snapshot.exists || snapshot.get('status') !== 'ACTIVE') return;
  const incident = snapshot.data();
  if (!incident) return;

  const setting = await db.collection('alarm_settings').doc(String(incident.tankId)).get();
  if (setting.get('enabled') !== true) return;
  if (incident.notificationSent === true && !force) return;

  const recipientUids = await getRecipients(String(incident.tankId), incident.type as IncidentType);
  if (recipientUids.length === 0) {
    console.error('Alarm has no active recipients', {
      tankId: incident.tankId,
      type: incident.type,
    });
    return;
  }

  const shouldSend = await db.runTransaction(async (transaction) => {
    const current = await transaction.get(incidentRef);
    if (!current.exists || current.get('status') !== 'ACTIVE') return false;
    if (current.get('notificationSent') === true && !force) return false;
    transaction.update(incidentRef, {
      notificationSent: true,
      recipientUids,
      nextNotificationAt: current.get('severity') === 'CRITICAL'
        ? Timestamp.fromMillis(Date.now() + CRITICAL_REPEAT_MS)
        : null,
      notificationSentAt: FieldValue.serverTimestamp(),
      deliveryError: FieldValue.delete(),
    });
    return true;
  });
  if (!shouldSend) return;

  try {
    await setRecipientNotifications(recipientUids, incidentRef.id, incident, true);
    const results = await Promise.all(recipientUids.map((uid) =>
      sendPushToUser(uid, String(incident.title), String(incident.body), {
        notificationId: incidentRef.id,
        tankId: String(incident.tankId),
        type: String(incident.type),
        severity: String(incident.severity),
      }),
    ));
    console.info('Alarm notification delivered', {
      incidentId: incidentRef.id,
      recipients: recipientUids.length,
      devices: results.reduce((total, count) => total + count, 0),
    });
  } catch (error) {
    await incidentRef.update({
      notificationSent: false,
      nextNotificationAt: Timestamp.fromMillis(Date.now() + 60 * 1000),
      deliveryError: error instanceof Error ? error.message.slice(0, 500) : 'Unknown FCM delivery failure',
    });
    throw error;
  }
}

async function resolveIncident(
  tankId: string,
  type: IncidentType,
  incidentId: string,
): Promise<void> {
  const incidentRef = db.collection('alarm_incidents').doc(incidentId);
  const shouldResolve = await db.runTransaction(async (transaction) => {
    const [state, incident] = await Promise.all([
      transaction.get(db.collection('alarm_states').doc(tankId)),
      transaction.get(incidentRef),
    ]);
    if (!incident.exists || incident.get('status') !== 'ACTIVE') return false;
    const key = conditionKey(type);
    if (state.exists && state.get(key) === incidentId) {
      transaction.update(state.ref, { [key]: FieldValue.delete() });
    }
    transaction.update(incidentRef, {
      active: false,
      status: 'RESOLVED',
      resolvedAt: FieldValue.serverTimestamp(),
      nextNotificationAt: FieldValue.delete(),
    });
    return true;
  });
  if (!shouldResolve) return;

  const recipientUids = (await incidentRef.get()).get('recipientUids') as string[] | undefined;
  if (!recipientUids?.length) return;
  for (let offset = 0; offset < recipientUids.length; offset += 400) {
    const batch = db.batch();
    for (const uid of recipientUids.slice(offset, offset + 400)) {
      batch.set(notificationPath(uid, incidentId), {
        active: false,
        status: 'RESOLVED',
        resolvedAt: FieldValue.serverTimestamp(),
        nextRepeatAt: FieldValue.delete(),
      }, { merge: true });
    }
    await batch.commit();
  }
}

async function ensureIncident(
  tankId: string,
  type: IncidentType,
  startedAt: Timestamp,
): Promise<void> {
  const stateRef = db.collection('alarm_states').doc(tankId);
  const incidentRef = db.collection('alarm_incidents').doc();
  let created = false;

  await db.runTransaction(async (transaction) => {
    const state = await transaction.get(stateRef);
    if (state.get(conditionKey(type))) return;
    const descriptor = DESCRIPTORS[type];
    transaction.create(incidentRef, {
      tankId,
      type,
      severity: descriptor.severity,
      title: descriptor.title,
      body: descriptor.body,
      status: 'ACTIVE',
      active: true,
      startedAt,
      notificationSent: false,
      recipientUids: [],
      nextNotificationAt: null,
    });
    transaction.set(stateRef, { [conditionKey(type)]: incidentRef.id }, { merge: true });
    created = true;
  });

  if (!created) return;
  await deliverIncident(incidentRef);
}

async function processTelemetry(
  tankId: string,
  data: TelemetryData,
): Promise<void> {
  const sensor20Percent = data.sensor20Percent === true || data.sensor50Percent === true;
  const sensor90Percent = data.sensor90Percent === true;
  const low = isLowLevel(sensor20Percent, sensor90Percent);
  const observedAt = isTimestamp(data.createdAt) ? data.createdAt : Timestamp.now();
  const stateRef = db.collection('alarm_states').doc(tankId);
  const lowRef = db.collection('alarm_incidents').doc();
  const overflowRef = db.collection('alarm_incidents').doc();
  let lowIncidentId: string | null = null;
  let overflowIncidentId: string | null = null;
  let lowStartedAt: Timestamp | null = null;
  let resolvedLowId: string | null = null;
  let resolvedOverflowId: string | null = null;
  let resolvedOfflineId: string | null = null;
  let staleTelemetry = false;

  await db.runTransaction(async (transaction) => {
    lowIncidentId = null;
    overflowIncidentId = null;
    resolvedLowId = null;
    resolvedOverflowId = null;
    resolvedOfflineId = null;
    staleTelemetry = false;
    const state = await transaction.get(stateRef);
    const lastTelemetryAt = state.get('lastTelemetryAt');
    if (isTimestamp(lastTelemetryAt) && observedAt.toMillis() < lastTelemetryAt.toMillis()) {
      staleTelemetry = true;
      return;
    }
    const currentLowStartedAt = state.get('lowStartedAt');
    lowStartedAt = low
      ? (isTimestamp(currentLowStartedAt) ? currentLowStartedAt : observedAt)
      : null;
    const currentLowId = state.get('lowIncidentId');
    const currentOverflowId = state.get('overflowIncidentId');
    const currentOfflineId = state.get('offlineIncidentId');

    if (low && !currentLowId &&
      observedAt.toMillis() - (lowStartedAt?.toMillis() ?? observedAt.toMillis()) >= LOW_LEVEL_DURATION_MS) {
      const descriptor = DESCRIPTORS.LOW_LEVEL;
      transaction.create(lowRef, {
        tankId,
        type: descriptor.type,
        severity: descriptor.severity,
        title: descriptor.title,
        body: descriptor.body,
        status: 'ACTIVE',
        active: true,
        startedAt: lowStartedAt,
        notificationSent: false,
        recipientUids: [],
        nextNotificationAt: null,
      });
      lowIncidentId = lowRef.id;
    } else if (!low && currentLowId) {
      resolvedLowId = String(currentLowId);
    }

    if (sensor90Percent && !currentOverflowId) {
      const descriptor = DESCRIPTORS.OVERFLOW;
      transaction.create(overflowRef, {
        tankId,
        type: descriptor.type,
        severity: descriptor.severity,
        title: descriptor.title,
        body: descriptor.body,
        status: 'ACTIVE',
        active: true,
        startedAt: observedAt,
        notificationSent: false,
        recipientUids: [],
        nextNotificationAt: null,
      });
      overflowIncidentId = overflowRef.id;
    } else if (!sensor90Percent && currentOverflowId) {
      resolvedOverflowId = String(currentOverflowId);
    }
    if (currentOfflineId) resolvedOfflineId = String(currentOfflineId);

    transaction.set(stateRef, {
      tankId,
      lastTelemetryAt: observedAt,
      sensor20Percent,
      sensor90Percent,
      lowStartedAt,
      ...(lowIncidentId ? { lowIncidentId } : {}),
      ...(resolvedLowId ? { lowIncidentId: FieldValue.delete() } : {}),
      ...(overflowIncidentId ? { overflowIncidentId } : {}),
      ...(resolvedOverflowId ? { overflowIncidentId: FieldValue.delete() } : {}),
      ...(resolvedOfflineId ? { offlineIncidentId: FieldValue.delete() } : {}),
    }, { merge: true });

    for (const id of [resolvedLowId, resolvedOverflowId, resolvedOfflineId]) {
      if (id) {
        transaction.update(db.collection('alarm_incidents').doc(id), {
          active: false,
          status: 'RESOLVED',
          resolvedAt: FieldValue.serverTimestamp(),
          nextNotificationAt: FieldValue.delete(),
        });
      }
    }
  });

  if (staleTelemetry) return;
  if (resolvedLowId) await markNotificationsResolved(resolvedLowId);
  if (resolvedOverflowId) await markNotificationsResolved(resolvedOverflowId);
  if (resolvedOfflineId) await markNotificationsResolved(resolvedOfflineId);
  if (lowIncidentId) await deliverIncident(lowRef);
  if (overflowIncidentId) await deliverIncident(overflowRef);
}

async function markNotificationsResolved(incidentId: string): Promise<void> {
  const incident = await db.collection('alarm_incidents').doc(incidentId).get();
  const recipientUids = incident.get('recipientUids') as string[] | undefined;
  if (!recipientUids?.length) return;
  for (let offset = 0; offset < recipientUids.length; offset += 400) {
    const batch = db.batch();
    for (const uid of recipientUids.slice(offset, offset + 400)) {
      batch.set(notificationPath(uid, incidentId), {
        active: false,
        status: 'RESOLVED',
        resolvedAt: FieldValue.serverTimestamp(),
        nextRepeatAt: FieldValue.delete(),
      }, { merge: true });
    }
    await batch.commit();
  }
}

export const processTelemetryLog = onDocumentCreated(
  'telemetry_logs/{documentId}',
  async (event) => {
    const data = event.data?.data() as TelemetryData | undefined;
    if (!data || typeof data.tankId !== 'string' || data.tankId.length === 0) {
      console.error('Ignoring telemetry without a valid tankId', { documentId: event.params.documentId });
      return;
    }
    await processTelemetry(data.tankId, data);
  },
);

export const handleAlarmSettingChange = onDocumentUpdated(
  'alarm_settings/{tankId}',
  async (event) => {
    const change = event.data;
    if (!change || change.after.get('enabled') !== true || change.before.get('enabled') === true) return;
    const active = await db.collection('alarm_incidents')
      .where('tankId', '==', event.params.tankId)
      .where('status', '==', 'ACTIVE')
      .get();
    await Promise.all(active.docs.map((incident) => deliverIncident(incident.ref, true)));
  },
);

export const maintainAlarms = onSchedule(
  { schedule: 'every 1 minutes', timeZone: 'Asia/Jakarta' },
  async () => {
    const now = Timestamp.now();
    const states = await db.collection('alarm_states').get();
    for (const state of states.docs) {
      const lastTelemetryAt = state.get('lastTelemetryAt');
      if (!isTimestamp(lastTelemetryAt)) continue;

      if (now.toMillis() - lastTelemetryAt.toMillis() >= SENSOR_TIMEOUT_MS &&
        !state.get('offlineIncidentId')) {
        await ensureIncident(state.id, 'SENSOR_OFFLINE', lastTelemetryAt);
      }
      if (now.toMillis() - lastTelemetryAt.toMillis() < SENSOR_TIMEOUT_MS &&
        state.get('offlineIncidentId')) {
        await resolveIncident(state.id, 'SENSOR_OFFLINE', String(state.get('offlineIncidentId')));
      }

      const lowStartedAt = state.get('lowStartedAt');
      if (
        isTimestamp(lowStartedAt) &&
        now.toMillis() - lowStartedAt.toMillis() >= LOW_LEVEL_DURATION_MS &&
        state.get('sensor20Percent') === false &&
        state.get('sensor90Percent') !== true &&
        !state.get('lowIncidentId')
      ) {
        await ensureIncident(state.id, 'LOW_LEVEL', lowStartedAt);
      }
      if (state.get('sensor90Percent') === true && !state.get('overflowIncidentId')) {
        await ensureIncident(state.id, 'OVERFLOW', lastTelemetryAt);
      }
    }

    const settings = await db.collection('alarm_settings').get();
    const enabledTanks = new Set(
      settings.docs.filter((setting) => setting.get('enabled') === true).map((setting) => setting.id),
    );
    const incidents = await db.collection('alarm_incidents')
      .where('status', '==', 'ACTIVE')
      .limit(500)
      .get();
    for (const incident of incidents.docs) {
      if (!enabledTanks.has(String(incident.get('tankId')))) continue;
      if (incident.get('notificationSent') !== true) {
        await deliverIncident(incident.ref);
        continue;
      }
      const nextNotificationAt = incident.get('nextNotificationAt');
      if (
        incident.get('severity') !== 'CRITICAL' ||
        !isTimestamp(nextNotificationAt) ||
        nextNotificationAt.toMillis() > now.toMillis()
      ) {
        continue;
      }

      const recipients = incident.get('recipientUids') as string[] | undefined;
      if (!recipients?.length) continue;
      const claimed = await db.runTransaction(async (transaction) => {
        const current = await transaction.get(incident.ref);
        const dueAt = current.get('nextNotificationAt');
        if (
          current.get('status') !== 'ACTIVE' ||
          !isTimestamp(dueAt) ||
          dueAt.toMillis() > Date.now()
        ) return false;
        transaction.update(incident.ref, {
          nextNotificationAt: Timestamp.fromMillis(Date.now() + CRITICAL_REPEAT_MS),
        });
        return true;
      });
      if (!claimed) continue;

      const pendingRecipients: string[] = [];
      await Promise.all(recipients.map(async (uid) => {
        const notification = await notificationPath(uid, incident.id).get();
        if (notification.exists && ['NEW', 'READ'].includes(String(notification.get('status')))) {
          pendingRecipients.push(uid);
        }
      }));
      await Promise.all(pendingRecipients.map((uid) =>
        sendPushToUser(uid, String(incident.get('title')), String(incident.get('body')), {
          notificationId: incident.id,
          tankId: String(incident.get('tankId')),
          type: String(incident.get('type')),
          severity: String(incident.get('severity')),
        }),
      ));
      if (pendingRecipients.length === 0) {
        await incident.ref.update({
          nextNotificationAt: FieldValue.delete(),
          allRecipientsAcknowledgedAt: FieldValue.serverTimestamp(),
        });
      }
    }
  },
);

export const sendTestNotification = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Masuk terlebih dahulu untuk mengirim tes.');

  const membership = await db.collection('tank_members')
    .doc(DEFAULT_TANK_ID)
    .collection('members')
    .doc(uid)
    .get();
  if (!membership.exists || membership.get('active') !== true) {
    throw new HttpsError('permission-denied', 'Akun bukan anggota toren ini.');
  }

  const throttleRef = db.collection('test_notification_limits').doc(uid);
  await db.runTransaction(async (transaction) => {
    const throttle = await transaction.get(throttleRef);
    const lastSentAt = throttle.get('lastSentAt');
    if (isTimestamp(lastSentAt) && Date.now() - lastSentAt.toMillis() < TEST_COOLDOWN_MS) {
      throw new HttpsError('resource-exhausted', 'Tunggu sebentar sebelum mengirim tes berikutnya.');
    }
    transaction.set(throttleRef, { lastSentAt: Timestamp.now() });
  });

  const notificationRef = db.collection('user_notifications')
    .doc(uid)
    .collection('items')
    .doc();
  await notificationRef.set({
    incidentId: notificationRef.id,
    tankId: DEFAULT_TANK_ID,
    type: 'TEST',
    severity: 'INFO',
    title: 'Tes notifikasi Smart Water Tank',
    body: 'Notifikasi tes berhasil dikirim ke akun ini.',
    status: 'NEW',
    active: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  const deviceCount = await sendPushToUser(
    uid,
    'Tes notifikasi Smart Water Tank',
    'Notifikasi tes berhasil dikirim ke akun ini.',
    {
      notificationId: notificationRef.id,
      tankId: DEFAULT_TANK_ID,
      type: 'TEST',
      severity: 'INFO',
    },
  );
  return { notificationId: notificationRef.id, deviceCount };
});
