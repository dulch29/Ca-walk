import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppProvider, useAppContext, AppContextValue } from '../src/context/AppContext';

// Mock motionTracker
let mockOnStep: (() => void) | null = null;
let mockOnLocation: ((loc: any) => void) | null = null;
let mockStopped = false;

jest.mock('../src/services/motionTracker', () => ({
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

function Consumer({
  onRender,
}: {
  onRender: (context: AppContextValue) => void;
}) {
  const context = useAppContext();
  onRender(context);
  return null;
}

describe('Activity Tracking Lifecycle in AppContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockOnStep = null;
    mockOnLocation = null;
    mockStopped = false;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('starts session in recording state and increments active duration timer', async () => {
    let ctx!: AppContextValue;
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <AppProvider>
          <Consumer onRender={(c) => (ctx = c)} />
        </AppProvider>,
      );
    });

    expect(ctx.activeSession).toBeNull();

    await ReactTestRenderer.act(async () => {
      await ctx.startRunSession({
        id: 'dest-1',
        name: 'Siam Square',
        coordinates: [100.5315, 13.7445],
      });
    });

    expect(ctx.activeSession).not.toBeNull();
    expect(ctx.activeSession?.status).toBe('recording');
    expect(ctx.activeSession?.destination?.name).toBe('Siam Square');
    expect(ctx.activeSession?.durationSeconds).toBe(0);

    // Fast-forward 5 seconds
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(ctx.activeSession?.durationSeconds).toBe(5);
  });

  it('pausing session stops duration timer and ignores steps/location until resumed', async () => {
    let ctx!: AppContextValue;
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <AppProvider>
          <Consumer onRender={(c) => (ctx = c)} />
        </AppProvider>,
      );
    });

    await ReactTestRenderer.act(async () => {
      await ctx.startRunSession();
    });

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(ctx.activeSession?.durationSeconds).toBe(3);

    // Record step while recording
    ReactTestRenderer.act(() => {
      mockOnStep?.();
    });
    expect(ctx.activeSession?.steps).toBe(1);

    // Pause
    ReactTestRenderer.act(() => {
      ctx.pauseRunSession();
    });
    expect(ctx.activeSession?.status).toBe('paused');

    // Fast-forward 10 seconds while paused (timer should NOT increase duration)
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(ctx.activeSession?.durationSeconds).toBe(3);

    // Step received while paused should be ignored
    ReactTestRenderer.act(() => {
      mockOnStep?.();
    });
    expect(ctx.activeSession?.steps).toBe(1);

    // Resume
    ReactTestRenderer.act(() => {
      ctx.resumeRunSession();
    });
    expect(ctx.activeSession?.status).toBe('recording');

    // Fast-forward 2 more seconds
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(ctx.activeSession?.durationSeconds).toBe(5);

    // Step received after resume should be counted
    ReactTestRenderer.act(() => {
      mockOnStep?.();
    });
    expect(ctx.activeSession?.steps).toBe(2);
  });

  it('filters out low-accuracy GPS fixes (> 35m) to prevent jumps', async () => {
    let ctx!: AppContextValue;
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <AppProvider>
          <Consumer onRender={(c) => (ctx = c)} />
        </AppProvider>,
      );
    });

    await ReactTestRenderer.act(async () => {
      await ctx.startRunSession();
    });

    // Fix 1: accurate
    ReactTestRenderer.act(() => {
      mockOnLocation?.({
        latitude: 13.738,
        longitude: 100.5235,
        accuracy: 10,
        timestamp: 10000,
        speedKmh: 4,
      });
    });

    // Fix 2: bad accuracy (e.g. 50m) - should be discarded
    ReactTestRenderer.act(() => {
      mockOnLocation?.({
        latitude: 13.75,
        longitude: 100.54,
        accuracy: 50,
        timestamp: 12000,
        speedKmh: 10,
      });
    });

    expect(ctx.activeSession?.trackCoordinates).toHaveLength(1);
  });

  it('rejects anomalous GPS jumps through buildings without permanently locking out tracking', async () => {
    let ctx!: AppContextValue;
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <AppProvider>
          <Consumer onRender={(c) => (ctx = c)} />
        </AppProvider>,
      );
    });

    await ReactTestRenderer.act(async () => {
      await ctx.startRunSession();
    });

    // Point 1: Valid initial fix on street
    ReactTestRenderer.act(() => {
      mockOnLocation?.({
        latitude: 13.738,
        longitude: 100.5235,
        accuracy: 8,
        timestamp: 10000,
        speedKmh: 4,
      });
    });
    expect(ctx.activeSession?.trackCoordinates).toHaveLength(1);

    // Point 2: Massive jump 1 second later across buildings (~100 meters away)
    ReactTestRenderer.act(() => {
      mockOnLocation?.({
        latitude: 13.739,
        longitude: 100.5245,
        accuracy: 10,
        timestamp: 11000, // 1 sec later, distance ~150m = 150 m/s >> 6 m/s
        speedKmh: 12,
      });
    });

    // The jump should be rejected from the track polyline
    expect(ctx.activeSession?.trackCoordinates).toHaveLength(1);

    // Point 3: Normal next step along the street 4 seconds later (10 meters away)
    ReactTestRenderer.act(() => {
      mockOnLocation?.({
        latitude: 13.73808,
        longitude: 100.52358,
        accuracy: 8,
        timestamp: 15000,
        speedKmh: 4,
      });
    });

    // Subsequent normal fix is accepted! Tracking was NOT permanently locked out!
    expect(ctx.activeSession?.trackCoordinates).toHaveLength(2);
  });

  it('fuses accelerometer steps so walking distance does not stall at 0.05 km when GPS fixes are lost', async () => {
    let ctx!: AppContextValue;
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <AppProvider>
          <Consumer onRender={(c) => (ctx = c)} />
        </AppProvider>,
      );
    });

    await ReactTestRenderer.act(async () => {
      await ctx.startRunSession();
    });

    // User walks 200 steps (200 * 0.75 = 150m = 0.15 km)
    ReactTestRenderer.act(() => {
      for (let i = 0; i < 200; i++) {
        mockOnStep?.();
      }
    });

    expect(ctx.activeSession?.steps).toBe(200);
    // Distance reflects step fusion (~0.14-0.15 km) rather than staying at 0
    expect(ctx.activeSession?.distanceKm).toBeGreaterThanOrEqual(0.14);
  });

  it('records session photos and finalizes clean summary on endRunSession', async () => {
    let ctx!: AppContextValue;
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <AppProvider>
          <Consumer onRender={(c) => (ctx = c)} />
        </AppProvider>,
      );
    });

    await ReactTestRenderer.act(async () => {
      await ctx.startRunSession();
    });

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(4000);
      ctx.addSessionPhoto('file:///data/cache/test_photo.jpg');
    });

    expect(ctx.activeSession?.photos).toEqual([
      'file:///data/cache/test_photo.jpg',
    ]);

    let completed: any;
    ReactTestRenderer.act(() => {
      completed = ctx.endRunSession();
    });

    expect(completed).not.toBeNull();
    expect(completed.durationSeconds).toBe(4);
    expect(completed.photos).toEqual(['file:///data/cache/test_photo.jpg']);
    expect(ctx.activeSession).toBeNull();
    expect(mockStopped).toBe(true);
  });
});
