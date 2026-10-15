import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

/* ---------------------------------- DATA ---------------------------------- */
// Data dummy. Nanti ganti dengan data dari sensor (ESP32 via MQTT/HTTP/Firebase).
const WATER_LEVEL = 85; // persen
const CAPACITY_L = 1000; // liter
const MIN_LEVEL = 20; // pompa otomatis nyala di bawah level ini
const MAX_LEVEL = 95; // pompa otomatis mati di atas level ini
const FLOW_L_PER_MIN = 0.8; // debit keluar saat ini

const HISTORY = {
  h1: {
    label: '1 jam',
    xLabels: ['-60 mnt', '-30 mnt', 'Sekarang'],
    data: [88, 88, 87, 87, 87, 86, 86, 86, 85, 85, 85, 85],
  },
  h24: {
    label: '24 jam',
    xLabels: ['-24 jam', '-12 jam', 'Sekarang'],
    data: [62, 57, 52, 47, 42, 38, 34, 52, 74, 92, 95, 93, 91, 89, 88, 86, 84, 82, 79, 77, 81, 84, 86, 85],
  },
  d7: {
    label: '7 hari',
    xLabels: ['-7 hari', '-3,5 hari', 'Sekarang'],
    data: [90, 72, 55, 38, 92, 74, 56, 40, 94, 75, 58, 41, 95, 77, 59, 42, 93, 76, 57, 40, 92, 73, 55, 38, 90, 88, 86, 85],
  },
};
type RangeKey = keyof typeof HISTORY;

const ALERTS = [
  { type: 'warning', text: 'Level turun 6% dalam 30 menit, periksa kemungkinan kebocoran', time: '14:20' },
  { type: 'success', text: 'Pompa otomatis mati di level 95%', time: '11:05' },
  { type: 'info', text: 'Kalibrasi sensor selesai', time: 'Kemarin' },
] as const;

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

function HistoryChart({ theme }: { theme: Theme }) {
  const [range, setRange] = useState<RangeKey>('h24');
  const { data, xLabels } = HISTORY[range];

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeaderRow}>
        <Text style={[styles.cardTitle, { color: theme.cardTitle }]}>Riwayat level air</Text>
        <View style={styles.tabRow}>
          {(Object.keys(HISTORY) as RangeKey[]).map((key) => {
            const active = key === range;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setRange(key)}
                style={[
                  styles.tab,
                  { borderColor: active ? theme.waterLevel : theme.border },
                  active && { backgroundColor: theme.background },
                ]}
              >
                <Text style={{ fontSize: 12, color: active ? theme.waterLevel : theme.cardTitle, fontWeight: '600' }}>
                  {HISTORY[key].label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Grafik batang sederhana (tanpa library tambahan) */}
      <View style={styles.chartArea}>
        {data.map((v, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              marginHorizontal: 1,
              height: `${v}%`,
              backgroundColor: v < MIN_LEVEL ? theme.danger : theme.waterLevel,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            }}
          />
        ))}
        {/* Garis batas minimum */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${MIN_LEVEL}%`,
            borderTopWidth: 1,
            borderStyle: 'dashed',
            borderColor: theme.danger,
          }}
        />
      </View>
      <Text style={{ fontSize: 11, color: theme.danger, marginTop: 4 }}>Garis putus-putus: batas minimum {MIN_LEVEL}%</Text>

      <View style={styles.xLabelRow}>
        {xLabels.map((l) => (
          <Text key={l} style={{ fontSize: 12, color: theme.muted }}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

function TankCard({ theme }: { theme: Theme }) {
  const [displayLevel, setDisplayLevel] = useState(0);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [manualOn, setManualOn] = useState(false);

  const fillAnim = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = fillAnim.addListener(({ value }) => setDisplayLevel(Math.round(value)));

    Animated.timing(fillAnim, {
      toValue: WATER_LEVEL,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    return () => fillAnim.removeListener(id);
  }, [fillAnim, bobAnim]);

  const waterHeight = fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const bobY = bobAnim.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });

  const pumpOn = mode === 'auto' ? WATER_LEVEL < MIN_LEVEL : manualOn;
  const pumpText =
    mode === 'auto'
      ? pumpOn
        ? 'Pompa menyala (otomatis)'
        : 'Pompa mati (otomatis)'
      : pumpOn
      ? 'Pompa menyala (manual)'
      : 'Pompa mati (manual)';

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
          <Text style={[styles.waterLevel, { color: theme.waterLevel }]}>{displayLevel}%</Text>
          <Text style={[styles.statusText, { color: theme.success }]}>Kondisi: Aman / Cukup</Text>
        </View>
      </View>

      <View style={[styles.divider, { borderTopColor: theme.border }]}>
        <View style={styles.modeRow}>
          {(['auto', 'manual'] as const).map((m) => {
            const active = m === mode;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.tab,
                  { borderColor: active ? theme.waterLevel : theme.border },
                  active && { backgroundColor: theme.background },
                ]}
              >
                <Text style={{ fontSize: 12, color: active ? theme.waterLevel : theme.cardTitle, fontWeight: '600' }}>
                  {m === 'auto' ? 'Otomatis' : 'Manual'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.pumpRow}>
          <Text style={{ fontSize: 13, color: pumpOn ? theme.success : theme.text, flex: 1 }}>{pumpText}</Text>
          {mode === 'manual' && <Switch value={manualOn} onValueChange={setManualOn} />}
        </View>
      </View>
    </View>
  );
}

function AlertList({ theme }: { theme: Theme }) {
  const colorOf = (t: 'warning' | 'success' | 'info') =>
    t === 'warning' ? theme.warning : t === 'success' ? theme.success : theme.waterLevel;
  const symbolOf = (t: 'warning' | 'success' | 'info') => (t === 'warning' ? '!' : t === 'success' ? '✓' : 'i');

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.cardTitle }]}>Peringatan terbaru</Text>
      {ALERTS.map((a, i) => (
        <View key={i} style={[styles.alertRow, { borderTopColor: theme.border }]}>
          <View style={[styles.alertIcon, { backgroundColor: colorOf(a.type) }]}>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>{symbolOf(a.type)}</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 13, color: theme.text }}>{a.text}</Text>
          <Text style={{ fontSize: 12, color: theme.muted }}>{a.time}</Text>
        </View>
      ))}
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
export default function App() {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const volumeL = Math.round((WATER_LEVEL / 100) * CAPACITY_L);
  const hoursLeft = Math.round(volumeL / (FLOW_L_PER_MIN * 60));

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.wrapper}>
          {/* Baris status */}
          <View style={styles.statusRow}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Toren utama, Gedung A</Text>
            <View style={[styles.chip, { backgroundColor: theme.chip }]}>
              <Text style={{ fontSize: 12, color: theme.chipText, fontWeight: '600' }}>Sensor online</Text>
            </View>
          </View>

          {/* Kartu metrik */}
          <View style={styles.metricGrid}>
            <MetricCard theme={theme} label="Level air" value={`${WATER_LEVEL}%`} sub="Normal" subColor={theme.success} />
            <MetricCard theme={theme} label="Volume" value={`${volumeL} L`} sub={`dari ${CAPACITY_L.toLocaleString('id-ID')} L`} />
            <MetricCard theme={theme} label="Debit keluar" value={`${String(FLOW_L_PER_MIN).replace('.', ',')} L/mnt`} sub="rata-rata 0,6 L/mnt" />
            <MetricCard theme={theme} label="Estimasi habis" value={`${hoursLeft} jam`} sub="pada pemakaian saat ini" />
          </View>

          {/* Grafik + toren (berdampingan di layar lebar, bertumpuk di HP) */}
          <View style={[styles.midRow, { flexDirection: isWide ? 'row' : 'column' }]}>
            <View style={{ flex: isWide ? 2 : undefined }}>
              <HistoryChart theme={theme} />
            </View>
            <View style={{ flex: isWide ? 1 : undefined }}>
              <TankCard theme={theme} />
            </View>
          </View>

          <AlertList theme={theme} />
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