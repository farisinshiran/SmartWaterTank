/**
 * DemoControlPanel — SmartWaterTank Demo Overlay
 *
 * Provides a floating control panel for demonstrating all app features
 * without requiring a real ESP32 sensor. Accessible via the floating
 * "DEMO" button in the bottom-right corner of the screen.
 *
 * Features demonstrated:
 *   ✓ Dashboard — real-time telemetry display
 *   ✓ History   — historical chart with sensor states
 *   ✓ Notifications — sample alerts and push test
 *   ✗ AI Chat  — requires Olagon API key (service unavailable)
 *   ✗ Incidents — incident resolution needs full Firebase permissions
 *   ✗ Monitor   — alternate view (partial implementation)
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

// ── SCENARIO DEFINITIONS ───────────────────────────────────────────────────────
type Scenario = {
  id: string;
  label: string;
  desc: string;
  sensor20: boolean;
  sensor90: boolean;
  pump: 'ON' | 'OFF';
  color: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: 'empty',
    label: '🚰 Toren Kosong',
    desc: 'Sensor 20% & 90% = OFF, Pompa OFF — level < 20%',
    sensor20: false,
    sensor90: false,
    pump: 'OFF',
    color: '#EF4444',
  },
  {
    id: 'filling',
    label: '💧 Sedang Mengisi',
    desc: 'Sensor 20% = ON (level ~20-90%), Pompa OFF',
    sensor20: true,
    sensor90: false,
    pump: 'OFF',
    color: '#3B82F6',
  },
  {
    id: 'pump_on',
    label: '⚡ Pompa Menyala',
    desc: 'Sensor 20% = ON, Pompa ON — air naik ke 90%',
    sensor20: true,
    sensor90: false,
    pump: 'ON',
    color: '#F59E0B',
  },
  {
    id: 'full',
    label: '🔵 Toren Penuh',
    desc: 'Sensor 20% = ON, Sensor 90% = ON, Pompa OFF',
    sensor20: true,
    sensor90: true,
    pump: 'OFF',
    color: '#10B981',
  },
  {
    id: 'overflow',
    label: '🚨 OVERFLOW!',
    desc: 'Sensor 90% = ON + Pompa = ON ⚠️ — kondisi kritis',
    sensor20: true,
    sensor90: true,
    pump: 'ON',
    color: '#DC2626',
  },
  {
    id: 'draining',
    label: '📉 Toren Mengalir',
    desc: 'Level turun, Sensor 90% OFF duluan',
    sensor20: false,
    sensor90: true,
    pump: 'OFF',
    color: '#8B5CF6',
  },
];

// ── FIREBASE REST API WRITE (cross-platform, no SDK needed) ─────────────────
async function writeTelemetryRest(
  sensor20: boolean,
  sensor90: boolean,
  pump: 'ON' | 'OFF',
): Promise<void> {
  const timestamp = Date.now();
  const tankId = 'toren-gedung-a-01';
  const projectId = 'smart-water-tank-e49d6';
  const databaseId = '(default)';

  // Use Firestore REST API — works on native AND web without any Firebase SDK import
  const docId = `demo_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;
  const url =
    `https://firestore.googleapis.com/v1/` +
    `projects/${projectId}/databases/${databaseId}/documents/telemetry_logs/${docId}`;

  const body = {
    fields: {
      tankId: { stringValue: tankId },
      sensor20Percent: { booleanValue: sensor20 },
      sensor50Percent: { booleanValue: !sensor20 && !sensor90 },
      sensor90Percent: { booleanValue: sensor90 },
      pumpStatusRead: { stringValue: pump },
      createdAt: { integerValue: timestamp },
    },
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore REST error ${res.status}: ${text}`);
  }
}

// ── DEMO BUTTON COMPONENT ─────────────────────────────────────────────────────
function ScenarioButton({
  scenario,
  onPress,
}: {
  scenario: Scenario;
  onPress: (s: Scenario) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.scenarioBtn, { borderLeftColor: scenario.color }]}
      onPress={() => onPress(scenario)}
      activeOpacity={0.7}
    >
      <Text style={styles.scenarioBtnLabel}>{scenario.label}</Text>
      <Text style={styles.scenarioBtnDesc}>{scenario.desc}</Text>
    </TouchableOpacity>
  );
}

// ── ARCHITECTURE DIAGRAM ──────────────────────────────────────────────────────
function ArchitectureDiagram() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  type Node = {
    id: string;
    label: string;
    sublabel: string;
    icon: string;
    color: string;
    description: string;
  };

  const NODES: Node[] = [
    {
      id: 'esp32',
      label: 'ESP32',
      sublabel: 'XKC-Y25-V',
      icon: '🔧',
      color: '#6D28D9',
      description:
        'Mikrokontroler IoT. Membaca sensor ultrasonic/kapasitif, menghitung level air, mengirim data via WiFi ke Firebase setiap 30 detik.',
    },
    {
      id: 'rtdb',
      label: 'Firebase RTDB',
      sublabel: 'Realtime Database',
      icon: '🔥',
      color: '#F59E0B',
      description:
        'Database real-time untuk data sensor terbaru (latest snapshot) dan log telemetry. Mendukung onValue listener untuk update < 100ms.',
    },
    {
      id: 'firestore',
      label: 'Cloud Firestore',
      sublabel: 'History Collection',
      icon: '📁',
      color: '#10B981',
      description:
        ' Menyimpan 30 log telemetry terbaru dengan timestamp. Diakses oleh HistoryScreen dan useTelemetry hook via onSnapshot.',
    },
    {
      id: 'functions',
      label: 'Cloud Functions',
      sublabel: 'Node.js / Asia-SE1',
      icon: '⚙️',
      color: '#EF4444',
      description:
        'Backend serverless: trigger onWrite di Firestore, evaluasi level air, buat incident, kirim push notification ke perangkat terdaftar via FCM.',
    },
    {
      id: 'rnapp',
      label: 'React Native App',
      sublabel: 'Android / iOS / Web',
      icon: '📱',
      color: '#3B82F6',
      description:
        'Clean Architecture: UI Layer (screens, hooks) → Domain Layer (models, services) → Data Layer (repositories, Firebase SDK). Single codebase.',
    },
    {
      id: 'user',
      label: 'Pengguna',
      sublabel: 'Monitoring Dashboard',
      icon: '👤',
      color: '#8B5CF6',
      description:
        'Melihat dashboard level air, riwayat, dan notifikasi. Bisa mengaktifkan/menonaktifkan alarm dan menerima push notification.',
    },
  ];

  // Define connections between nodes
  const CONNECTIONS = [
    { from: 'esp32', to: 'rtdb', label: 'HTTP PUT' },
    { from: 'rtdb', to: 'rnapp', label: 'onValue' },
    { from: 'firestore', to: 'rnapp', label: 'onSnapshot' },
    { from: 'functions', to: 'firestore', label: 'onWrite' },
    { from: 'functions', to: 'user', label: 'FCM Push' },
  ];

  const getNode = (id: string) => NODES.find(n => n.id === id)!;

  const color = '#1E293B';

  return (
    <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.archTitle}>Arsitektur Sistem</Text>
      <Text style={styles.archSubtitle}>
        Telusuri alur satu nilai sensor dari ESP32 sampai ke layar pengguna
      </Text>

      {/* Row 1: ESP32 → RTDB → Firestore */}
      <View style={styles.archRow}>
        {['esp32', 'rtdb', 'firestore'].map((id, idx) => {
          const node = getNode(id);
          const isSelected = selectedNode === id;
          return (
            <React.Fragment key={id}>
              <TouchableOpacity
                style={[
                  styles.archNode,
                  { backgroundColor: node.color },
                  isSelected && styles.archNodeSelected,
                ]}
                onPress={() => setSelectedNode(isSelected ? null : id)}
                activeOpacity={0.8}
              >
                <Text style={styles.archNodeIcon}>{node.icon}</Text>
                <Text style={styles.archNodeLabel}>{node.label}</Text>
                <Text style={styles.archNodeSub}>{node.sublabel}</Text>
              </TouchableOpacity>
              {idx < 2 && (
                <View style={styles.archArrow}>
                  <Text style={styles.archArrowText}>→</Text>
                  <Text style={styles.archArrowLabel}>
                    {CONNECTIONS[idx]?.label}
                  </Text>
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Down arrow */}
      <View style={styles.archDownArrow}>
        <Text style={styles.archDownText}>↓</Text>
        <Text style={styles.archArrowLabel}>triggers</Text>
      </View>

      {/* Row 2: Functions */}
      <View style={styles.archRowCenter}>
        {['functions'].map(id => {
          const node = getNode(id);
          return (
            <TouchableOpacity
              key={id}
              style={[styles.archNode, { backgroundColor: node.color, width: 160 }]}
              onPress={() => setSelectedNode(selectedNode === id ? null : id)}
              activeOpacity={0.8}
            >
              <Text style={styles.archNodeIcon}>{node.icon}</Text>
              <Text style={styles.archNodeLabel}>{node.label}</Text>
              <Text style={styles.archNodeSub}>{node.sublabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Arrows down */}
      <View style={styles.archRow}>
        <View style={{ flex: 1 }} />
        <View style={styles.archArrow}>
          <Text style={styles.archDownText}>↓</Text>
          <Text style={styles.archArrowLabel}>FCM</Text>
        </View>
        <View style={{ flex: 1 }} />
      </View>

      {/* Row 3: RN App → User */}
      <View style={styles.archRow}>
        {['rnapp', 'user'].map((id, idx) => {
          const node = getNode(id);
          return (
            <React.Fragment key={id}>
              <TouchableOpacity
                style={[
                  styles.archNode,
                  { backgroundColor: node.color },
                  selectedNode === id && styles.archNodeSelected,
                ]}
                onPress={() => setSelectedNode(selectedNode === id ? null : id)}
                activeOpacity={0.8}
              >
                <Text style={styles.archNodeIcon}>{node.icon}</Text>
                <Text style={styles.archNodeLabel}>{node.label}</Text>
                <Text style={styles.archNodeSub}>{node.sublabel}</Text>
              </TouchableOpacity>
              {idx === 0 && (
                <View style={styles.archArrow}>
                  <Text style={styles.archArrowText}>→</Text>
                  <Text style={styles.archArrowLabel}>renders</Text>
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Selected node description */}
      {selectedNode && (
        <View style={styles.archDetail}>
          <Text style={styles.archDetailTitle}>
            {getNode(selectedNode).icon} {getNode(selectedNode).label}
          </Text>
          <Text style={styles.archDetailDesc}>
            {getNode(selectedNode).description}
          </Text>
          <TouchableOpacity
            style={styles.archDetailClose}
            onPress={() => setSelectedNode(null)}
          >
            <Text style={styles.archDetailCloseText}>✕ Tutup</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Data flow trace example */}
      <View style={styles.traceBox}>
        <Text style={styles.traceTitle}>🔍 Telusuri Nilai Sensor 90%</Text>
        <Text style={styles.traceStep}>
          <Text style={styles.traceNum}>1.</Text>{' '}
          <Text style={[styles.traceComponent, { color: '#6D28D9' }]}>ESP32</Text>{' '}
          mendeteksi air触碰 sensor kapasitif → sensor90Percent = true
        </Text>
        <Text style={styles.traceStep}>
          <Text style={styles.traceNum}>2.</Text>{' '}
          <Text style={[styles.traceComponent, { color: '#F59E0B' }]}>Firebase RTDB</Text>{' '}
          ESP32 PUT /tanks/toren-gedung-a-01/sensors/latest → listener langsung
          memicu
        </Text>
        <Text style={styles.traceStep}>
          <Text style={styles.traceNum}>3.</Text>{' '}
          <Text style={[styles.traceComponent, { color: '#3B82F6' }]}>useTankMonitor</Text>{' '}
          hook menerima update, waterLevel dihitung → 'FULL'
        </Text>
        <Text style={styles.traceStep}>
          <Text style={styles.traceNum}>4.</Text>{' '}
          <Text style={[styles.traceComponent, { color: '#3B82F6' }]}>DashboardApp</Text>{' '}
          TankCard animasi fill ke 90%, MetricCard menampilkan '90%'
        </Text>
        <Text style={styles.traceStep}>
          <Text style={styles.traceNum}>5.</Text>{' '}
          <Text style={[styles.traceComponent, { color: '#EF4444' }]}>Cloud Functions</Text>{' '}
          onWrite trigger → incident OVERFLOW dibuat → FCM push dikirim
        </Text>
        <Text style={styles.traceStep}>
          <Text style={styles.traceNum}>6.</Text>{' '}
          <Text style={[styles.traceComponent, { color: '#8B5CF6' }]}>NotificationCenter</Text>{' '}
          menerima push, menampilkan 'Peringatan potensi meluap' dengan
          tombol "Akui"
        </Text>
      </View>
    </ScrollView>
  );
}

// ── FEATURE STATUS ────────────────────────────────────────────────────────────
function FeatureStatus() {
  type Feature = {
    id: string;
    name: string;
    icon: string;
    status: 'working' | 'partial' | 'broken';
    detail: string;
    reason?: string;
  };

  const features: Feature[] = [
    {
      id: 'auth',
      name: 'Autentikasi',
      icon: '🔐',
      status: 'working',
      detail: 'Sign in / Sign up berfungsi dengan Firebase Auth.',
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: '📊',
      status: 'working',
      detail: 'Metrik sensor, tank visual, dan status pompa实时更新.',
    },
    {
      id: 'history',
      name: 'Riwayat',
      icon: '📈',
      status: 'working',
      detail: 'Chart riwayat level air dari telemetry_logs Firestore.',
    },
    {
      id: 'notifications',
      name: 'Notifikasi',
      icon: '🔔',
      status: 'partial',
      detail: 'Alarm toggle & notifikasi dalam-app berfungsi. Push notification memerlukan perangkat fisik.',
      reason: 'FCM push memerlukan build APK langsung (bukan Expo) + perangkat fisik. Simulator/Emulator tidak menerima push.',
    },
    {
      id: 'tank-membership',
      name: 'Keanggotaan Toren',
      icon: '👥',
      status: 'partial',
      detail: 'Pengguna harus didaftarkan di tank_members oleh admin.',
      reason: 'Demo UID tidak cocok dengan UID hasil Firebase Auth. Perlu dicek manual.',
    },
    {
      id: 'incidents',
      name: 'Incident Management',
      icon: '🚨',
      status: 'partial',
      detail: 'Cloud Functions membuat incident otomatis. Screen menampilkan incident.',
      reason: 'Tombol "Akui" perlu write permission ke Firestore dari client.',
    },
    {
      id: 'ai-chat',
      name: 'AI Chat Assistant',
      icon: '🤖',
      status: 'broken',
      detail: 'Screen Chat tersedia tapi koneksi ke Olagon API belum dikonfigurasi.',
      reason: 'Olagon API key belum diset di environment. Fitur ini menunggu integrasi backend.',
    },
    {
      id: 'monitor',
      name: 'Monitor Screen',
      icon: '📡',
      status: 'partial',
      detail: 'Screen alternatif menggunakan SensorRepository + TankVisual.',
      reason: 'Data dari Realtime Database vs Firestore — perlu disinkronkan.',
    },
  ];

  const statusColor = (s: Feature['status']) => {
    if (s === 'working') return '#10B981';
    if (s === 'partial') return '#F59E0B';
    return '#EF4444';
  };
  const statusLabel = (s: Feature['status']) => {
    if (s === 'working') return '✅ Berfungsi';
    if (s === 'partial') return '⚠️ Parsial';
    return '❌ Belum Tersedia';
  };

  return (
    <View>
      <Text style={styles.featTitle}>Status Fitur</Text>
      {features.map(f => (
        <View key={f.id} style={styles.featRow}>
          <Text style={styles.featIcon}>{f.icon}</Text>
          <View style={styles.featInfo}>
            <View style={styles.featNameRow}>
              <Text style={styles.featName}>{f.name}</Text>
              <Text style={[styles.featStatus, { color: statusColor(f.status) }]}>
                {statusLabel(f.status)}
              </Text>
            </View>
            <Text style={styles.featDetail}>{f.detail}</Text>
            {f.reason && (
              <Text style={styles.featReason}>📝 {f.reason}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

// ── MAIN PANEL ───────────────────────────────────────────────────────────────
export function DemoControlPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'arch' | 'status'>('scenarios');
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const openPanel = () => {
    setIsOpen(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 55,
      friction: 10,
    }).start();
  };

  const closePanel = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const triggerScenario = useCallback(async (scenario: Scenario) => {
    setLoading(true);
    try {
      await writeTelemetryRest(scenario.sensor20, scenario.sensor90, scenario.pump);
      Alert.alert(
        `✅ ${scenario.label}`,
        `Data telemetry dikirim: sensor20=${scenario.sensor20}, sensor90=${scenario.sensor90}, pump=${scenario.pump}\n\nBuka tab Dashboard untuk melihat update visual.`,
        [{ text: 'OK' }],
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('❌ Gagal mengirim data', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const injectHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Inject 5 historical entries with decreasing timestamps
      for (let i = 5; i >= 1; i--) {
        const state = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
        await writeTelemetryRest(state.sensor20, state.sensor90, state.pump);
        // Small delay between writes
        await new Promise(r => setTimeout(r, 200));
      }
      Alert.alert(
        '✅ Riwayat Diperbarui',
        '5 data telemetry terbaru ditambahkan. Buka tab Riwayat untuk melihat chart.',
        [{ text: 'OK' }],
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('❌ Gagal', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const panelTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const panelOpacity = slideAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.3, 1],
  });

  return (
    <>
      {/* Floating DEMO Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openPanel}
        activeOpacity={0.85}
        accessibilityLabel="Buka panel demo"
      >
        <Text style={styles.fabText}>🎮</Text>
        <Text style={styles.fabLabel}>DEMO</Text>
      </TouchableOpacity>

      {/* Backdrop */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={closePanel}
      >
        <TouchableWithoutFeedback onPress={closePanel}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateY: panelTranslateY }],
              opacity: panelOpacity,
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>🎮 Panel Demo</Text>
            <TouchableOpacity onPress={closePanel} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab bar */}
          <View style={styles.tabBar}>
            {(['scenarios', 'arch', 'status'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab === 'scenarios' ? '🎛️ Skenario' : tab === 'arch' ? '🏗️ Arsitektur' : '📋 Status'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab content */}
          <View style={styles.panelBody}>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Mengirim data...</Text>
              </View>
            )}

            {activeTab === 'scenarios' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>🎛️ Simulasi Sensor</Text>
                <Text style={styles.sectionSubtitle}>
                  Klik tombol di bawah untuk mengubah state sensor.
                  Dashboard akan update secara real-time.
                </Text>

                {SCENARIOS.map(s => (
                  <ScenarioButton
                    key={s.id}
                    scenario={s}
                    onPress={triggerScenario}
                  />
                ))}

                <TouchableOpacity
                  style={styles.injectBtn}
                  onPress={injectHistory}
                  disabled={loading}
                >
                  <Text style={styles.injectBtnText}>
                    📊 Generate 5 Data Riwayat Acak
                  </Text>
                </TouchableOpacity>

                <View style={styles.hint}>
                  <Text style={styles.hintTitle}>💡 Tips Demo:</Text>
                  <Text style={styles.hintText}>
                    1. Buka tab Dashboard di samping untuk melihat animasi tank.{'\n'}
                    2. Buka tab Riwayat untuk melihat chart.{'\n'}
                    3. Kirim data "OVERFLOW" dan cek notification center.{'\n'}
                    4. Tekan lama judul header untuk toggle tema gelap/terang.
                  </Text>
                </View>
              </ScrollView>
            )}

            {activeTab === 'arch' && <ArchitectureDiagram />}

            {activeTab === 'status' && <FeatureStatus />}
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

export default DemoControlPanel;

// ── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 999,
  },
  fabText: { fontSize: 20 },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },

  // Backdrop
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // Panel
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeBtnText: { color: '#6B7280', fontSize: 14 },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  panelBody: {
    maxHeight: 480,
  },

  // Loading
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#3B82F6',
    fontSize: 13,
  },

  // Scenarios
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  scenarioBtn: {
    borderLeftWidth: 4,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  scenarioBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  scenarioBtnDesc: {
    fontSize: 11,
    color: '#6B7280',
  },
  injectBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  injectBtnText: {
    color: '#1D4ED8',
    fontWeight: '600',
    fontSize: 13,
  },

  // Hints
  hint: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },

  // Architecture diagram
  archTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  archSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  archRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  archRowCenter: {
    alignItems: 'center',
    marginBottom: 4,
  },
  archNode: {
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    width: 90,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  archNodeSelected: {
    elevation: 6,
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.2,
  },
  archNodeIcon: { fontSize: 22, marginBottom: 4 },
  archNodeLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  archNodeSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  archArrow: {
    alignItems: 'center',
    marginHorizontal: 2,
    width: 48,
  },
  archArrowText: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  archArrowLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
  },
  archDownArrow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  archDownText: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  archDetail: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  archDetailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  archDetailDesc: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  archDetailClose: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  archDetailCloseText: {
    color: '#6B7280',
    fontSize: 12,
  },
  traceBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  traceTitle: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  traceStep: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 18,
  },
  traceNum: {
    color: '#60A5FA',
    fontWeight: '700',
  },
  traceComponent: {
    fontWeight: '700',
  },

  // Feature status
  featTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  featRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  featIcon: { fontSize: 20, marginRight: 10, marginTop: 2 },
  featInfo: { flex: 1 },
  featNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  featName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  featStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  featDetail: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  featReason: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
