import { useEffect } from 'react';
import { Alert } from 'react-native';
import { listenForForegroundPush } from '../../data/services/NotificationService';

export const usePushNotification = () => {
  useEffect(() => {
    return listenForForegroundPush((title, body) => {
      Alert.alert(title, body);
    });
  }, []);
};
