/**
 * Data Services - Barrel Export
 * Clean Architecture: Data Layer - Services
 */

// Firebase Services
export {
  subscribeToTank,
  subscribeToAllTanks,
  updateTankData,
  setTankData,
} from './FirebaseTankService';

export {
  subscribeToSensorData,
  writeSensorData,
  updateSensorData,
  setPumpState,
  subscribeToPumpControl,
} from './FirebaseSensorService';

export {
  subscribeToTelemetryLogs,
  pushTelemetryLog,
  subscribeToLatestTelemetryLog,
} from './FirebaseTelemetryService';

export {
  subscribeToAllIncidents,
  subscribeToActiveIncidents,
  createIncident,
  resolveIncident,
  updateIncidentStatus,
} from './FirebaseIncidentService';

// External Services
export {
  requestNotificationPermission,
  getFCMToken,
  subscribeToTopic,
  unsubscribeFromTopic,
  onForegroundMessage,
  setBackgroundMessageHandler,
  isInBackground,
  getInitialNotification,
} from './FCMService';

export {
  configureOlagonService,
  chatWithAI,
  getWaterLevelAdvice,
  analyzeSensorData,
  checkHealth,
  createAbortableRequest,
  OlagonConfig,
  OlagonRequestOptions,
  OlagonResponse,
} from './OlagonService';
