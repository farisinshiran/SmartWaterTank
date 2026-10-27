/**
 * Incident Repository
 * Clean Architecture: Data Layer - Repository
 *
 * Repository acts as the single source of truth for incident data.
 * It uses Data Services (Firebase SDK) and returns Domain Models.
 */

import { Incident, IncidentDisplay, IncidentType } from '../../domain/models';
import {
  subscribeToAllIncidents,
  subscribeToActiveIncidents,
  createIncident,
  resolveIncident,
} from '../services/FirebaseIncidentService';
import type { IIncidentService } from '../services/IIncidentService';
import { IncidentDto } from '../dtos';
import {
  mapIncidentDtoArrayToIncidents,
  mapIncidentArrayToDisplay,
} from '../mappers/incidentMapper';
import { FIRESTORE_CONFIG } from '../services/firestoreTypes';

/**
 * UI State for incidents
 */
export interface IncidentUiState {
  incidents: Incident[];
  displayIncidents: IncidentDisplay[];
  activeIncidents: Incident[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Incident Repository interface
 */
export interface IIncidentRepository {
  subscribe(callback: (state: IncidentUiState) => void): () => void;
  refresh(): Promise<void>;
  createNewIncident(
    tankId: string,
    type: IncidentType,
    description?: string
  ): Promise<string | null>;
}

/**
 * Default tank ID
 */
const DEFAULT_TANK_ID = FIRESTORE_CONFIG.defaultTankId;

/**
 * Create Incident Repository instance
 *
 * @param tankId   The tank to scope reads/writes to
 * @param service  Optional service override (used by tests via DI container)
 */
export function createIncidentRepository(
  tankId: string = DEFAULT_TANK_ID,
  service: IIncidentService = {
    subscribeActive: subscribeToActiveIncidents,
    subscribeAll: subscribeToAllIncidents,
    create: createIncident,
    resolve: (tankId, incidentId, _resolvedAt) => resolveIncident(tankId, incidentId),
  }
): IIncidentRepository {
  let currentIncidents: Incident[] = [];

  return {
    /**
     * Subscribe to incidents (both all and active)
     * Returns unsubscribe function
     */
    subscribe(callback: (state: IncidentUiState) => void): () => void {
      // Subscribe to active incidents for this tank
      const unsubscribeActive = service.subscribeActive(
        tankId,
        (data: Record<string, IncidentDto> | null) => {
          currentIncidents = mapIncidentDtoArrayToIncidents(data, tankId);
          const activeOnly = currentIncidents.filter((i) => i.status === 'ACTIVE');

          callback({
            incidents: currentIncidents,
            displayIncidents: mapIncidentArrayToDisplay(currentIncidents),
            activeIncidents: activeOnly,
            isLoading: false,
            error: null,
          });
        }
      );

      // Also subscribe to all incidents globally
      const unsubscribeAll = service.subscribeAll(
        (data: Record<string, IncidentDto> | null) => {
          const allIncidents = mapIncidentDtoArrayToIncidents(data, tankId);
          currentIncidents = allIncidents;
          const activeOnly = allIncidents.filter((i) => i.status === 'ACTIVE');

          callback({
            incidents: allIncidents,
            displayIncidents: mapIncidentArrayToDisplay(allIncidents),
            activeIncidents: activeOnly,
            isLoading: false,
            error: null,
          });
        }
      );

      // Return combined unsubscribe
      return () => {
        unsubscribeActive();
        unsubscribeAll();
      };
    },

    /**
     * Refresh incidents
     */
    async refresh(): Promise<void> {
      // Subscribe already keeps data updated
      // This would trigger a manual refresh if needed
    },

    /**
     * Create a new incident
     */
    async createNewIncident(
      tankId: string,
      type: IncidentType,
      description?: string
    ): Promise<string | null> {
      return service.create(tankId, type, description);
    },
  };
}

/**
 * Filter active incidents only
 */
export function getActiveIncidents(incidents: Incident[]): Incident[] {
  return incidents.filter((i) => i.status === 'ACTIVE');
}

/**
 * Filter resolved incidents only
 */
export function getResolvedIncidents(incidents: Incident[]): Incident[] {
  return incidents.filter((i) => i.status === 'RESOLVED');
}

/**
 * Group incidents by type
 */
export function groupIncidentsByType(
  incidents: Incident[]
): Record<IncidentType, Incident[]> {
  return incidents.reduce(
    (acc, incident) => {
      if (!acc[incident.type]) {
        acc[incident.type] = [];
      }
      acc[incident.type].push(incident);
      return acc;
    },
    {} as Record<IncidentType, Incident[]>
  );
}
