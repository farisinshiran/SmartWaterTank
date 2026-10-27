/**
 * ChatScreen — Repurposed for real-time ESP32 sensor data display
 *
 * This screen now shows live sensor data from Firestore (ESP32 source).
 * Replaces the previous AI chat feature which was removed.
 *
 * Data flow: ESP32 → Firestore → FirestoreService → SensorRepository → useTankMonitor
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTankMonitor } from '../../logic/hooks/useTankMonitor';
import { TankVisual } from '../components/TankVisual';
import { FIRESTORE_CONFIG } from '../../data/services/firestoreTypes';

const getWaterColor = (level: string) => {
  switch (level) {
    case 'FULL': return '#1565C0';
    case 'MEDIUM': return '#4FC3F7';
    case 'LOW': return '#FFA726';
    default: return '#90A4AE';
  }
};

export const ChatScreen = () => {
  const { sensorData, waterLevel, isConnected, isLoading, error, lastUpdate, isCriticalOverflow } = useTankMonitor();

  const getAdvice = () => {
    if (isCriticalOverflow) return '⚠️ OVERFLOW! Pompa masih menyala saat level >= 90%.';
    if (waterLevel === 'FULL') return '💡 Level air penuh. Pompa dalam kondisi OFF.';
    if (waterLevel === 'MEDIUM') return '💡 Level air mencapai 20%.';
    return '⚡ Level air rendah!';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Live Sensor</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Memuat data sensor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💧 Live Sensor</Text>
        <View style={[styles.statusBadge, isConnected ? styles.connected : styles.disconnected]}>
          <Text style={styles.statusText}>{isConnected ? '🟢 LIVE' : '🔴 OFFLINE'}</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {error && (
          <View style={styles.criticalAlert}>
            <Text style={styles.criticalSubtext}>{error}</Text>
          </View>
        )}
        {/* Critical Alert */}
        {isCriticalOverflow && (
          <View style={styles.criticalAlert}>
            <Text style={styles.criticalText}>🚨 CRITICAL OVERFLOW</Text>
            <Text style={styles.criticalSubtext}>Sensor 90% aktif dan pompa masih ON</Text>
          </View>
        )}

        {/* Tank Visual */}
        <View style={styles.tankCard}>
          <Text style={styles.cardTitle}>Visualisasi Toren</Text>
          <View style={styles.tankCenter}>
            <TankVisual level={waterLevel} size="large" />
          </View>
          <View style={[styles.levelBadge, { backgroundColor: getWaterColor(waterLevel) }]}>
            <Text style={styles.levelBadgeText}>
              {waterLevel === 'FULL' ? 'PENUH (90%)' :
               waterLevel === 'MEDIUM' ? 'LEVEL 20%' :
                 waterLevel === 'LOW' ? 'RENDAH (di bawah 20%)' : waterLevel}
            </Text>
          </View>
        </View>

        {/* Sensor Values */}
        <View style={styles.sensorsCard}>
          <Text style={styles.cardTitle}>Nilai Sensor</Text>
          <View style={styles.sensorGrid}>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Sensor 20%</Text>
              <View style={[styles.sensorBadge, sensorData.sensor20Percent && styles.sensorActive]}>
                <Text style={[styles.sensorBadgeText, sensorData.sensor20Percent && styles.sensorActiveText]}>
                  {sensorData.sensor20Percent ? 'AKTIF' : 'NONAKTIF'}
                </Text>
              </View>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Sensor 90%</Text>
              <View style={[styles.sensorBadge, sensorData.sensor90Percent && styles.sensorActive]}>
                <Text style={[styles.sensorBadgeText, sensorData.sensor90Percent && styles.sensorActiveText]}>
                  {sensorData.sensor90Percent ? 'AKTIF' : 'NONAKTIF'}
                </Text>
              </View>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Pompa</Text>
              <View style={[styles.sensorBadge, sensorData.pumpStatusRead === 'ON' && styles.pumpActive]}>
                <Text style={[styles.sensorBadgeText, sensorData.pumpStatusRead === 'ON' && styles.sensorActiveText]}>
                  💧 {sensorData.pumpStatusRead}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Advice */}
        <View style={styles.adviceCard}>
          <Text style={styles.adviceText}>{getAdvice()}</Text>
        </View>

        {/* Last Update */}
        {lastUpdate && (
          <View style={styles.updateInfo}>
            <Text style={styles.updateText}>
              🕐 Update: {lastUpdate.toLocaleString('id-ID')}
            </Text>
          </View>
        )}

        {/* Tank ID */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>Tank ID: {FIRESTORE_CONFIG.defaultTankId}</Text>
          <Text style={styles.infoText}>Source: ESP32 + Firebase Firestore</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0288D1' },
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0288D1',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  connected: { backgroundColor: 'rgba(76,175,80,0.3)' },
  disconnected: { backgroundColor: 'rgba(244,67,54,0.3)' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#666', fontSize: 16 },
  criticalAlert: { backgroundColor: '#C62828', borderRadius: 12, padding: 16, marginBottom: 12 },
  criticalText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  criticalSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 4 },
  tankCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  tankCenter: { alignItems: 'center', marginBottom: 12 },
  levelBadge: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  levelBadgeText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  sensorsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sensorItem: { flex: 1, minWidth: '45%', alignItems: 'center' },
  sensorLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  sensorBadge: { backgroundColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  sensorActive: { backgroundColor: '#4CAF50' },
  pumpActive: { backgroundColor: '#2196F3' },
  sensorBadgeText: { color: '#666', fontSize: 13, fontWeight: '600' },
  sensorActiveText: { color: '#fff' },
  adviceCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 14, marginBottom: 12 },
  adviceText: { color: '#1565C0', fontSize: 14, textAlign: 'center' },
  updateInfo: { alignItems: 'center', marginBottom: 8 },
  updateText: { color: '#888', fontSize: 12 },
  infoRow: { alignItems: 'center', gap: 4 },
  infoText: { color: '#aaa', fontSize: 11 },
});

export default ChatScreen;
