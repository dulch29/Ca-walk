import type { ActiveRunSession } from '../context/AppContext';
import type { RunSession } from './mockData';
import type { RunSummary, Sport } from '../types/activity';
import { isWithinGeofence } from './locationUtils';

export function createRunSummary(
  completed: RunSession,
  sport: Sport,
  completionReason: RunSummary['completionReason'] = 'manual',
): RunSummary {
  // Legacy distance includes step estimates; only the separately accepted GPS total is shareable.
  const gps = completed.gpsDistanceKm;
  const km = gps !== undefined && Number.isFinite(gps) && gps > 0 ? gps : 0;
  const seconds = completed.durationSeconds;
  return {
    sessionId: completed.sessionId,
    sport,
    startTime: completed.startTime,
    endTime: completed.endTime,
    seconds,
    km,
    steps: completed.steps,
    averagePaceSecondsPerKm:
      km > 0.005 && Number.isFinite(seconds) && seconds > 0
        ? seconds / km
        : null,
    distanceSource: km > 0 ? 'gps' : 'unavailable',
    completionReason,
    destinationName: completed.destinationName,
    photos: [...(completed.photos ?? [])],
    trackCoordinates: (completed.trackCoordinates ?? []).map(([lng, lat]) => [
      lng,
      lat,
    ]),
  };
}

export function canFinishAtDestination(
  session: ActiveRunSession | null,
  now = Date.now(),
): boolean {
  const fix = session?.lastAcceptedLocation;
  const destination = session?.destination;
  if (
    !fix ||
    !destination ||
    fix.accuracy === null ||
    !Number.isFinite(fix.accuracy) ||
    !Number.isFinite(fix.timestamp) ||
    fix.accuracy < 0 ||
    fix.accuracy > 25 ||
    now - fix.timestamp < 0 ||
    now - fix.timestamp > 15000
  ) {
    return false;
  }
  return isWithinGeofence(
    fix,
    {
      longitude: destination.coordinates[0],
      latitude: destination.coordinates[1],
    },
    25,
  );
}
