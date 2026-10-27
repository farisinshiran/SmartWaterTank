/**
 * Tank Service Interface
 */
import type { TankDto } from '../dtos';

export interface ITankService {
  subscribeToOne(
    tankId: string,
    callback: (data: TankDto | null) => void
  ): () => void;
  subscribeAll(
    callback: (data: Record<string, TankDto> | null) => void
  ): () => void;
}
