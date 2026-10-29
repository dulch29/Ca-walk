import {
  createRunSummary,
  canFinishAtDestination,
} from '../src/services/completedActivity';
import type { RunSession } from '../src/services/mockData';
import type { ActiveRunSession } from '../src/context/AppContext';

const completed: RunSession = {
  sessionId: 'completed-1',
  startTime: '2026-10-29T00:00:00Z',
  endTime: '2026-10-29T00:35:00Z',
  durationSeconds: 1800,
  steps: 4200,
  distanceKm: 6,
  gpsDistanceKm: 5,
  averagePace: '5.00 /km',
  photos: ['file:///current.jpg'],
  trackCoordinates: [[100.5, 13.7]],
  destinationName: 'ร้านปลายทาง',
};
it('uses accepted GPS distance and paused active time from the completed snapshot', () => {
  const summary = createRunSummary(completed, 'run');
  expect(summary).toMatchObject({
    sessionId: 'completed-1',
    km: 5,
    seconds: 1800,
    averagePaceSecondsPerKm: 360,
    distanceSource: 'gps',
    completionReason: 'manual',
    startTime: completed.startTime,
    endTime: completed.endTime,
  });
});
it('never treats a legacy fused/step estimate as GPS', () => {
  const summary = createRunSummary(
    { ...completed, gpsDistanceKm: undefined },
    'walk',
  );
  expect(summary).toMatchObject({
    km: 0,
    distanceSource: 'unavailable',
    averagePaceSecondsPerKm: null,
  });
});
it('clones photos and coordinate tuples instead of keeping mutable session arrays', () => {
  const summary = createRunSummary(completed, 'walk', 'arrived');
  expect(summary.photos).toEqual(completed.photos);
  expect(summary.photos).not.toBe(completed.photos);
  expect(summary.trackCoordinates[0]).not.toBe(completed.trackCoordinates![0]);
  expect(summary.completionReason).toBe('arrived');
});
it.each([0, 0.005, NaN, Infinity])(
  'has no average pace for invalid/insufficient GPS distance %s',
  gpsDistanceKm => {
    expect(
      createRunSummary({ ...completed, gpsDistanceKm }, 'walk')
        .averagePaceSecondsPerKm,
    ).toBeNull();
  },
);
const now = Date.parse('2026-10-29T00:35:00Z');
const active: ActiveRunSession = {
  ...completed,
  gpsDistanceKm: 5,
  status: 'recording',
  currentPace: '6.00 /km',
  photos: [],
  trackCoordinates: [],
  destination: { id: 'dest', name: 'ร้าน', coordinates: [100.5, 13.7] },
  lastAcceptedLocation: {
    longitude: 100.5,
    latitude: 13.7,
    accuracy: 8,
    speedKmh: 0,
    timestamp: now,
  },
};
it('offers arrival completion only for a fresh accurate accepted fix near the destination', () => {
  expect(canFinishAtDestination(active, now)).toBe(true);
  expect(
    canFinishAtDestination({ ...active, destination: undefined }, now),
  ).toBe(false);
  expect(
    canFinishAtDestination({ ...active, lastAcceptedLocation: undefined }, now),
  ).toBe(false);
  for (const fix of [
    { ...active.lastAcceptedLocation!, accuracy: 80 },
    { ...active.lastAcceptedLocation!, accuracy: null },
    { ...active.lastAcceptedLocation!, timestamp: now - 30000 },
    { ...active.lastAcceptedLocation!, timestamp: now + 30000 },
    { ...active.lastAcceptedLocation!, longitude: 100.6 },
  ]) {
    expect(
      canFinishAtDestination({ ...active, lastAcceptedLocation: fix }, now),
    ).toBe(false);
  }
});
