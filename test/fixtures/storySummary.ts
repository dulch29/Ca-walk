import type { RunSummary } from '../../src/types/activity';

export const storyFixture: RunSummary = {
  sessionId: 'story-fixture-only',
  sport: 'run',
  startTime: '2026-10-29T00:00:00.000Z',
  endTime: '2026-10-29T00:35:00.000Z',
  seconds: 1800,
  km: 5,
  steps: 4200,
  averagePaceSecondsPerKm: 360,
  distanceSource: 'gps',
  completionReason: 'manual',
  photos: [],
  photoLocations: {},
  trackCoordinates: [],
};
