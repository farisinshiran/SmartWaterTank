/**
 * Incident Service Interface
 */
import type { IncidentDto } from '../dtos';
import type { IncidentType } from '../../domain/models';

export interface IIncidentService {
  subscribeActive(
    tankId: string,
    callback: (data: Record<string, IncidentDto> | null) => void
  ): () => void;
  subscribeAll(
    callback: (data: Record<string, IncidentDto> | null) => void
  ): () => void;
  create(
    tankId: string,
    type: IncidentType,
    description?: string
  ): Promise<string>;
  resolve(tankId: string, incidentId: string, resolvedAt: number): Promise<void>;
}
