import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  listenForForegroundPush,
  listenForTokenRefresh,
  registerForPushNotifications,
  sendTestNotification,
  setAlarmEnabled,
  subscribeToAlarmSettings,
  subscribeToMembership,
  subscribeToNotifications,
  updateNotificationStatus,
  type AlarmSettings,
  type UserNotification,
} from '../../data/services/NotificationService';
import type { AuthUser } from '../../data/services/AuthTypes';
import { FIRESTORE_CONFIG } from '../../data/services/firestoreTypes';

interface NotificationCenterProps {
  user: AuthUser;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

const tankId = FIRESTORE_CONFIG.defaultTankId;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Operasi notifikasi gagal.';
}

function severityColor(severity: UserNotification['severity']): string {
  if (severity === 'CRITICAL') return '#B91C1C';
  if (severity === 'WARNING') return '#B45309';
  return '#0369A1';
}

function statusLabel(status: UserNotification['status']): string {
  if (status === 'READ') return 'Dibaca';
  if (status === 'ACKNOWLEDGED') return 'Diakui';
  if (status === 'RESOLVED') return 'Selesai';
  return 'Baru';
}

export const NotificationCenter = ({
  user,
  onSignOut,
  children,
}: NotificationCenterProps) => {
  const [membership, setMembership] = useState<boolean | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AlarmSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMembership(null);
    setMembershipError(null);
    return subscribeToMembership(
      user.uid,
      tankId,
      setMembership,
      (error) => setMembershipError(error.message),
    );
  }, [user.uid]);

  useEffect(() => {
    if (membership !== true) return undefined;

    const unsubscribeSettings = subscribeToAlarmSettings(
      tankId,
      setSettings,
      (error) => setSettingsError(error.message),
    );
    const unsubscribeNotifications = subscribeToNotifications(
      user.uid,
      setNotifications,
      (error) => setActionError(error.message),
    );
    const unsubscribeForeground = listenForForegroundPush((title, body) => {
      setNotice(`${title}: ${body}`);
    });
    const unsubscribeToken = listenForTokenRefresh(user.uid);

    return () => {
      unsubscribeSettings();
      unsubscribeNotifications();
      unsubscribeForeground();
      unsubscribeToken();
    };
  }, [membership, user.uid]);

  const runAction = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const runTestNotification = async () => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const deviceCount = await sendTestNotification();
      setNotice(
        deviceCount > 0
          ? `Tes dikirim ke ${deviceCount} perangkat push.`
          : 'Tes tercatat di notifikasi dalam aplikasi; belum ada perangkat push yang terdaftar.',
      );
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (membershipError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F3F4F6' }}>
        <Text style={{ color: '#B91C1C', fontSize: 16, fontWeight: '700' }}>
          Tidak dapat memverifikasi keanggotaan toren
        </Text>
        <Text style={{ color: '#374151', marginTop: 8 }}>{membershipError}</Text>
        <TouchableOpacity onPress={() => void onSignOut()} style={{ paddingVertical: 14 }}>
          <Text style={{ color: '#0369A1', fontWeight: '700' }}>Keluar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (membership === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={{ marginTop: 12 }}>Memeriksa akses akun...</Text>
      </View>
    );
  }

  if (!membership) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F3F4F6' }}>
        <Text style={{ color: '#111827', fontSize: 20, fontWeight: '700' }}>Akun belum menjadi anggota toren</Text>
        <Text style={{ color: '#4B5563', marginTop: 10, lineHeight: 20 }}>
          Minta administrator menambahkan UID berikut pada keanggotaan {tankId}:
        </Text>
        <Text selectable style={{ color: '#0369A1', marginTop: 8 }}>{user.uid}</Text>
        <TouchableOpacity onPress={() => void onSignOut()} style={{ paddingVertical: 16 }}>
          <Text style={{ color: '#0369A1', fontWeight: '700' }}>Keluar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: '#1E3A8A', fontWeight: '700' }}>Aturan alarm toren</Text>
            {settings
              ? <Text style={{ color: '#4B5563', fontSize: 12, marginTop: 3 }}>Ambang 20% dan 90%</Text>
              : <Text style={{ color: '#B91C1C', fontSize: 12, marginTop: 3 }}>
                  {settingsError ?? 'Pengaturan alarm belum dibuat oleh administrator.'}
                </Text>}
          </View>
          <Switch
            accessibilityLabel="Aktifkan aturan alarm"
            disabled={!settings || busy}
            value={settings?.enabled ?? false}
            onValueChange={(enabled) => {
              void runAction(
                () => setAlarmEnabled(tankId, user.uid, enabled),
                enabled ? 'Aturan alarm diaktifkan.' : 'Aturan alarm dinonaktifkan.',
              );
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          <TouchableOpacity
            disabled={busy}
            onPress={() => void runAction(
              () => registerForPushNotifications(user.uid),
              'Push diaktifkan pada perangkat ini.',
            )}
            style={{ backgroundColor: '#0369A1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Aktifkan push</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={busy}
            onPress={() => void runTestNotification()}
            style={{ backgroundColor: '#FFFFFF', borderColor: '#0369A1', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7 }}
          >
            <Text style={{ color: '#0369A1', fontWeight: '600', fontSize: 12 }}>Tes notifikasi</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void onSignOut()} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
            <Text style={{ color: '#4B5563', fontSize: 12 }}>Keluar</Text>
          </TouchableOpacity>
        </View>
        {actionError && <Text accessibilityRole="alert" style={{ color: '#B91C1C', fontSize: 12, marginTop: 8 }}>{actionError}</Text>}
        {notice && <Text style={{ color: '#166534', fontSize: 12, marginTop: 8 }}>{notice}</Text>}
        {busy && <ActivityIndicator size="small" color="#0369A1" style={{ marginTop: 6, alignSelf: 'flex-start' }} />}
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, backgroundColor: '#FFFFFF' }}>
        <Text style={{ color: '#111827', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>
          Notifikasi terbaru
        </Text>
        {notifications.length === 0
          ? <Text style={{ color: '#6B7280', fontSize: 12 }}>Belum ada notifikasi.</Text>
          : notifications.slice(0, 5).map((item) => (
            <View key={item.id} style={{ borderTopWidth: 1, borderColor: '#E5E7EB', paddingVertical: 8 }}>
              <Text style={{ color: severityColor(item.severity), fontWeight: '700', fontSize: 12 }}>
                {item.title} · {statusLabel(item.status)}
              </Text>
              <Text style={{ color: '#374151', fontSize: 12, marginTop: 3 }}>{item.body}</Text>
              {item.status === 'NEW' && (
                <TouchableOpacity onPress={() => void runAction(
                  () => updateNotificationStatus(user.uid, item.id, 'READ'),
                  'Notifikasi ditandai telah dibaca.',
                )}>
                  <Text style={{ color: '#0369A1', fontSize: 12, marginTop: 5 }}>Tandai dibaca</Text>
                </TouchableOpacity>
              )}
              {(item.status === 'NEW' || item.status === 'READ') && item.severity === 'CRITICAL' && (
                <TouchableOpacity onPress={() => void runAction(
                  () => updateNotificationStatus(user.uid, item.id, 'ACKNOWLEDGED'),
                  'Peringatan Kritis diakui.',
                )}>
                  <Text style={{ color: '#B91C1C', fontSize: 12, fontWeight: '700', marginTop: 5 }}>Akui peringatan</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
      </View>
      {children}
    </View>
  );
};
