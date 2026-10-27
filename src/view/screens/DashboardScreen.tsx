import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTankMonitor } from '../../logic/hooks/useTankMonitor';
import { useIncidents } from '../../logic/hooks/useIncidents';
import { TankVisual } from '../components/TankVisual';
import StatusCard from '../components/StatusCard';

export const DashboardScreen = () => {
  const {
    sensorData,
    waterLevel,
    isConnected,
    isLoading: tankLoading,
    error: sensorError,
    lastUpdate,
    isCriticalOverflow,
  } = useTankMonitor();

  const {
    activeIncidents,
    isLoading: incidentsLoading,
  } = useIncidents();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (tankLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0288D1" />
          <Text style={styles.loadingText}>Memuat data tangki...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Water Tank</Text>
        <View style={[styles.connectionBadge, isConnected ? styles.connected : styles.disconnected]}>
          <Text style={styles.connectionText}>
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sensorError && (
          <View style={styles.incidentsBanner}>
            <Text style={styles.incidentsBannerText}>{sensorError}</Text>
          </View>
        )}
        {/* Critical Alert */}
        {isCriticalOverflow && (
          <View style={styles.criticalAlert}>
            <Text style={styles.criticalAlertText}>
              🚨 PERINGATAN: OVERFLOW KRITIS!
            </Text>
            <Text style={styles.criticalAlertSubtext}>
              Sensor 90% aktif dan pompa masih menyala
            </Text>
          </View>
        )}

        {/* Active Incidents Banner */}
        {activeIncidents.length > 0 && (
          <View style={styles.incidentsBanner}>
            <Text style={styles.incidentsBannerText}>
              ⚠️ {activeIncidents.length} incident aktif
            </Text>
          </View>
        )}

        {/* Main Tank Status */}
        <View style={styles.mainCard}>
          <Text style={styles.sectionTitle}>Status Tangki Utama</Text>
          <View style={styles.tankSection}>
            <TankVisual level={waterLevel} size="large" />
            
            <View style={styles.statusDetails}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Pompa:</Text>
                <View style={[
                  styles.pumpBadge,
                  sensorData.pumpStatusRead === 'ON' ? styles.pumpOn : styles.pumpOff
                ]}>
                  <Text style={[
                    styles.pumpText,
                    sensorData.pumpStatusRead === 'ON' && styles.pumpTextOn
                  ]}>
                    {sensorData.pumpStatusRead}
                  </Text>
                </View>
              </View>

              <View style={styles.sensorList}>
                <View style={styles.sensorRow}>
                  <View style={[styles.sensorDot, sensorData.sensor90Percent && styles.sensorDotOn]} />
                  <Text style={styles.sensorText}>Sensor 90% (Penuh)</Text>
                </View>
                <View style={styles.sensorRow}>
                  <View style={[styles.sensorDot, sensorData.sensor20Percent && styles.sensorDotOn]} />
                  <Text style={styles.sensorText}>Sensor 20% (Rendah)</Text>
                </View>
              </View>
            </View>
          </View>

          {lastUpdate && (
            <Text style={styles.lastUpdate}>
              Diperbarui: {lastUpdate.toLocaleTimeString('id-ID')}
            </Text>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {waterLevel === 'FULL' ? '90%' : waterLevel === 'MEDIUM' ? '20%' : '10%'}
            </Text>
            <Text style={styles.statLabel}>Level Air</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{sensorData.pumpStatusRead}</Text>
            <Text style={styles.statLabel}>Status Pompa</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeIncidents.length}</Text>
            <Text style={styles.statLabel}>Incident Aktif</Text>
          </View>
        </View>
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
    marginTop: 12,
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  incidentsBanner: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  incidentsBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 20,
  },
  tankSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statusDetails: {
    flex: 1,
    marginLeft: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    color: '#757575',
    marginRight: 8,
  },
  pumpBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pumpOn: {
    backgroundColor: '#E3F2FD',
  },
  pumpOff: {
    backgroundColor: '#F5F5F5',
  },
  pumpText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#757575',
  },
  pumpTextOn: {
    color: '#1976D2',
  },
  sensorList: {
    gap: 8,
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  sensorDotOn: {
    backgroundColor: '#4CAF50',
  },
  sensorText: {
    fontSize: 13,
    color: '#616161',
  },
  lastUpdate: {
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0288D1',
  },
  statLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 4,
  },
});

export default DashboardScreen;
