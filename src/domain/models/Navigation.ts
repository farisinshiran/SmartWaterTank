/**
 * Navigation Domain Model
 * Represents navigation types for React Navigation
 */

export type RootStackParamList = {
  MainTabs: undefined;
  TankDetail: { tankId: string };
  IncidentDetail: { incidentId: string };
  Settings: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Monitor: undefined;
  History: undefined;
  Incidents: undefined;
  Chat: undefined;
};
