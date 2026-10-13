/**
 * Sensor Domain Model
 * Represents sensor data from the water tank hardware
 */

export interface SensorData {
  sensor50Percent: boolean;
  sensor90Percent: boolean;
  pumpStatusRead: 'ON' | 'OFF';
  lastUpdate?: number;
}

export interface SensorState {
  sensor90Percent: boolean;
  sensor50Percent: boolean;
  pumpStatusRead: 'ON' | 'OFF';
}

export interface SensorReading {
  sensorData: SensorData;
  timestamp: Date;
}

export interface ButtonState {
  lastToggle: number;
  pressCount: number;
}
