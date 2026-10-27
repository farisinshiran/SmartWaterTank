import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Incident } from '../../types';

interface IncidentCardProps {
  incident: Incident;
  onPress?: () => void;
  onResolve?: () => void;
}

const INCIDENT_CONFIG = {
  CRITICAL_OVERFLOW: {
    icon: '🚨',
    color: '#C62828',
    bgColor: '#FFEBEE',
    label: 'Overflow Kritis',
    description: 'Air >= 90% dan Pompa menyala!',
  },
  LOW_LEVEL: {
    icon: '💧',
    color: '#FFA726',
    bgColor: '#FFF3E0',
    label: 'Level Air Rendah',
    description: 'Air di bawah level minimum',
  },
  PUMP_FAILURE: {
    icon: '⚠️',
    color: '#FF7043',
    bgColor: '#FBE9E7',
    label: 'Pompa Bermasalah',
    description: 'Pompa tidak berfungsi normal',
  },
  SENSOR_ERROR: {
    icon: '📡',
    color: '#78909C',
    bgColor: '#ECEFF1',
    label: 'Error Sensor',
    description: 'Sensor tidak memberikan data',
  },
};

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onPress,
  onResolve,
}) => {
  const config = INCIDENT_CONFIG[incident.type];
  const isActive = incident.status === 'ACTIVE';

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: config.bgColor },
        !isActive && styles.cardResolved,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Status Badge */}
      <View style={[
        styles.statusBadge,
        isActive ? { backgroundColor: config.color } : { backgroundColor: '#9E9E9E' }
      ]}>
        <Text style={styles.statusText}>
          {isActive ? 'AKTIF' : 'SELESAI'}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{config.icon}</Text>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: config.color }]}>
              {config.label}
            </Text>
            <Text style={styles.tankId}>Tangki: {incident.tankId}</Text>
          </View>
        </View>

        <Text style={styles.description}>{config.description}</Text>

        {/* Timestamps */}
        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>
            ⏰ Terjadi: {formatTime(incident.triggeredAt)}
          </Text>
          {incident.resolvedAt && (
            <Text style={styles.timestamp}>
              ✅ Selesai: {formatTime(incident.resolvedAt)}
            </Text>
          )}
        </View>
      </View>

      {/* Action Button */}
      {isActive && onResolve && (
        <TouchableOpacity
          style={[styles.resolveButton, { backgroundColor: config.color }]}
          onPress={(e) => {
            e.stopPropagation();
            onResolve();
          }}
        >
          <Text style={styles.resolveText}>✓ Tandai Selesai</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardResolved: {
    opacity: 0.7,
  },
  statusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    paddingRight: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tankId: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: '#616161',
    marginBottom: 12,
  },
  timestampContainer: {
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  resolveButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resolveText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default IncidentCard;
