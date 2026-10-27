/**
 * useIncidents ViewModel
 * Clean Architecture: UI Layer - ViewModel
 * 
 * Manages incident state and transforms data for UI consumption.
 * Uses Repository layer for data access.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Incident } from '../../types';
import {
  createIncidentRepository,
  IncidentUiState,
  getActiveIncidents,
} from '../../data/repositories/IncidentRepository';

import { FIRESTORE_CONFIG } from '../../data/services/firestoreTypes';

/**
 * UI State for Incidents screen
 * Backward compatible with original interface
 */
export interface UseIncidentsResult {
  incidents: Incident[];
  activeIncidents: Incident[];
  isLoading: boolean;
  error: string | null;
  refreshIncidents: () => Promise<void>;
  resolveIncident: (incidentId: string) => Promise<void>;
}

/**
 * Incidents ViewModel Hook
 */
export const useIncidents = (
  tankId: string = FIRESTORE_CONFIG.defaultTankId,
  repoOverride?: ReturnType<typeof createIncidentRepository>
): UseIncidentsResult => {
  // UI State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create repository instance (memoized)
  const incidentRepository = useMemo(
    () => repoOverride ?? createIncidentRepository(tankId),
    [repoOverride, tankId]
  );

  // Derived state
  const activeIncidents = useMemo(() => {
    return getActiveIncidents(incidents);
  }, [incidents]);

  // Subscribe to incidents via Repository
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        setIsLoading(true);
        
        unsubscribe = incidentRepository.subscribe((state: IncidentUiState) => {
          setIncidents(state.incidents);
          setIsLoading(state.isLoading);
          setError(state.error);
        });
      } catch (err) {
        setError('Gagal memuat incidents');
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [incidentRepository]);

  // Refresh incidents
  const refreshIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      await incidentRepository.refresh();
      setError(null);
    } catch (err) {
      setError('Gagal memuat incidents');
    } finally {
      setIsLoading(false);
    }
  }, [incidentRepository]);

  // Resolve incident (placeholder - implementation depends on FirebaseIncidentService)
  const resolveIncident = useCallback(async (_incidentId: string) => {
    // This would call the service to resolve the incident
    // For now, it's a placeholder to maintain backward compatibility
  }, []);

  return {
    incidents,
    activeIncidents,
    isLoading,
    error,
    refreshIncidents,
    resolveIncident,
  };
};
