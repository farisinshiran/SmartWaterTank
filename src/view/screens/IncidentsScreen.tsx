import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIncidents } from '../../logic/hooks/useIncidents';
import { IncidentCard } from '../components/IncidentCard';
import { Incident } from '../../types';

export const IncidentsScreen = () => {
  const { incidents, activeIncidents, isLoading, refreshIncidents, resolveIncident } = useIncidents();
  const [refreshing, setRefreshing] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshIncidents();
    setRefreshing(false);
  }, [refreshIncidents]);

  const handleResolve = (incident: Incident) => {
    Alert.alert(
      'Tandai Selesai',
      `Apakah Anda yakin ingin menyelesaikan incident "${incident.type}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Selesaikan',
          style: 'destructive',
          onPress: () => resolveIncident(incident.id),
        },
      ]
    );
  };

  const displayedIncidents = showResolved ? incidents : activeIncidents;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>✅</Text>
      <Text style={styles.emptyTitle}>Tidak Ada Incident</Text>
      <Text style={styles.emptyText}>
        {showResolved
          ? 'Belum ada history incident'
          : 'Semua kondisi aman. Tidak ada incident aktif.'}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerInfo}>
      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: '#C62828' }]} />
          <Text style={styles.summaryLabel}>Aktif</Text>
          <Text style={styles.summaryValue}>{activeIncidents.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.summaryLabel}>Selesai</Text>
          <Text style={styles.summaryValue}>{incidents.filter(i => i.status === 'RESOLVED').length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: '#0288D1' }]} />
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{incidents.length}</Text>
        </View>
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowResolved(!showResolved)}
      >
        <Text style={styles.filterText}>
          {showResolved ? '🔒 Sembunyikan yang Selesai' : '👁️ Lihat Semua (Termasuk Selesai)'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incidents</Text>
        {activeIncidents.length > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{activeIncidents.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={displayedIncidents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <IncidentCard
            incident={item}
            onResolve={item.status === 'ACTIVE' ? () => handleResolve(item) : undefined}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : undefined}
        contentContainerStyle={displayedIncidents.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Loading Overlay */}
      {isLoading && incidents.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0288D1" />
          <Text style={styles.loadingText}>Memuat incidents...</Text>
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
  alertBadge: {
    backgroundColor: '#C62828',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerInfo: {
    marginBottom: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#424242',
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterText: {
    fontSize: 13,
    color: '#616161',
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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

export default IncidentsScreen;
