import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTankMonitor } from '../../logic/hooks/useTankMonitor';

export const CompactDebugPanel: React.FC = () => {
  const { sensorData, isConnected, isCriticalOverflow } = useTankMonitor();

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        {isConnected ? 'Firestore: terhubung' : 'Firestore: tidak terhubung'}
      </Text>
      <Text style={styles.valueText}>
        Sensor 20%: {sensorData.sensor20Percent ? 'AKTIF' : 'NONAKTIF'}
      </Text>
      <Text style={styles.valueText}>
        Sensor 90%: {sensorData.sensor90Percent ? 'AKTIF' : 'NONAKTIF'}
      </Text>
      <Text style={styles.valueText}>Pompa: {sensorData.pumpStatusRead}</Text>
      {isCriticalOverflow && (
        <Text style={styles.alertText}>Peringatan: pompa masih ON pada level 90%.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#263238',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  statusText: {
    color: '#B0BEC5',
    fontSize: 12,
    marginBottom: 8,
  },
  valueText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 4,
  },
  alertText: {
    color: '#FF8A80',
    fontWeight: '600',
    marginTop: 8,
  },
});

export default CompactDebugPanel;
