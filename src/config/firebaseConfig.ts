import { ref, getDatabase } from '@react-native-firebase/database';
import { Platform } from 'react-native';

// Konfigurasi Realtime Database lama; data sensor aplikasi memakai Firestore.

export const FIREBASE_DATABASE_URL = Platform.OS === 'android'
  ? 'https://smart-water-tank-e49d6-default-rtdb.firebaseio.com'
  : 'https://smart-water-tank-e49d6-default-rtdb.asia-southeast1.firebasedatabase.app';

// Referensi path database
export const DB_PATHS = {
  SENSORS: '/sensors',
  SENSOR_90_PERCENT: '/sensors/sensor90Percent',
  SENSOR_20_PERCENT: '/sensors/sensor20Percent',
  PUMP_STATUS: '/sensors/pumpStatusRead',
  BUTTON_STATE: '/debug/buttonState',
} as const;

// Inisialisasi database reference
export const getSensorRef = () => ref(getDatabase(), DB_PATHS.SENSORS);
export const getSensor90Ref = () => ref(getDatabase(), DB_PATHS.SENSOR_90_PERCENT);
export const getSensor20Ref = () => ref(getDatabase(), DB_PATHS.SENSOR_20_PERCENT);
export const getPumpStatusRef = () => ref(getDatabase(), DB_PATHS.PUMP_STATUS);
