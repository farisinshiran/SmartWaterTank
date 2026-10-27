import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WaterLevel } from '../../types';
import { TankVisual } from './TankVisual';

interface StatusCardProps {
  title: string;
  location?: string;
  waterLevel: WaterLevel;
  pumpStatus: 'ON' | 'OFF';
  sensor90: boolean;
  sensor20: boolean;
  lastUpdate?: Date | null;
  isCritical?: boolean;
  onPress?: () => void;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  location,
  waterLevel,
  pumpStatus,
  sensor90,
  sensor20,
  lastUpdate,
  isCritical = false,
  onPress,
}) => {
  const getStatusColor = () => {
    if (isCritical) return '#C62828';
    if (waterLevel === 'FULL') return '#1565C0';
    if (waterLevel === 'MEDIUM') return '#4FC3F7';
    if (waterLevel === 'LOW') return '#FFA726';
    return '#66BB6A';
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCritical && styles.cardCritical,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Critical Alert Banner */}
      {isCritical && (
        <View style={styles.criticalBanner}>
          <Text style={styles.criticalText}>⚠️ CRITICAL OVERFLOW</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {location && (
            <Text style={styles.location}>📍 {location}</Text>
          )}
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      </View>

      {/* Tank Visual */}
      <View style={styles.tankContainer}>
        <TankVisual level={waterLevel} size="medium" />
      </View>

      {/* Sensor Status */}
      <View style={styles.sensorGrid}>
        <View style={styles.sensorItem}>
          <View style={[styles.sensorIndicator, sensor90 && styles.sensorOn]} />
          <Text style={styles.sensorLabel}>Sensor 90%</Text>
          <Text style={styles.sensorValue}>{sensor90 ? 'AKTIF' : 'NONAKTIF'}</Text>
        </View>
        
        <View style={styles.sensorItem}>
          <View style={[styles.sensorIndicator, sensor20 && styles.sensorOn]} />
          <Text style={styles.sensorLabel}>Sensor 20%</Text>
          <Text style={styles.sensorValue}>{sensor20 ? 'AKTIF' : 'NONAKTIF'}</Text>
        </View>
      </View>

      {/* Pump Status */}
      <View style={styles.pumpContainer}>
        <View style={[
          styles.pumpBadge,
          pumpStatus === 'ON' ? styles.pumpOn : styles.pumpOff
        ]}>
          <Text style={styles.pumpText}>
            💧 Pompa: {pumpStatus}
          </Text>
        </View>
      </View>

      {/* Last Update */}
      {lastUpdate && (
        <View style={styles.footer}>
          <Text style={styles.lastUpdate}>
            Update: {lastUpdate.toLocaleTimeString('id-ID')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardCritical: {
    borderWidth: 2,
    borderColor: '#C62828',
    backgroundColor: '#FFF5F5',
  },
  criticalBanner: {
    backgroundColor: '#C62828',
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  criticalText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  location: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tankContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  sensorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  sensorItem: {
    alignItems: 'center',
  },
  sensorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginBottom: 4,
  },
  sensorOn: {
    backgroundColor: '#4CAF50',
  },
  sensorLabel: {
    fontSize: 11,
    color: '#757575',
  },
  sensorValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#424242',
    marginTop: 2,
  },
  pumpContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  pumpBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  pumpOn: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  pumpOff: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#BDBDBD',
  },
  pumpText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
    marginTop: 8,
  },
  lastUpdate: {
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});

export default StatusCard;
