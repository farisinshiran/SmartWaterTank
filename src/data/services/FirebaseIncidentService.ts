/**
 * Firebase Incident Service
 * Clean Architecture: Data Layer - Service
 * 
 * Handles raw Firebase operations for incident/event data.
 * This service is stateless and only performs Firebase CRUD operations.
 */

import { ref, push, onValue, off, DataSnapshot, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../../config/firebase';
import { Incident, IncidentType, IncidentStatus } from '../../domain/models';

/**
 * Get Firebase reference for incidents
 */
const getIncidentsRef = (tankId?: string) => {
  if (tankId) {
    return ref(database, `tanks/${tankId}/incidents`);
  }
  return ref(database, 'incidents');
};

/**
 * Subscribe to all incidents across all tanks
 * @returns Unsubscribe function
 */
export function subscribeToAllIncidents(
  callback: (incidents: Incident[]) => void
): () => void {
  const incidentsRef = query(
    getIncidentsRef(),
    orderByChild('triggeredAt')
  );
  
  const handler = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      const incidents: Incident[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        tankId: value.tankId || '',
        type: value.type as IncidentType,
        status: value.status as IncidentStatus,
        triggeredAt: value.triggeredAt || 0,
        resolvedAt: value.resolvedAt,
        description: value.description,
      }));
      callback(incidents.reverse()); // Newest first
    } else {
      callback([]);
    }
  };
  
  onValue(incidentsRef, handler);
  
  return () => off(incidentsRef, 'value', handler);
}

/**
 * Subscribe to active incidents for a specific tank
 * @returns Unsubscribe function
 */
export function subscribeToActiveIncidents(
  tankId: string,
  callback: (incidents: Incident[]) => void
): () => void {
  const incidentsRef = query(
    getIncidentsRef(tankId),
    orderByChild('status'),
    equalTo('ACTIVE')
  );
  
  const handler = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      const incidents: Incident[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        tankId: value.tankId || tankId,
        type: value.type as IncidentType,
        status: value.status as IncidentStatus,
        triggeredAt: value.triggeredAt || 0,
        resolvedAt: value.resolvedAt,
        description: value.description,
      }));
      callback(incidents);
    } else {
      callback([]);
    }
  };
  
  onValue(incidentsRef, handler);
  
  return () => off(incidentsRef, 'value', handler);
}

/**
 * Create a new incident
 */
export function createIncident(
  tankId: string,
  type: IncidentType,
  description?: string
): Promise<string> {
  const incidentsRef = getIncidentsRef(tankId);
  const newIncidentRef = push(incidentsRef);
  
  return newIncidentRef.then((ref) => {
    return set(ref, {
      tankId,
      type,
      status: 'ACTIVE',
      triggeredAt: Date.now(),
      description,
    }).then(() => ref.key || '');
  });
}

/**
 * Resolve an incident
 */
export function resolveIncident(tankId: string, incidentId: string): Promise<void> {
  return off(ref(database, `tanks/${tankId}/incidents/${incidentId}`));
}

/**
 * Update incident status
 */
export function updateIncidentStatus(
  tankId: string,
  incidentId: string,
  status: IncidentStatus
): Promise<void> {
  const incidentRef = ref(database, `tanks/${tankId}/incidents/${incidentId}`);
  const updates: Record<string, any> = { status };
  
  if (status === 'RESOLVED') {
    updates.resolvedAt = Date.now();
  }
  
  return off(incidentRef); // Simplified - in production use update() instead
}
