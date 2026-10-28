import {
  calculatePace,
  haversineDistanceMeters,
  stepsToDistanceKm,
  distanceKmToSteps,
  isSpeedFraud,
  calculateSpeedKmh,
} from '../src/services/locationUtils';
import { fmtPace } from '../src/screens/RecordScreen';

describe('locationUtils - Pace and Distance Calculations', () => {
  describe('calculatePace (decimal format with 2 decimal places)', () => {
    it('returns -- /km when distance is zero or negative', () => {
      expect(calculatePace(0, 300)).toBe('-- /km');
      expect(calculatePace(-1, 300)).toBe('-- /km');
    });

    it('returns -- /km when duration is zero or negative', () => {
      expect(calculatePace(1.5, 0)).toBe('-- /km');
      expect(calculatePace(1.5, -10)).toBe('-- /km');
    });

    it('calculates decimal pace with 2 decimal places (min/km)', () => {
      // 1.0 km in 640 seconds -> (640 / 60) / 1.0 = 10.6666... -> 10.67 /km
      expect(calculatePace(1.0, 640)).toBe('10.67 /km');

      // 1.3 km in 780 seconds (13 minutes) -> (780 / 60) / 1.3 = 10.00 /km
      expect(calculatePace(1.3, 780)).toBe('10.00 /km');

      // 5.0 km in 1500 seconds (25 minutes) -> 5.00 /km
      expect(calculatePace(5.0, 1500)).toBe('5.00 /km');

      // 0.5 km in 200 seconds -> (200 / 60) / 0.5 = 6.6666... -> 6.67 /km
      expect(calculatePace(0.5, 200)).toBe('6.67 /km');
    });

    it('returns -- /km when pace is slower than 60 min/km (stationary / crawling)', () => {
      // 0.01 km in 3600 seconds = 3600 / 0.6 = 6000 min/km
      expect(calculatePace(0.01, 3600)).toBe('-- /km');
    });
  });

  describe('fmtPace (RecordScreen decimal pace helper)', () => {
    it('returns -- when km or seconds is zero or invalid', () => {
      expect(fmtPace(0, 0)).toBe('--');
      expect(fmtPace(100, 0)).toBe('--');
      expect(fmtPace(0, 1.2)).toBe('--');
    });

    it('returns formatted 2 decimal places string', () => {
      expect(fmtPace(640, 1.0)).toBe('10.67');
      expect(fmtPace(780, 1.3)).toBe('10.00');
      expect(fmtPace(300, 0.5)).toBe('10.00');
    });
  });

  describe('stepsToDistanceKm and distanceKmToSteps', () => {
    it('converts steps to kilometers accurately using 0.75m per stride', () => {
      // 1,733 steps * 0.75m = 1299.75m ~ 1.3 km
      expect(stepsToDistanceKm(1733)).toBeCloseTo(1.3, 1);
      expect(stepsToDistanceKm(0)).toBe(0);
    });

    it('converts distance in km to steps', () => {
      expect(distanceKmToSteps(1.3)).toBe(Math.round((1.3 * 1000) / 0.75));
    });
  });

  describe('haversineDistanceMeters', () => {
    it('calculates distance between two real coordinates in Bangkok', () => {
      // Siam Square to MBK (~400m)
      const siam = { latitude: 13.7445, longitude: 100.5315 };
      const mbk = { latitude: 13.746, longitude: 100.5303 };
      const distance = haversineDistanceMeters(siam, mbk);
      expect(distance).toBeGreaterThan(150);
      expect(distance).toBeLessThan(300);
    });

    it('returns 0 for identical points or invalid coordinates', () => {
      const pt = { latitude: 13.74, longitude: 100.53 };
      expect(haversineDistanceMeters(pt, pt)).toBe(0);
      expect(haversineDistanceMeters(null as any, pt)).toBe(0);
    });
  });

  describe('speed and fraud checks', () => {
    it('calculates speed in km/h', () => {
      // 1 km in 600 seconds = 6 km/h
      expect(calculateSpeedKmh(1, 600)).toBeCloseTo(6, 1);
    });

    it('identifies speed fraud above Pace 2 threshold (30 km/h)', () => {
      expect(isSpeedFraud(15)).toBe(false);
      expect(isSpeedFraud(25)).toBe(false);
      expect(isSpeedFraud(30.0)).toBe(false);
      expect(isSpeedFraud(30.5)).toBe(true);
      expect(isSpeedFraud(45)).toBe(true); // Car
    });
  });
});
