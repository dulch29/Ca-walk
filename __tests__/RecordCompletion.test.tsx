import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import RecordScreen from '../src/screens/RecordScreen';
import RecordSummaryScreen from '../src/screens/RecordSummaryScreen';
import { storyFixture } from '../test/fixtures/storySummary';

let mockContext: any;
jest.mock('../src/context/AppContext', () => ({
  useAppContext: () => mockContext,
}));

jest.mock('@maplibre/maplibre-react-native', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return {
    Map: ({ children }: any) => <View>{children}</View>,
    Camera: ReactModule.forwardRef((_props: any, ref: any) => {
      ReactModule.useImperativeHandle(ref, () => ({
        flyTo: jest.fn(),
        fitBounds: jest.fn(),
        zoomTo: jest.fn(),
      }));
      return null;
    }),
    Marker: ({ children }: any) => <View>{children}</View>,
    GeoJSONSource: ({ children }: any) => <View>{children}</View>,
    Layer: () => null,
  };
});
let tree: ReactTestRenderer.ReactTestRenderer;
const press = (label: string) =>
  tree.root
    .findAll(
      node =>
        node.props.accessibilityLabel === label &&
        typeof node.props.onPress === 'function',
    )[0]
    .props.onPress();
const completed = {
  sessionId: 'live-completed',
  startTime: storyFixture.startTime,
  endTime: storyFixture.endTime,
  durationSeconds: 1800,
  distanceKm: 7,
  gpsDistanceKm: 5,
  steps: 4200,
  averagePace: '4.29 /km',
  photos: ['file:///this-session.jpg'],
  trackCoordinates: [],
  destinationName: 'ร้านทดสอบ',
};
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(Date.parse(storyFixture.endTime));
  const locationFix = {
    longitude: 100.5,
    latitude: 13.7,
    accuracy: 8,
    speedKmh: 0,
    timestamp: Date.now(),
  };
  mockContext = {
    activeSession: {
      ...completed,
      gpsDistanceKm: 5,
      status: 'paused',
      currentPace: '4.29 /km',
      destination: {
        id: 'destination',
        name: 'ร้านทดสอบ',
        coordinates: [100.5, 13.7],
      },
      lastAcceptedLocation: locationFix,
    },
    locationFix: null,
    currentLocation: null,
    selectedDestination: null,
    speedFraudActive: false,
    requestLocationPermission: jest.fn().mockResolvedValue(true),
    endRunSession: jest
      .fn()
      .mockReturnValueOnce(completed)
      .mockReturnValue(null),
  };
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.useRealTimers();
  jest.restoreAllMocks();
});
it('manual finish sends one fixed snapshot and double stop cannot finish twice', async () => {
  const onFinish = jest.fn();
  await act(async () => {
    tree = ReactTestRenderer.create(
      <RecordScreen onFinish={onFinish} onCamera={jest.fn()} />,
    );
  });
  await act(async () => {
    press('จบกิจกรรม');
    press('จบกิจกรรม');
  });
  expect(onFinish).toHaveBeenCalledTimes(1);
  expect(onFinish).toHaveBeenCalledWith(
    expect.objectContaining({
      sessionId: 'live-completed',
      seconds: 1800,
      km: 5,
      averagePaceSecondsPerKm: 360,
      completionReason: 'manual',
      photos: completed.photos,
      endTime: completed.endTime,
    }),
    false,
  );
});
it('requires three distinct fixes over the arrival dwell before offering finish', async () => {
  const onFinish = jest.fn();
  const alertSpy = jest.spyOn(Alert, 'alert');
  mockContext.activeSession = {
    ...mockContext.activeSession,
    status: 'recording',
    durationSeconds: 0,
  };
  mockContext.locationFix = mockContext.activeSession.lastAcceptedLocation;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <RecordScreen onFinish={onFinish} onCamera={jest.fn()} />,
    );
  });

  for (let index = 1; index <= 4; index += 1) {
    await act(async () => {
      mockContext.activeSession = {
        ...mockContext.activeSession,
        durationSeconds: index,
      };
      tree.update(<RecordScreen onFinish={onFinish} onCamera={jest.fn()} />);
    });
  }

  const startedAt = mockContext.locationFix.timestamp;
  await act(async () => {
    jest.setSystemTime(startedAt + 8_000);
    const secondFix = { ...mockContext.locationFix, timestamp: Date.now() };
    mockContext.locationFix = secondFix;
    mockContext.activeSession = {
      ...mockContext.activeSession,
      lastAcceptedLocation: secondFix,
    };
    tree.update(<RecordScreen onFinish={onFinish} onCamera={jest.fn()} />);
  });

  expect(alertSpy.mock.calls.some(call => call[0] === 'ถึงจุดหมายแล้ว')).toBe(false);
  expect(
    tree.root.findAll(node => node.props.accessibilityLabel === 'จบและสร้างสตอรี่'),
  ).toHaveLength(0);

  await act(async () => {
    jest.setSystemTime(startedAt + 9_000);
    const thirdFix = { ...mockContext.locationFix, timestamp: Date.now() };
    mockContext.locationFix = thirdFix;
    mockContext.activeSession = {
      ...mockContext.activeSession,
      lastAcceptedLocation: thirdFix,
    };
    tree.update(<RecordScreen onFinish={onFinish} onCamera={jest.fn()} />);
  });

  expect(alertSpy.mock.calls.some(call => call[0] === 'ถึงจุดหมายแล้ว')).toBe(true);
  await act(async () => press('จบและสร้างสตอรี่'));
  expect(onFinish).toHaveBeenCalledWith(
    expect.objectContaining({ completionReason: 'arrived' }),
    true,
  );
});


it('requires a new dwell after leaving the arrival area without repeating the modal', async () => {
  const onFinish = jest.fn();
  const alertSpy = jest.spyOn(Alert, 'alert');
  mockContext.activeSession = {
    ...mockContext.activeSession,
    status: 'recording',
    durationSeconds: 0,
  };
  mockContext.locationFix = mockContext.activeSession.lastAcceptedLocation;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <RecordScreen onFinish={onFinish} onCamera={jest.fn()} />,
    );
  });

  const startedAt = mockContext.locationFix.timestamp;
  for (const offset of [4_000, 8_000]) {
    await act(async () => {
      jest.setSystemTime(startedAt + offset);
      const nextFix = { ...mockContext.locationFix, timestamp: Date.now() };
      mockContext.locationFix = nextFix;
      mockContext.activeSession = {
        ...mockContext.activeSession,
        lastAcceptedLocation: nextFix,
      };
      tree.update(<RecordScreen onFinish={onFinish} onCamera={jest.fn()} />);
    });
  }

  const arrivalAlerts = () =>
    alertSpy.mock.calls.filter(call => call[0] === 'ถึงจุดหมายแล้ว');
  expect(arrivalAlerts()).toHaveLength(1);

  await act(async () => {
    jest.setSystemTime(startedAt + 9_000);
    const outsideFix = {
      ...mockContext.locationFix,
      longitude: 100.6,
      timestamp: Date.now(),
    };
    mockContext.locationFix = outsideFix;
    mockContext.activeSession = {
      ...mockContext.activeSession,
      lastAcceptedLocation: outsideFix,
    };
    tree.update(<RecordScreen onFinish={onFinish} onCamera={jest.fn()} />);
  });

  await act(async () => {
    jest.setSystemTime(startedAt + 10_000);
    const reentryFix = {
      ...mockContext.locationFix,
      longitude: 100.5,
      timestamp: Date.now(),
    };
    mockContext.locationFix = reentryFix;
    mockContext.activeSession = {
      ...mockContext.activeSession,
      lastAcceptedLocation: reentryFix,
    };
    tree.update(<RecordScreen onFinish={onFinish} onCamera={jest.fn()} />);
  });

  expect(
    tree.root.findAll(node => node.props.accessibilityLabel === 'จบและสร้างสตอรี่'),
  ).toHaveLength(0);

  for (const offset of [14_000, 18_000]) {
    await act(async () => {
      jest.setSystemTime(startedAt + offset);
      const nextFix = { ...mockContext.locationFix, timestamp: Date.now() };
      mockContext.locationFix = nextFix;
      mockContext.activeSession = {
        ...mockContext.activeSession,
        lastAcceptedLocation: nextFix,
      };
      tree.update(<RecordScreen onFinish={onFinish} onCamera={jest.fn()} />);
    });
  }

  expect(
    tree.root.findAll(node => node.props.accessibilityLabel === 'จบและสร้างสตอรี่')
      .length,
  ).toBeGreaterThan(0);
  expect(arrivalAlerts()).toHaveLength(1);
  expect(onFinish).not.toHaveBeenCalled();
});

it('rechecks the latest fix when arrival confirmation is pressed', async () => {
  const onFinish = jest.fn();
  const alertSpy = jest.spyOn(Alert, 'alert');
  mockContext.activeSession = {
    ...mockContext.activeSession,
    status: 'recording',
  };
  mockContext.locationFix = mockContext.activeSession.lastAcceptedLocation;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <RecordScreen onFinish={onFinish} onCamera={jest.fn()} />,
    );
  });

  const startedAt = mockContext.locationFix.timestamp;
  for (const offset of [4_000, 8_000]) {
    await act(async () => {
      jest.setSystemTime(startedAt + offset);
      const nextFix = { ...mockContext.locationFix, timestamp: Date.now() };
      mockContext.locationFix = nextFix;
      mockContext.activeSession = {
        ...mockContext.activeSession,
        lastAcceptedLocation: nextFix,
      };
      tree.update(<RecordScreen onFinish={onFinish} onCamera={jest.fn()} />);
    });
  }

  const arrivalAlert = alertSpy.mock.calls.find(call => call[0] === 'ถึงจุดหมายแล้ว');
  const confirmArrival = arrivalAlert?.[2]?.find(
    (button: { text?: string }) => button.text === 'จบกิจกรรม',
  )?.onPress;
  expect(confirmArrival).toEqual(expect.any(Function));
  if (!confirmArrival) {
    throw new Error('Missing arrival confirmation action');
  }

  await act(async () => {
    jest.setSystemTime(startedAt + 9_000);
    const outsideFix = {
      ...mockContext.locationFix,
      longitude: 100.6,
      timestamp: Date.now(),
    };
    mockContext.locationFix = outsideFix;
    mockContext.activeSession = {
      ...mockContext.activeSession,
      lastAcceptedLocation: outsideFix,
    };
    tree.update(<RecordScreen onFinish={onFinish} onCamera={jest.fn()} />);
  });
  await act(async () => confirmArrival());

  expect(mockContext.endRunSession).not.toHaveBeenCalled();
  expect(onFinish).not.toHaveBeenCalled();
  expect(alertSpy).toHaveBeenCalledWith(
    'ยังยืนยันจุดหมายไม่ได้',
    expect.any(String),
  );
});
it('does not offer arrival completion from destination name alone', async () => {
  mockContext.activeSession.lastAcceptedLocation = undefined;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <RecordScreen onFinish={jest.fn()} onCamera={jest.fn()} />,
    );
  });
  expect(
    tree.root.findAll(
      node => node.props.accessibilityLabel === 'จบและสร้างสตอรี่',
    ),
  ).toHaveLength(0);
});
it('Summary uses the same completed timestamps and pace when reopened later', async () => {
  jest.setSystemTime(new Date('2030-01-01T12:00:00Z'));
  await act(async () => {
    tree = ReactTestRenderer.create(
      <RecordSummaryScreen
        summary={storyFixture}
        onBack={jest.fn()}
        onStory={jest.fn()}
      />,
    );
  });
  const text = JSON.stringify(tree.toJSON());
  expect(text).toContain('2569');
  expect(text).not.toContain('2573');
  expect(text).toContain('6:00');
});
