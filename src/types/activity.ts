export type Sport = 'walk' | 'run';
export type LngLat = [number, number];

export interface RunSummary {
  sessionId: string;
  sport: Sport;
  startTime: string;
  endTime: string;
  seconds: number;
  km: number;
  steps: number;
  averagePaceSecondsPerKm: number | null;
  distanceSource: 'gps' | 'unavailable';
  completionReason: 'manual' | 'arrived';
  destinationName?: string;
  photos: string[];
  photoLocations?: Record<string, string>;
  trackCoordinates: LngLat[];
  trackSegments?: LngLat[][];
}
