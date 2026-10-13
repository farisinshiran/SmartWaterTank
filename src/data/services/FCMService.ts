/**
 * FCM Service
 * Clean Architecture: Data Layer - Service
 * 
 * Handles Firebase Cloud Messaging operations.
 * This service is stateless and only performs FCM operations.
 */

import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

/**
 * Request permission for push notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    return enabled;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Get FCM token for this device
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Subscribe to FCM tokens for a topic
 */
export async function subscribeToTopic(topic: string): Promise<boolean> {
  try {
    await messaging().subscribeToTopic(topic);
    return true;
  } catch (error) {
    console.error(`Failed to subscribe to topic ${topic}:`, error);
    return false;
  }
}

/**
 * Unsubscribe from FCM topic
 */
export async function unsubscribeFromTopic(topic: string): Promise<boolean> {
  try {
    await messaging().unsubscribeFromTopic(topic);
    return true;
  } catch (error) {
    console.error(`Failed to unsubscribe from topic ${topic}:`, error);
    return false;
  }
}

/**
 * Handle foreground message
 */
export function onForegroundMessage(
  callback: (message: any) => void
): () => void {
  return messaging().onMessage(async (remoteMessage) => {
    callback(remoteMessage);
  });
}

/**
 * Handle background message (must be registered in App.tsx)
 */
export function setBackgroundMessageHandler(): void {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message:', remoteMessage);
  });
}

/**
 * Check if app is running in background
 */
export async function isInBackground(): Promise<boolean> {
  // Note: This is a simplified check. In production, use AppState or similar
  return Platform.OS !== 'web';
}

/**
 * Get initial notification (when app opens from killed state)
 */
export async function getInitialNotification(): Promise<any | null> {
  try {
    const remoteMessage = await messaging().getInitialNotification();
    return remoteMessage;
  } catch (error) {
    console.error('Failed to get initial notification:', error);
    return null;
  }
}
