/**
 * Sensor Service Interface
 * Clean Architecture: Data Layer - Service contract
 *
 * Decouples the SensorRepository from the concrete Firebase implementation
 * so tests can supply a fake.
 */

import type { SensorDataDto } from '../dtos';

export interface ISensorService {
  subscribe(
    tankId: string,
    callback: (data: SensorDataDto | null) => void
  ): () => void;
  write(tankId: string, data: SensorDataDto): Promise<void>;
  update(tankId: string, data: Partial<SensorDataDto>): Promise<void>;
}
