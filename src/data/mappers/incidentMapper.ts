/**
 * Incident Mapper
 * Maps between DTO and Domain model for incidents
 */

import { Incident, IncidentDisplay, IncidentType, IncidentStatus, INCIDENT_CONFIG } from '../../domain/models';
import { IncidentDto } from '../dtos';

/**
 * Map incident DTO to domain model
 */
export function mapIncidentDtoToIncident(dto: IncidentDto, id: string, defaultTankId: string): Incident {
  return {
    id,
    tankId: dto.tankId || defaultTankId,
    type: (dto.type as IncidentType) || 'SENSOR_ERROR',
    status: (dto.status as IncidentStatus) || 'ACTIVE',
    triggeredAt: dto.triggeredAt || 0,
    resolvedAt: dto.resolvedAt,
    description: dto.description,
  };
}

/**
 * Map incident domain model to display model
 */
export function mapIncidentToDisplay(incident: Incident): IncidentDisplay {
  const config = INCIDENT_CONFIG[incident.type];

  return {
    id: incident.id,
    tankId: incident.tankId,
    type: incident.type,
    status: incident.status,
    triggeredAt: new Date(incident.triggeredAt),
    resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : undefined,
    ...config,
  };
}

/**
 * Map array of incident DTOs to domain incidents
 */
export function mapIncidentDtoArrayToIncidents(
  data: Record<string, IncidentDto> | null,
  defaultTankId?: string
): Incident[] {
  if (!data) return [];

  return Object.entries(data)
    .map(([key, value]) => mapIncidentDtoToIncident(value, key, defaultTankId || ''))
    .sort((a, b) => b.triggeredAt - a.triggeredAt);
}

/**
 * Map array of incident DTOs to display incidents
 */
export function mapIncidentArrayToDisplay(incidents: Incident[]): IncidentDisplay[] {
  return incidents.map(mapIncidentToDisplay);
}
