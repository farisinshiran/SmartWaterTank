import {
  getFCMToken as fetchFCMToken,
  requestNotificationPermission,
} from '../services/FCMService';

export const requestUserPermission = requestNotificationPermission;

export const getFCMToken = async () => {
  try {
    const token = await fetchFCMToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error mendapatkan FCM Token:', error);
    return null;
  }
};
