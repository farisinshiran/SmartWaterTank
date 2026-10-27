/**
 * Tank Mapper
 * Maps between DTO and Domain model for tanks
 */

import { TankInfo } from '../../domain/models';
import { TankDto } from '../dtos';

/**
 * Map tank DTO to domain model
 */
export function mapTankDtoToTank(dto: TankDto, tankId: string): TankInfo {
  return {
    tankId,
    location: dto.location || '',
    createdAt: dto.createdAt || 0,
    lastSeen: dto.lastSeen || 0,
  };
}

/**
 * Map array of tank DTOs to domain tanks
 */
export function mapTankDtoArrayToTanks(data: Record<string, TankDto> | null): TankInfo[] {
  if (!data) return [];

  return Object.entries(data)
    .map(([key, value]) => mapTankDtoToTank(value, key));
}
