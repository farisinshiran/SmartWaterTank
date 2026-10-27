import {
  mapSensorDtoToPercentage,
  mapSensorDtoToWaterLevel,
} from '../../../data/mappers/waterLevelMapper';

describe('waterLevelMapper', () => {
  it.each([
    [false, false, 'LOW', 10],
    [true, false, 'MEDIUM', 20],
    [false, true, 'FULL', 90],
    [true, true, 'FULL', 90],
  ] as const)(
    'maps sensor20=%s and sensor90=%s to %s',
    (sensor20Percent, sensor90Percent, expectedLevel, expectedPercentage) => {
      const dto = { sensor20Percent, sensor90Percent, pumpStatusRead: 'OFF' as const };

      expect(mapSensorDtoToWaterLevel(dto)).toBe(expectedLevel);
      expect(mapSensorDtoToPercentage(dto)).toBe(expectedPercentage);
    },
  );

  it('keeps legacy 50% Firestore readings at 50% while history is retained', () => {
    const legacyDto = {
      sensor20Percent: false,
      legacySensor50Percent: true,
      sensor90Percent: false,
      pumpStatusRead: 'OFF' as const,
    };

    expect(mapSensorDtoToPercentage(legacyDto)).toBe(50);
  });
});
