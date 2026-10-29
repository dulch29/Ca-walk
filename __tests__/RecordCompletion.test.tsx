import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import RecordScreen from '../src/screens/RecordScreen';
import RecordSummaryScreen from '../src/screens/RecordSummaryScreen';
import { storyFixture } from '../test/fixtures/storySummary';

let mockContext: any;
jest.mock('../src/context/AppContext', () => ({
  useAppContext: () => mockContext,
}));
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
      lastAcceptedLocation: {
        longitude: 100.5,
        latitude: 13.7,
        accuracy: 8,
        speedKmh: 0,
        timestamp: Date.now(),
      },
    },
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
it('explicit arrival finish opens Story only after a fresh destination fix', async () => {
  const onFinish = jest.fn();
  await act(async () => {
    tree = ReactTestRenderer.create(
      <RecordScreen onFinish={onFinish} onCamera={jest.fn()} />,
    );
  });
  await act(async () => press('จบและสร้างสตอรี่'));
  expect(onFinish).toHaveBeenCalledWith(
    expect.objectContaining({ completionReason: 'arrived' }),
    true,
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
