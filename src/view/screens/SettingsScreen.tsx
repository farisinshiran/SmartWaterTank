import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.settingIcon}>
      <Text style={styles.iconText}>{icon}</Text>
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement || (onPress && <Text style={styles.arrow}>›</Text>)}
  </TouchableOpacity>
);

export const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleAbout = () => {
    Alert.alert(
      'Tentang Aplikasi',
      'Smart Water Tank v1.0.0\n\nAplikasi monitoring tangki air pintar dengan AI Assistant.\n\n© 2024 Smart Water Tank Team',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Bantuan',
      'Untuk bantuan lebih lanjut, silakan hubungi tim support kami.\n\nEmail: support@smartwatertank.id',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengaturan</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>💧</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Smart Water Tank</Text>
            <Text style={styles.profileSubtitle}>Monitoring System v1.0</Text>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifikasi</Text>
          
          <View style={styles.card}>
            <SettingItem
              icon="🔔"
              title="Notifikasi Incident"
              subtitle="Aktifkan notifikasi saat ada incident"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E0E0E0', true: '#81D4FA' }}
                  thumbColor={notificationsEnabled ? '#0288D1' : '#BDBDBD'}
                />
              }
            />
            
            <View style={styles.divider} />
            
            <SettingItem
              icon="🔊"
              title="Suara Alarm"
              subtitle="Aktifkan suara saat alarm"
              rightElement={
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{ false: '#E0E0E0', true: '#81D4FA' }}
                  thumbColor={soundEnabled ? '#0288D1' : '#BDBDBD'}
                />
              }
            />
          </View>
        </View>

        {/* Display Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tampilan</Text>
          
          <View style={styles.card}>
            <SettingItem
              icon="🌙"
              title="Mode Gelap"
              subtitle="Aktifkan tampilan gelap"
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#E0E0E0', true: '#81D4FA' }}
                  thumbColor={darkMode ? '#0288D1' : '#BDBDBD'}
                />
              }
            />
          </View>
        </View>

        {/* Firebase Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Firebase</Text>
          
          <View style={styles.card}>
            <SettingItem
              icon="🔥"
              title="Cloud Firestore"
              subtitle="telemetry_logs · toren-gedung-a-01"
              onPress={() => {
                Alert.alert(
                  'Firebase Cloud Firestore',
                  'Project: smart-water-tank-e49d6\n\nCollection: telemetry_logs\nTank ID: toren-gedung-a-01',
                  [{ text: 'OK' }]
                );
              }}
            />
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bantuan</Text>
          
          <View style={styles.card}>
            <SettingItem
              icon="❓"
              title="Panduan Penggunaan"
              onPress={handleHelp}
            />
            
            <View style={styles.divider} />
            
            <SettingItem
              icon="ℹ️"
              title="Tentang Aplikasi"
              onPress={handleAbout}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Smart Water Tank v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>
            © 2024 Smart Water Tank Team
          </Text>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0288D1',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
  },
  profileSubtitle: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9E9E9E',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#424242',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#BDBDBD',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 68,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 20,
  },
  appInfoText: {
    fontSize: 13,
    color: '#BDBDBD',
  },
  appInfoSubtext: {
    fontSize: 11,
    color: '#E0E0E0',
    marginTop: 4,
  },
});

export default SettingsScreen;
