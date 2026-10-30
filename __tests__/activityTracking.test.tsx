import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {
  AppProvider,
  useAppContext,
  type AppContextValue,
} from '../src/context/AppContext';
import type { TrackedLocation } from '../src/services/motionTracker';

let mockOnStep: (() => void) | null = null;
let mockOnLocation: ((loc: TrackedLocation) => void) | null = null;
let mockStopped = false;
const mockGetCurrentTrackedLocation = jest.fn<Promise<TrackedLocation>, []>();
const mockReverseGeocodeLocation = jest.fn<
  Promise<string | null>,
  [[number, number], AbortSignal?]
>();

jest.mock('../src/services/motionTracker', () => ({
  requestLocationPermissions: jest.fn(async () => true),
  getCurrentTrackedLocation: () => mockGetCurrentTrackedLocation(),
  startLocationWatch: jest.fn(async () => ({ stop: jest.fn() })),
  startMotionTracking: jest.fn(async (options: any) => {
    mockOnStep = options.onStep;
    mockOnLocation = options.onLocation;
    mockStopped = false;
    return {
      stop: jest.fn(() => {
        mockStopped = true;
      }),
    };
  }),
}));

jest.mock('../src/services/osmLocationService', () => ({
  reverseGeocodeLocation: (coords: [number, number], signal?: AbortSignal) =>
    mockReverseGeocodeLocation(coords, signal),
}));

function Consumer({ onRender }: { onRender: (context: AppContextValue) => void }) {
  const context = useAppContext();
  onRender(context);
  return null;
}

async function renderContext(): Promise<AppContextValue> {
  let context!: AppContextValue;
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(
      <AppProvider>
        <Consumer onRender={next => (context = next)} />
      </AppProvider>,
    );
  });
  return new Proxy({} as AppContextValue, {
    get: (_target, property: keyof AppContextValue) => context[property],
  });
}

function fix(
  overrides: Partial<TrackedLocation> = {},
): TrackedLocation {
  return {
    latitude: 13.74,
    longitude: 100.53,
    accuracy: 5,
    timestamp: Date.now(),
    speedKmh: 0,
    ...overrides,
  };
}

describe('Activity tracking lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-30T00:00:00.000Z') });
    mockOnStep = null;
    mockOnLocation = null;
    mockStopped = false;
    mockGetCurrentTrackedLocation.mockReset();
    mockReverseGeocodeLocation.mockReset().mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('counts elapsed recording time and excludes pause time', async () => {
    let ctx = await renderContext();
    await ReactTestRenderer.act(async () => {
      await ctx.startRunSession(undefined, 'run');
    });

    ReactTestRenderer.act(() => jest.advanceTimersByTime(5_000));
    expect(ctx.activeSession?.durationSeconds).toBe(5);
    expect(ctx.activeSession?.sport).toBe('run');

    ReactTestRenderer.act(() => ctx.pauseRunSession());
    ReactTestRenderer.act(() => jest.advanceTimersByTime(60_000));
    expect(ctx.activeSession?.durationSeconds).toBe(5);

    ReactTestRenderer.act(() => ctx.resumeRunSession());
    ReactTestRenderer.act(() => jest.advanceTimersByTime(2_000));
    expect(ctx.activeSession?.durationSeconds).toBe(7);
  });

  it('derives duration from elapsed time even when only one timer callback runs', async () => {
    let elapsedMs = 0;
    const performanceApi = (
      globalThis as unknown as { performance: { now: () => number } }
    ).performance;
    const nowSpy = jest
      .spyOn(performanceApi, 'now')
      .mockImplementation(() => elapsedMs);
    const ctx = await renderContext();
    await ReactTestRenderer.act(async () => ctx.startRunSession());

    elapsedMs = 5_500;
    ReactTestRenderer.act(() => jest.advanceTimersToNextTimer());

    expect(ctx.activeSession?.durationSeconds).toBe(5);
    nowSpy.mockRestore();
  });

  it('keeps steps separate from accepted GPS distance', async () => {
    const ctx = await renderContext();
    await ReactTestRenderer.act(async () => ctx.startRunSession());

    ReactTestRenderer.act(() => {
      for (let index = 0; index < 100; index += 1) {
        mockOnStep?.();
      }
    });
    expect(ctx.activeSession?.steps).toBe(100);
    expect(ctx.activeSession?.distanceKm).toBe(0);

    ReactTestRenderer.act(() => mockOnLocation?.(fix()));
    ReactTestRenderer.act(() => jest.advanceTimersByTime(10_000));
    ReactTestRenderer.act(() =>
      mockOnLocation?.(
        fix({
          latitude: 13.7401,
          timestamp: Date.now(),
          speedKmh: 4,
        }),
      ),
    );
    expect(ctx.activeSession!.distanceKm).toBeGreaterThan(0.01);
    expect(ctx.activeSession!.distanceKm).toBeLessThan(0.013);
  });

  it.each([
    ['poor accuracy', { accuracy: 26 }],
    ['missing accuracy', { accuracy: null }],
    ['invalid latitude', { latitude: 91 }],
    ['invalid longitude', { longitude: Number.NaN }],
    ['stale fix', { timestamp: Date.now() - 10_001 }],
  ])('does not publish or accumulate an invalid %s fix', async (_label, overrides) => {
    const ctx = await renderContext();
    await ReactTestRenderer.act(async () => ctx.startRunSession());

    ReactTestRenderer.act(() => mockOnLocation?.(fix(overrides)));

    expect(ctx.locationFix).toBeNull();
    expect(ctx.activeSession?.trackCoordinates).toEqual([]);
    expect(ctx.activeSession?.distanceKm).toBe(0);
  });

  it('rejects equal/out-of-order timestamps and jumps at short or long intervals', async () => {
    const ctx = await renderContext();
    await ReactTestRenderer.act(async () => ctx.startRunSession());
    const startedAt = Date.now();

    ReactTestRenderer.act(() => mockOnLocation?.(fix({ timestamp: startedAt })));
    ReactTestRenderer.act(() =>
      mockOnLocation?.(fix({ latitude: 13.74001, timestamp: startedAt })),
    );
    expect(ctx.activeSession?.trackCoordinates).toHaveLength(1);

    ReactTestRenderer.act(() => jest.advanceTimersByTime(1_000));
    ReactTestRenderer.act(() =>
      mockOnLocation?.(fix({ latitude: 13.741, timestamp: Date.now() })),
    );
    expect(ctx.activeSession?.trackCoordinates).toHaveLength(1);

    ReactTestRenderer.act(() => jest.advanceTimersByTime(9_000));
    ReactTestRenderer.act(() =>
      mockOnLocation?.(fix({ latitude: 13.741, timestamp: Date.now() })),
    );
    expect(ctx.activeSession?.trackCoordinates).toHaveLength(1);
    expect(ctx.activeSession?.distanceKm).toBe(0);

    ReactTestRenderer.act(() =>
      mockOnLocation?.(
        fix({ latitude: 13.74008, longitude: 100.53005, timestamp: Date.now() + 1 }),
      ),
    );
    expect(ctx.activeSession?.trackCoordinates).toHaveLength(2);
  });

  it('starts a new track segment after a GPS gap and after pause/resume', async () => {
    const ctx = await renderContext();
    await ReactTestRenderer.act(async () => ctx.startRunSession());

    ReactTestRenderer.act(() => mockOnLocation?.(fix()));
    ReactTestRenderer.act(() => jest.advanceTimersByTime(16_000));
    ReactTestRenderer.act(() =>
      mockOnLocation?.(fix({ latitude: 13.741, timestamp: Date.now() })),
    );
    expect(ctx.activeSession?.distanceKm).toBe(0);
    expect(ctx.activeSession?.trackSegments).toHaveLength(2);

    ReactTestRenderer.act(() => ctx.pauseRunSession());
    ReactTestRenderer.act(() => jest.advanceTimersByTime(2_000));
    ReactTestRenderer.act(() =>
      mockOnLocation?.(fix({ latitude: 13.7411, timestamp: Date.now() })),
    );
    ReactTestRenderer.act(() => ctx.resumeRunSession());
    ReactTestRenderer.act(() => jest.advanceTimersByTime(1_000));
    ReactTestRenderer.act(() =>
      mockOnLocation?.(fix({ latitude: 13.7412, timestamp: Date.now() })),
    );

    expect(ctx.activeSession?.trackSegments).toHaveLength(3);
    expect(ctx.activeSession?.distanceKm).toBe(0);
  });

  it('returns a fresh validated one-shot location and rejects stale results', async () => {
    const ctx = await renderContext();
    const current = fix();
    mockGetCurrentTrackedLocation.mockResolvedValueOnce(current);

    let resolved: TrackedLocation | undefined;
    await ReactTestRenderer.act(async () => {
      resolved = await ctx.requestCurrentLocation();
    });
    expect(resolved).toEqual(current);
    expect(ctx.locationFix).toEqual(current);

    ReactTestRenderer.act(() => jest.advanceTimersByTime(11_000));
    mockGetCurrentTrackedLocation.mockResolvedValueOnce(
      fix({ timestamp: Date.now() - 11_000 }),
    );
    await expect(ctx.requestCurrentLocation()).rejects.toThrow(/GPS/);
  });

  it('expires a published GPS fix when no newer callback arrives', async () => {
    const ctx = await renderContext();
    await ReactTestRenderer.act(async () => ctx.startRunSession());

    ReactTestRenderer.act(() =>
      mockOnLocation?.(fix({ speedKmh: 5, timestamp: Date.now() })),
    );
    expect(ctx.locationFix).not.toBeNull();
    expect(ctx.currentLocation).not.toBeNull();
    expect(ctx.currentSpeedKmh).toBe(5);

    ReactTestRenderer.act(() => jest.advanceTimersByTime(10_001));

    expect(ctx.locationFix).toBeNull();
    expect(ctx.currentLocation).toBeNull();
    expect(ctx.currentSpeedKmh).toBe(0);
    expect(ctx.trackingError).toMatch(/GPS/);
  });

  it('does not accumulate slow GPS jitter whose adjacent fixes stay below deadband', async () => {
    const ctx = await renderContext();
    await ReactTestRenderer.act(async () => ctx.startRunSession());
    const baseLatitude = 13.74;

    ReactTestRenderer.act(() =>
      mockOnLocation?.(fix({ latitude: baseLatitude, timestamp: Date.now() })),
    );

    const offsets = [0.000016, 0.000032, 0.000016, 0];
    ReactTestRenderer.act(() => {
      for (let index = 0; index < 60; index += 1) {
        jest.advanceTimersByTime(2_000);
        mockOnLocation?.(
          fix({
            latitude: baseLatitude + offsets[index % offsets.length],
            timestamp: Date.now(),
          }),
        );
      }
    });

    expect(ctx.activeSession?.distanceKm).toBe(0);
  });

  it('finalizes once with immutable session photos, sport and completion reason', async () => {
    const ctx = await renderContext();
    const initialHistoryLength = ctx.runHistory.length;
    await ReactTestRenderer.act(async () => ctx.startRunSession(undefined, 'run'));
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(4_000);
    });
    await ReactTestRenderer.act(async () => {
      await ctx.addSessionPhoto('file:///data/cache/activity-a.jpg');
    });

    let completed: ReturnType<AppContextValue['endRunSession']> = null;
    ReactTestRenderer.act(() => {
      completed = ctx.endRunSession('arrived');
    });
    const snapshot = completed!;
    expect(snapshot.sport).toBe('run');
    expect(snapshot.durationSeconds).toBe(4);
    expect(snapshot.completionReason).toBe('arrived');
    expect(snapshot.photos).toEqual(['file:///data/cache/activity-a.jpg']);
    expect(ctx.endRunSession()).toBeNull();
    expect(ctx.runHistory).toHaveLength(initialHistoryLength + 1);
    expect(mockStopped).toBe(true);

    await ReactTestRenderer.act(async () => ctx.startRunSession());
    ReactTestRenderer.act(() => {
      ctx.endRunSession();
    });
    expect(snapshot.photos).toEqual(['file:///data/cache/activity-a.jpg']);
    expect(ctx.runHistory[initialHistoryLength + 1].photos).toEqual([]);
  });

  it('does not blend prototype mock distance into the active GPS session', async () => {
    const ctx = await renderContext();
    await ReactTestRenderer.act(async () => ctx.startRunSession());

    ReactTestRenderer.act(() => {
      expect(ctx.addMockDistance(1)).toBe(true);
    });

    expect(ctx.activeSession?.steps).toBe(0);
    expect(ctx.activeSession?.distanceKm).toBe(0);
    let completed!: NonNullable<
      ReturnType<AppContextValue['endRunSession']>
    >;
    ReactTestRenderer.act(() => {
      completed = ctx.endRunSession()!;
    });
    expect(completed.steps).toBe(0);
    expect(completed.distanceKm).toBe(0);
    expect(completed.distanceSource).toBe('unavailable');
  });

  it('attaches the accepted location at shutter time to the captured photo', async () => {
    const ctx = await renderContext();
    await ReactTestRenderer.act(async () => ctx.startRunSession());
    ReactTestRenderer.act(() => mockOnLocation?.(fix()));

    let resolveLocation!: (label: string | null) => void;
    mockReverseGeocodeLocation.mockImplementationOnce(
      () => new Promise(resolve => (resolveLocation = resolve)),
    );
    const sessionId = ctx.activeSession!.sessionId;
    let pending!: Promise<void>;
    await ReactTestRenderer.act(async () => {
      pending = ctx.addSessionPhoto(
        'file:///data/cache/queen-sirikit.jpg',
        sessionId,
      );
      await Promise.resolve();
    });

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(1_000);
      mockOnLocation?.(
        fix({ latitude: 13.75, longitude: 100.54, timestamp: Date.now() }),
      );
    });
    resolveLocation?.('สวนสิริกิติ์');
    await ReactTestRenderer.act(async () => {
      await pending;
    });

    expect(mockReverseGeocodeLocation.mock.calls[0]?.[0]).toEqual([
      100.53,
      13.74,
    ]);
    expect(ctx.activeSession?.photos).toEqual([
      'file:///data/cache/queen-sirikit.jpg',
    ]);
    expect(ctx.activeSession?.photoLocations).toEqual({
      'file:///data/cache/queen-sirikit.jpg': 'สวนสิริกิติ์',
    });
  });

  it('keeps the photo in the completed snapshot while reverse geocoding is pending', async () => {
    const ctx = await renderContext();
    await ReactTestRenderer.act(async () => ctx.startRunSession());
    ReactTestRenderer.act(() => mockOnLocation?.(fix()));

    let lookupSignal: AbortSignal | undefined;
    mockReverseGeocodeLocation.mockImplementationOnce((_coords, signal) => {
      lookupSignal = signal;
      return new Promise((_resolve, reject) =>
        signal?.addEventListener('abort', () => reject(new Error('aborted')), {
          once: true,
        }),
      );
    });
    const photoUri = 'file:///data/cache/pending-location.jpg';
    let pending!: Promise<void>;
    await ReactTestRenderer.act(async () => {
      pending = ctx.addSessionPhoto(photoUri, ctx.activeSession!.sessionId);
      await Promise.resolve();
    });

    expect(ctx.activeSession?.photos).toEqual([photoUri]);
    let completed!: NonNullable<
      ReturnType<AppContextValue['endRunSession']>
    >;
    ReactTestRenderer.act(() => {
      completed = ctx.endRunSession()!;
    });
    expect(completed.photos).toEqual([photoUri]);
    expect(lookupSignal?.aborted).toBe(true);

    await ReactTestRenderer.act(async () => {
      await pending;
    });
    expect(ctx.activeSession).toBeNull();
  });
  it('does not attach a stale camera result to a newer session', async () => {
    const ctx = await renderContext();
    await ReactTestRenderer.act(async () => ctx.startRunSession());
    const firstSessionId = ctx.activeSession!.sessionId;
    ReactTestRenderer.act(() => {
      ctx.endRunSession();
    });

    await ReactTestRenderer.act(async () => ctx.startRunSession());
    await ReactTestRenderer.act(async () => {
      await ctx.addSessionPhoto('file:///data/cache/stale.jpg', firstSessionId);
    });
    expect(ctx.activeSession?.photos).toEqual([]);

    await ReactTestRenderer.act(async () => {
      await ctx.addSessionPhoto(
        'file:///data/cache/current.jpg',
        ctx.activeSession!.sessionId,
      );
    });
    expect(ctx.activeSession?.photos).toEqual([
      'file:///data/cache/current.jpg',
    ]);
  });

  it('prevents duplicate starts and handles finish while tracker startup is pending', async () => {
    const trackerModule = jest.requireMock('../src/services/motionTracker') as {
      startMotionTracking: jest.Mock;
    };
    let resolveTracker!: (handle: { stop: jest.Mock }) => void;
    const stop = jest.fn();
    trackerModule.startMotionTracking.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveTracker = resolve;
        }),
    );
    const ctx = await renderContext();

    let firstStart!: Promise<void>;
    await ReactTestRenderer.act(async () => {
      firstStart = ctx.startRunSession();
      await Promise.resolve();
    });
    await ReactTestRenderer.act(async () => ctx.startRunSession());
    expect(trackerModule.startMotionTracking).toHaveBeenCalledTimes(1);

    let completed: ReturnType<AppContextValue['endRunSession']> = null;
    ReactTestRenderer.act(() => {
      completed = ctx.endRunSession();
    });
    expect(completed).not.toBeNull();
    resolveTracker({ stop });
    await ReactTestRenderer.act(async () => firstStart);

    expect(stop).toHaveBeenCalledTimes(1);
    expect(ctx.activeSession).toBeNull();
    expect(ctx.endRunSession()).toBeNull();
  });
});


it('keeps GPS-only distance separate from steps and ignores paused gaps', async () => {
  jest.useFakeTimers({ now: new Date('2026-10-30T00:00:00.000Z') });
  let ctx!: AppContextValue;
  let tree!: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <AppProvider>
        <Consumer onRender={context => (ctx = context)} />
      </AppProvider>,
    );
  });
  await ReactTestRenderer.act(async () => {
    await ctx.startRunSession();
  });

  ReactTestRenderer.act(() => {
    for (let index = 0; index < 200; index += 1) {
      mockOnStep?.();
    }
  });
  expect(ctx.activeSession?.gpsDistanceKm).toBe(0);
  expect(ctx.activeSession?.distanceKm).toBe(0);

  ReactTestRenderer.act(() => {
    mockOnLocation?.(
      fix({ latitude: 13.738, longitude: 100.5235, timestamp: Date.now() }),
    );
    jest.advanceTimersByTime(5_000);
    mockOnLocation?.(
      fix({
        latitude: 13.73808,
        longitude: 100.52358,
        timestamp: Date.now(),
        speedKmh: 4,
      }),
    );
  });
  const gps = ctx.activeSession!.gpsDistanceKm;
  expect(gps).toBeGreaterThan(0.01);
  expect(gps).toBeLessThan(0.02);
  expect(ctx.activeSession?.distanceKm).toBe(gps);

  ReactTestRenderer.act(() => {
    ctx.pauseRunSession();
    ctx.resumeRunSession();
    jest.advanceTimersByTime(16_000);
    mockOnLocation?.(
      fix({
        latitude: 13.75,
        longitude: 100.54,
        timestamp: Date.now(),
        speedKmh: 4,
      }),
    );
  });
  expect(ctx.activeSession?.gpsDistanceKm).toBe(gps);

  let result: ReturnType<AppContextValue['endRunSession']>;
  ReactTestRenderer.act(() => {
    result = ctx.endRunSession();
  });
  expect(result!.gpsDistanceKm).toBe(gps);

  ReactTestRenderer.act(() => tree.unmount());
  jest.useRealTimers();
});
