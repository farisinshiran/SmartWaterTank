import { useEffect } from 'react';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { requestUserPermission, getFCMToken } from '../../data/api/fcmClient';

export const usePushNotification = () => {
  useEffect(() => {
    // Meminta izin dan mendapatkan token saat komponen dimuat
    const initFCM = async () => {
      const hasPermission = await requestUserPermission();
      if (hasPermission) {
        await getFCMToken();
      }
    };

    initFCM();

    // Foreground Message Handler (saat aplikasi sedang dibuka)
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived in foreground!', JSON.stringify(remoteMessage));
      Alert.alert(
        remoteMessage.notification?.title || 'Notifikasi Baru',
        remoteMessage.notification?.body || 'Anda menerima pesan dari Smart Water Tank.'
      );
    });

    return unsubscribe;
  }, []);
};
