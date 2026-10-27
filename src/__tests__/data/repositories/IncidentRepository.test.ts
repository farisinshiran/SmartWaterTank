/**
 * Tests for IncidentRepository with FakeIncidentService
 */
import { createIncidentRepository, getActiveIncidents, getResolvedIncidents, groupIncidentsByType } from '../../../data/repositories/IncidentRepository';
import { createFakeIncidentService } from '../../../di/fakes';
import type { Incident, IncidentType } from '../../../domain/models';

describe('IncidentRepository (with fake service)', () => {
  it('emits empty state on initial subscribe', async () => {
    const fake = createFakeIncidentService();
    const repo = createIncidentRepository('tank-001', fake);

    const states: any[] = [];
    const unsubscribe = repo.subscribe((s) => states.push(s));

    await Promise.resolve();
    await Promise.resolve();

    expect(states.length).toBeGreaterThanOrEqual(1);
    expect(states[0].incidents).toEqual([]);
    expect(states[0].activeIncidents).toEqual([]);

    unsubscribe();
  });

  it('records createNewIncident on the fake', async () => {
    const fake = createFakeIncidentService();
    const repo = createIncidentRepository('tank-001', fake);

    const id = await repo.createNewIncident('tank-001', 'CRITICAL_OVERFLOW' as IncidentType, 'pompa macet');

    expect(id).toMatch(/^inc-\d+$/);
    expect(fake.state.created).toHaveLength(1);
    expect(fake.state.created[0]).toEqual({
      tankId: 'tank-001',
      type: 'CRITICAL_OVERFLOW',
      description: 'pompa macet',
    });
  });

  it('getActiveIncidents filters only ACTIVE status', () => {
    const items: Incident[] = [
      { id: 'a', tankId: 't', type: 'CRITICAL_OVERFLOW', status: 'ACTIVE', triggeredAt: 1 },
      { id: 'b', tankId: 't', type: 'CRITICAL_OVERFLOW', status: 'RESOLVED', triggeredAt: 1, resolvedAt: 2 },
    ];
    expect(getActiveIncidents(items)).toEqual([items[0]]);
    expect(getResolvedIncidents(items)).toEqual([items[1]]);
  });

  it('groupIncidentsByType buckets incidents by type', () => {
    const items: Incident[] = [
      { id: 'a', tankId: 't', type: 'CRITICAL_OVERFLOW', status: 'ACTIVE', triggeredAt: 1 },
      { id: 'b', tankId: 't', type: 'PUMP_FAILURE', status: 'ACTIVE', triggeredAt: 1 },
      { id: 'c', tankId: 't', type: 'CRITICAL_OVERFLOW', status: 'RESOLVED', triggeredAt: 1, resolvedAt: 2 },
    ];
    const grouped = groupIncidentsByType(items);
    expect(grouped.CRITICAL_OVERFLOW).toHaveLength(2);
    expect(grouped.PUMP_FAILURE).toHaveLength(1);
  });
});
