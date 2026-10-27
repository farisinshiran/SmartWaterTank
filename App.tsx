import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTelemetry } from './src/logic/hooks/useTelemetry';
import type { TelemetryLog } from './src/domain/models/Telemetry';
import { observeAuthState, signOut } from './src/data/services/AuthService';
import type { AuthUser } from './src/data/services/AuthTypes';
import { AuthScreen } from './src/view/components/AuthScreen';
import { NotificationCenter } from './src/view/components/NotificationCenter';
import { DemoControlPanel } from './src/view/components/DemoControlPanel';

/* ---------------------------------- DATA ---------------------------------- */
const MIN_LEVEL = 20;
const MAX_LEVEL = 90;
const SENSOR_HEARTBEAT_MS = 60_000;

/* ---------------------------------- TEMA ---------------------------------- */
const lightTheme = {
  background: '#F3F4F6',
  header: '#1E3A8A',
  card: '#FFFFFF',
  border: '#E5E7EB',
  cardTitle: '#6B7280',
  text: '#374151',
  muted: '#9CA3AF',
  waterLevel: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  tank: '#E5E7EB',
  tankBorder: '#9CA3AF',
  chip: '#D1FAE5',
  chipText: '#047857',
};

const darkTheme: Theme = {
  background: '#111827',
  header: '#0F172A',
  card: '#1F2937',
  border: '#374151',
  cardTitle: '#9CA3AF',
  text: '#D1D5DB',
  muted: '#6B7280',
  waterLevel: '#60A5FA',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  tank: '#111827',
  tankBorder: '#4B5563',
  chip: '#064E3B',
  chipText: '#6EE7B7',
};
type Theme = typeof lightTheme;

/* ------------------------------ KOMPONEN KECIL ----------------------------- */
function MetricCard(props: { theme: Theme; label: string; value: string; sub: string; subColor?: string }) {
  const { theme, label, value, sub, subColor } = props;
  return (
    <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.metricLabel, { color: theme.cardTitle }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricSub, { color: subColor || theme.muted }]}>{sub}</Text>
    </View>
  );
}

function HistoryChart({ theme, logs }: { theme: Theme; logs: TelemetryLog[] }) {
  const orderedLogs = [...logs].reverse();
  const data = orderedLogs.map((log) =>
    log.sensor90Percent
      ? 90
      : log.sensor20Percent
        ? 20
        : log.legacySensor50Percent
          ? 50
          : 10,
  );
  const formatTime = (timestamp?: number) =>
    timestamp === undefined
      ? '--'
      : new Date(timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
  const middleIndex = Math.floor((orderedLogs.length - 1) / 2);
  const xLabels = [
    formatTime(orderedLogs[0]?.timestamp),
    formatTime(orderedLogs[middleIndex]?.timestamp),
    formatTime(orderedLogs[orderedLogs.length - 1]?.timestamp),
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeaderRow}>
        <Text style={[styles.cardTitle, { color: theme.cardTitle }]}>Riwayat level air</Text>
        <Text style={{ fontSize: 12, color: theme.muted }}>{logs.length} data terbaru</Text>
      </View>

      {data.length > 0 ? (
        <>
          <View style={styles.chartArea}>
            {data.map((value, index) => (
              <View
                key={orderedLogs[index].id}
                style={{
                  flex: 1,
                  marginHorizontal: 1,
                  height: `${value}%`,
                  backgroundColor: value < MIN_LEVEL ? theme.danger : theme.waterLevel,
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                }}
              />
            ))}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${MIN_LEVEL}%`,
                borderTopWidth: 1,
                borderStyle: 'dashed',
                borderColor: theme.warning,
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${MAX_LEVEL}%`,
                borderTopWidth: 1,
                borderStyle: 'dashed',
                borderColor: theme.success,
              }}
            />
          </View>
          <Text style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
            Garis batas sensor: 20% dan 90%
          </Text>
        </>
      ) : (
        <Text style={{ color: theme.muted, paddingVertical: 36, textAlign: 'center' }}>
          Belum ada data telemetry dari ESP32.
        </Text>
      )}

      <View style={styles.xLabelRow}>
        {xLabels.map((label, index) => (
          <Text key={`${label}-${index}`} style={{ fontSize: 12, color: theme.muted }}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function TankCard({
  theme,
  waterLevel,
  pumpStatusRead,
  lastUpdate,
}: {
  theme: Theme;
  waterLevel: number | null;
  pumpStatusRead: 'ON' | 'OFF' | null;
  lastUpdate: Date | null;
}) {
  const [displayLevel, setDisplayLevel] = useState(0);

  const fillAnim = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = fillAnim.addListener(({ value }) => setDisplayLevel(Math.round(value)));
    Animated.timing(fillAnim, {
      toValue: waterLevel ?? 0,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => fillAnim.removeListener(id);
  }, [fillAnim, waterLevel]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [bobAnim]);

  const waterHeight = fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const bobY = bobAnim.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });
  const waterLevelLabel =
    waterLevel === null ? 'Menunggu data' : waterLevel >= 90 ? 'PENUH' : waterLevel >= 50 ? 'SEDANG' : 'RENDAH';
  const waterLevelColor =
    waterLevel === null ? theme.muted : waterLevel < MIN_LEVEL ? theme.warning : theme.success;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.cardTitle }]}>Toren dan pompa</Text>

      <View style={styles.tankRow}>
        <View style={[styles.tank, { backgroundColor: theme.tank, borderColor: theme.tankBorder }]}>
          <Animated.View style={[styles.water, { height: waterHeight, backgroundColor: theme.waterLevel }]}>
            <Animated.View style={[styles.waterSurface, { transform: [{ translateY: bobY }] }]} />
          </Animated.View>
          {/* Penanda batas minimum dan maksimum */}
          <View pointerEvents="none" style={[styles.limitLine, { bottom: `${MIN_LEVEL}%`, borderColor: theme.danger }]} />
          <View pointerEvents="none" style={[styles.limitLine, { bottom: `${MAX_LEVEL}%`, borderColor: theme.warning }]} />
        </View>

        <View style={styles.levelInfo}>
          <Text style={[styles.waterLevel, { color: theme.waterLevel }]}>
            {waterLevel === null ? '--' : `${displayLevel}%`}
          </Text>
          <Text style={[styles.statusText, { color: waterLevelColor }]}>{waterLevelLabel}</Text>
        </View>
      </View>

      <View style={[styles.divider, { borderTopColor: theme.border }]}>
        <View style={styles.pumpRow}>
          <Text style={{ fontSize: 13, color: theme.text, flex: 1 }}>
            Status pompa: {pumpStatusRead ?? '--'}
          </Text>
          {lastUpdate && (
            <Text style={{ fontSize: 12, color: theme.muted }}>
              {lastUpdate.toLocaleTimeString('id-ID')}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

/* ----------------------------- SAKLAR MODE TEMA ----------------------------- */
const TOGGLE_W = 56;
const TOGGLE_H = 28;
const KNOB = 22;

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isDark ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // warna dan posisi left tidak mendukung native driver
    }).start();
  }, [isDark, anim]);

  const knobX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, TOGGLE_W - KNOB - 3] });
  const trackColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#FBE8A6', '#0C3047'] });
  const knobColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#F0C23B', '#29B0F0'] });
  const sunOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const moonOpacity = anim;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel="Ganti mode tampilan"
    >
      <Animated.View style={[styles.toggleTrack, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.toggleKnob, { left: knobX, backgroundColor: knobColor }]}>
          {/* Ikon matahari */}
          <Animated.View style={[styles.iconBox, { opacity: sunOpacity }]}>
            <View style={styles.sunCore} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <View key={deg} style={[styles.sunRayWrap, { transform: [{ rotate: `${deg}deg` }] }]}>
                <View style={styles.sunRay} />
              </View>
            ))}
          </Animated.View>

          {/* Ikon bulan sabit */}
          <Animated.View style={[styles.iconBox, { opacity: moonOpacity }]}>
            <View style={styles.moonBody} />
            <Animated.View style={[styles.moonCut, { backgroundColor: knobColor }]} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ------------------------------- HALAMAN UTAMA ------------------------------ */
function DashboardApp() {
  const [isDark, setIsDark] = useState(false);
  const { logs, isLoading, error } = useTelemetry();
  const [now, setNow] = useState(Date.now());
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), SENSOR_HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, []);

  const latestLog = logs[0];
  const waterLevel = latestLog
    ? latestLog.sensor90Percent
      ? 90
      : latestLog.sensor20Percent
        ? 20
        : latestLog.legacySensor50Percent
          ? 50
          : 10
    : null;
  const sensorOnline =
    latestLog !== undefined && now - latestLog.timestamp <= SENSOR_HEARTBEAT_MS * 2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.header} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <Text style={styles.headerTitle}>Smart Water Tank 🚰</Text>
        <View style={styles.themeToggleWrap}>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
        </View>
      </View>

      <ScrollView
        style={styles.dashboardScrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.wrapper}>
          {/* Baris status */}
          <View style={styles.statusRow}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Toren utama, Gedung A</Text>
            <View style={[styles.chip, { backgroundColor: sensorOnline ? theme.chip : theme.border }]}>
              <Text style={{ fontSize: 12, color: sensorOnline ? theme.chipText : theme.cardTitle, fontWeight: '600' }}>
                {sensorOnline ? 'Sensor online' : latestLog ? 'Data terlambat' : isLoading ? 'Memuat data' : 'Menunggu data'}
              </Text>
            </View>
          </View>

          {error && (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.danger }]}>
              <Text style={{ color: theme.danger, fontSize: 13 }}>{error}</Text>
            </View>
          )}

          {/* Kartu metrik */}
          <View style={styles.metricGrid}>
            <MetricCard
              theme={theme}
              label="Level air"
              value={waterLevel === null ? '--' : `${waterLevel}%`}
              sub={latestLog ? 'Estimasi dari sensor bertingkat' : 'Belum ada data'}
              subColor={waterLevel !== null && waterLevel >= 50 ? theme.success : theme.warning}
            />
            <MetricCard
              theme={theme}
              label="Sensor 20%"
              value={latestLog ? (latestLog.sensor20Percent ? 'AKTIF' : 'NONAKTIF') : '--'}
              sub="Status terakhir"
            />
            <MetricCard
              theme={theme}
              label="Sensor 90%"
              value={latestLog ? (latestLog.sensor90Percent ? 'AKTIF' : 'NONAKTIF') : '--'}
              sub="Status terakhir"
            />
            <MetricCard
              theme={theme}
              label="Status pompa"
              value={latestLog?.pumpStatusRead ?? '--'}
              sub="Dari telemetry ESP32"
              subColor={latestLog?.pumpStatusRead === 'ON' ? theme.success : theme.muted}
            />
          </View>

          {/* Grafik + toren (berdampingan di layar lebar, bertumpuk di HP) */}
          <View style={[styles.midRow, { flexDirection: isWide ? 'row' : 'column' }]}>
            <View style={{ flex: isWide ? 2 : undefined }}>
              <HistoryChart theme={theme} logs={logs} />
            </View>
            <View style={{ flex: isWide ? 1 : undefined }}>
              <TankCard
                theme={theme}
                waterLevel={waterLevel}
                pumpStatusRead={latestLog?.pumpStatusRead ?? null}
                lastUpdate={latestLog ? new Date(latestLog.timestamp) : null}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* --------------------------------- STYLES ---------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  themeToggleWrap: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  toggleTrack: { width: TOGGLE_W, height: TOGGLE_H, borderRadius: TOGGLE_H / 2, justifyContent: 'center' },
  toggleKnob: {
    position: 'absolute',
    top: (TOGGLE_H - KNOB) / 2,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: { position: 'absolute', width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  sunCore: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FFFFFF' },
  sunRayWrap: { position: 'absolute', width: 16, height: 16, alignItems: 'center' },
  sunRay: { width: 1.6, height: 2.6, borderRadius: 1, backgroundColor: '#FFFFFF' },
  moonBody: { position: 'absolute', left: 1, top: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF' },
  moonCut: { position: 'absolute', left: 6, top: -1, width: 10, height: 10, borderRadius: 5 },

  scrollContent: { padding: 20 },
  dashboardScrollView: { flex: 1 },
  wrapper: { width: '100%', maxWidth: 1100, alignSelf: 'center', gap: 12 },

  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: {
    flexGrow: 1,
    flexBasis: 150,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricLabel: { fontSize: 13 },
  metricValue: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  metricSub: { fontSize: 12, marginTop: 2 },

  midRow: { gap: 12 },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2, // Bayangan khusus Android
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },

  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },

  chartArea: { height: 130, flexDirection: 'row', alignItems: 'flex-end' },
  xLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },

  tankRow: { flexDirection: 'row', alignItems: 'center' },
  tank: {
    width: 70,
    height: 130,
    borderWidth: 3,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  water: { width: '100%' },
  waterSurface: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  limitLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed' },
  levelInfo: { flex: 1, marginLeft: 16 },
  waterLevel: { fontSize: 40, fontWeight: 'bold', textAlign: 'center' },
  statusText: { fontSize: 13, textAlign: 'center', fontWeight: '500', marginTop: 4 },

  divider: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  modeRow: { flexDirection: 'row', gap: 6 },
  pumpRow: { flexDirection: 'row', alignItems: 'center' },

  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  alertIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => observeAuthState(
    (nextUser) => {
      setUser(nextUser);
      setAuthError(null);
      setAuthLoading(false);
    },
    (error) => {
      setAuthError(error.message);
      setAuthLoading(false);
    },
  ), []);

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={{ color: '#4B5563', marginTop: 12 }}>Memeriksa sesi akun...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1 }}>
        {authError && (
          <Text accessibilityRole="alert" style={{ color: '#B91C1C', padding: 12 }}>
            Gagal memeriksa sesi: {authError}
          </Text>
        )}
        <AuthScreen />
      </View>
    );
  }

  return (
    <NotificationCenter user={user} onSignOut={signOut}>
      <DashboardApp />
      <DemoControlPanel />
    </NotificationCenter>
  );
}