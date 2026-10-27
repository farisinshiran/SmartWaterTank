export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type NotificationStatus = 'NEW' | 'READ' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface UserNotification {
  id: string;
  tankId: string;
  type: 'TEST' | 'LOW_LEVEL' | 'OVERFLOW' | 'SENSOR_OFFLINE';
  severity: NotificationSeverity;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: Date | null;
  resolvedAt: Date | null;
}

export interface AlarmSettings {
  enabled: boolean;
}
