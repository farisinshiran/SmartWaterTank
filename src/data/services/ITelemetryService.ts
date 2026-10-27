/**
 * Telemetry Service Interface
 */
import type { TelemetryLogDto } from '../dtos';

export type TelemetryLogInput = Omit<TelemetryLogDto, 'timestamp'>;

export interface ITelemetryService {
  subscribe(
    tankId: string,
    callback: (data: Record<string, TelemetryLogDto> | null) => void
  ): () => void;
  log(
    tankId: string,
    sensor20Percent: boolean,
    sensor90Percent: boolean,
    pumpStatusRead: 'ON' | 'OFF'
  ): Promise<string>;
}
