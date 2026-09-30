import React from 'react';
import { StyleSheet, Text, View, StatusBar, SafeAreaView } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Water Tank 🚰</Text>
      </View>

      {/* Konten Utama */}
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status Tangki Air</Text>
          <Text style={styles.waterLevel}>85%</Text>
          <Text style={styles.statusText}>Kondisi: Aman / Cukup</Text>
        </View>

        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.cardTitle}>Informasi Tambahan</Text>
          <Text style={styles.dummyText}>• Pompa: Otomatis (Mati)</Text>
          <Text style={styles.dummyText}>• Suhu Air: 26°C</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E3A8A',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    elevation: 3, // Bayangan khusus Android
  },
  cardTitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 10,
  },
  waterLevel: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    marginVertical: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#10B981',
    textAlign: 'center',
    fontWeight: '500',
  },
  dummyText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 5,
  },
});
