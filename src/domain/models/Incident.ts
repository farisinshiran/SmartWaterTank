/**
 * Incident Domain Model
 * Represents incident/event data from the water tank monitoring system
 */

export type IncidentType = 'CRITICAL_OVERFLOW' | 'LOW_LEVEL' | 'PUMP_FAILURE' | 'SENSOR_ERROR';
export type IncidentStatus = 'ACTIVE' | 'RESOLVED';

export interface Incident {
  id: string;
  tankId: string;
  type: IncidentType;
  status: IncidentStatus;
  triggeredAt: number;
  resolvedAt?: number;
  description?: string;
}

export interface IncidentDisplay {
  id: string;
  tankId: string;
  type: IncidentType;
  status: IncidentStatus;
  triggeredAt: Date;
  resolvedAt?: Date;
  icon: string;
  color: string;
  bgColor: string;
  label: string;
  description: string;
}

export const INCIDENT_CONFIG: Record<IncidentType, Omit<IncidentDisplay, 'id' | 'tankId' | 'type' | 'status' | 'triggeredAt' | 'resolvedAt'>> = {
  CRITICAL_OVERFLOW: {
    icon: '🚨',
    color: '#C62828',
    bgColor: '#FFEBEE',
    label: 'Overflow Kritis',
    description: 'Air >= 90% dan Pompa menyala!',
  },
  LOW_LEVEL: {
    icon: '💧',
    color: '#FFA726',
    bgColor: '#FFF3E0',
    label: 'Level Air Rendah',
    description: 'Air di bawah level minimum',
  },
  PUMP_FAILURE: {
    icon: '⚠️',
    color: '#FF7043',
    bgColor: '#FBE9E7',
    label: 'Pompa Bermasalah',
    description: 'Pompa tidak berfungsi normal',
  },
  SENSOR_ERROR: {
    icon: '📡',
    color: '#78909C',
    bgColor: '#ECEFF1',
    label: 'Error Sensor',
    description: 'Sensor tidak memberikan data',
  },
};
