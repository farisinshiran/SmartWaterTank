import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTelemetry } from '../../logic/hooks/useTelemetry';
import { TelemetryLog, calculateWaterLevel } from '../../types';

const TelemetryItem: React.FC<{ item: TelemetryLog }> = ({ item }) => {
  const waterLevel = calculateWaterLevel(item.sensor20Percent, item.sensor90Percent);
  
  const getWaterColor = () => {
    if (waterLevel === 'FULL') return '#1565C0';
    if (waterLevel === 'MEDIUM') return '#4FC3F7';
    if (waterLevel === 'LOW') return '#FFA726';
    return '#66BB6A';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <View style={[styles.levelIndicator, { backgroundColor: getWaterColor() }]} />
        <View style={styles.itemContent}>
          <Text style={styles.itemTime}>{formatTime(item.timestamp)}</Text>
          <View style={styles.sensorRow}>
            <Text style={styles.sensorText}>
              {waterLevel === 'FULL' ? 'PENUH (90%)' :
               waterLevel === 'MEDIUM' ? 'LEVEL 20%' : 'RENDAH (<20%)'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.itemRight}>
        <View style={[
          styles.pumpBadge,
          item.pumpStatusRead === 'ON' ? styles.pumpOn : styles.pumpOff
        ]}>
          <Text style={[
            styles.pumpText,
            item.pumpStatusRead === 'ON' && styles.pumpTextOn
          ]}>
            💧 {item.pumpStatusRead}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const HistoryScreen = () => {
  const { logs, isLoading, error } = useTelemetry(50);
  const [refreshing, setRefreshing] = React.useState(false);

  // Firestore onSnapshot provides real-time updates automatically.
  // Pull-to-refresh only triggers a visual feedback indicator.
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Data updates automatically via Firestore onSnapshot
    // Brief delay for visual feedback
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>Belum Ada Data</Text>
      <Text style={styles.emptyText}>
        Data telemetry akan muncul di sini setelah ada aktivitas sensor
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Telemetry</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{logs.length} data</Text>
        </View>
      </View>

      {/* Stats Summary */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {logs.filter(l => l.sensor90Percent).length}
          </Text>
          <Text style={styles.statLabel}>Full Events</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {logs.filter(l => l.pumpStatusRead === 'ON').length}
          </Text>
          <Text style={styles.statLabel}>Pompa ON</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {logs.length > 0 ? logs.length : '-'}
          </Text>
          <Text style={styles.statLabel}>Total Log</Text>
        </View>
      </View>

      {/* Telemetry List */}
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TelemetryItem item={item} />}
        ListEmptyComponent={!isLoading ? renderEmpty : undefined}
        contentContainerStyle={logs.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          logs.length > 0 ? (
            <Text style={styles.listHeader}>
              Data terbaru di atas
            </Text>
          ) : undefined
        }
      />

      {/* Loading Overlay */}
      {isLoading && logs.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0288D1" />
          <Text style={styles.loadingText}>Memuat riwayat...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#B71C1C',
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  listHeader: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTime: {
    fontSize: 13,
    color: '#424242',
    fontWeight: '500',
  },
  sensorRow: {
    marginTop: 4,
  },
  sensorText: {
    fontSize: 12,
    color: '#757575',
  },
  itemRight: {
    marginLeft: 12,
  },
  pumpBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pumpOn: {
    backgroundColor: '#E3F2FD',
  },
  pumpOff: {
    backgroundColor: '#F5F5F5',
  },
  pumpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  pumpTextOn: {
    color: '#1976D2',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
  },
});

export default HistoryScreen;
