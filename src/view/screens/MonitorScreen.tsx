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

export const MonitorScreen = () => {
  const {
    sensorData,
    waterLevel,
    isConnected,
    isLoading,
    error,
    lastUpdate,
    isCriticalOverflow,
  } = useTankMonitor();

  const getWaterAdvice = () => {
    if (isCriticalOverflow) {
      return '⚠️ Segera matikan pompa! Sensor 90% aktif dan pompa masih menyala.';
    }
    if (waterLevel === 'FULL') {
      return '💡 Level air sudah penuh. Pastikan pompa dalam kondisi OFF.';
    }
    if (waterLevel === 'MEDIUM') {
      return '💡 Level air sedang. Pompa akan menyala saat level rendah.';
    }
    return '💡 Level air rendah. Pastikan pompa berfungsi dengan baik.';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Memuat data sensor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monitor Real-time</Text>
        <View style={[styles.connectionBadge, isConnected ? styles.connected : styles.disconnected]}>
          <Text style={styles.connectionText}>
            {isConnected ? '🟢' : '🔴'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {error && <Text style={styles.advice}>{error}</Text>}
        {/* Critical Alert */}
        {isCriticalOverflow && (
          <View style={styles.criticalAlert}>
            <Text style={styles.criticalAlertText}>
              🚨 CRITICAL OVERFLOW DETECTED
            </Text>
            <Text style={styles.criticalAlertSubtext}>
              Air {'>='} 90%, Pompa ON
            </Text>
          </View>
        )}

        {/* Tank Visualization */}
        <View style={styles.tankCard}>
          <Text style={styles.sectionTitle}>Visualisasi Tangki</Text>
          <View style={styles.tankCenter}>
            <TankVisual level={waterLevel} size="large" />
          </View>
          <Text style={styles.advice}>{getWaterAdvice()}</Text>
        </View>

        {/* Current Values */}
        <View style={styles.valuesCard}>
          <Text style={styles.sectionTitle}>Nilai Sensor Saat Ini</Text>
          
          <View style={styles.valueGrid}>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Sensor 20%</Text>
              <View style={[styles.valueBadge, sensorData.sensor20Percent && styles.valueOn]}>
                <Text style={[styles.valueText, sensorData.sensor20Percent && styles.valueTextOn]}>
                  {sensorData.sensor20Percent ? 'AKTIF' : 'NONAKTIF'}
                </Text>
              </View>
            </View>
            
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Sensor 90%</Text>
              <View style={[styles.valueBadge, sensorData.sensor90Percent && styles.valueOn]}>
                <Text style={[styles.valueText, sensorData.sensor90Percent && styles.valueTextOn]}>
                  {sensorData.sensor90Percent ? 'AKTIF' : 'NONAKTIF'}
                </Text>
              </View>
            </View>
            
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Pompa</Text>
              <View style={[styles.valueBadge, sensorData.pumpStatusRead === 'ON' && styles.valueOn]}>
                <Text style={[styles.valueText, sensorData.pumpStatusRead === 'ON' && styles.valueTextOn]}>
                  {sensorData.pumpStatusRead}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Last Update */}
        {lastUpdate && (
          <View style={styles.updateInfo}>
            <Text style={styles.updateText}>
              🕐 Update terakhir: {lastUpdate.toLocaleString('id-ID')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#757575',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0288D1',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  connectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  disconnected: {
    backgroundColor: 'rgba(255,0,0,0.3)',
  },
  connectionText: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  criticalAlert: {
    backgroundColor: '#C62828',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  criticalAlertText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  criticalAlertSubtext: {
    color: '#FFCDD2',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  tankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 16,
  },
  tankCenter: {
    alignItems: 'center',
    marginVertical: 20,
  },
  advice: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  controlInfo: {
    flex: 1,
  },
  pinLabel: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 4,
  },
  sensorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 4,
  },
  sensorDesc: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  toggleOn: {
    backgroundColor: '#4CAF50',
  },
  toggleOff: {
    backgroundColor: '#9E9E9E',
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  valuesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  valueGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  valueItem: {
    flex: 1,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  valueBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  valueOn: {
    backgroundColor: '#E8F5E9',
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  valueTextOn: {
    color: '#4CAF50',
  },
  updateInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  updateText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
});

export default MonitorScreen;
