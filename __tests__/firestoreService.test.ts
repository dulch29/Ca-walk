import {
  __testing,
  getUserProfile,
  listRunActivities,
  saveRunActivity,
} from '../src/services/firestoreService';

jest.mock('../src/services/firebase', () => ({
  getCurrentFirebaseUser: jest.fn(),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  FieldValue: { serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })) },
  collection: jest.fn((...args: unknown[]) => ({ kind: 'collection', args })),
  doc: jest.fn((...args: unknown[]) => ({ kind: 'doc', args })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(() => ({ kind: 'firestore' })),
  limit: jest.fn((value: number) => ({ kind: 'limit', value })),
  orderBy: jest.fn((field: string, direction: string) => ({ kind: 'orderBy', field, direction })),
  query: jest.fn((...args: unknown[]) => ({ kind: 'query', args })),
  setDoc: jest.fn(),
}));

const firebaseMocks = jest.requireMock('../src/services/firebase') as {
  getCurrentFirebaseUser: jest.Mock;
};
const firestoreMocks = jest.requireMock('@react-native-firebase/firestore') as {
  getDoc: jest.Mock;
  getDocs: jest.Mock;
  setDoc: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  firebaseMocks.getCurrentFirebaseUser.mockReturnValue({ uid: 'user-1' });
  firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });
  firestoreMocks.getDocs.mockResolvedValue({ forEach: () => undefined });
  firestoreMocks.setDoc.mockResolvedValue(undefined);
});

test('maps Firestore timestamps and rejects invalid numeric activity data', () => {
  const timestamp = { toDate: () => new Date('2026-10-25T00:00:00.000Z') };
  expect(
    __testing.mapRunActivity('run-1', {
      sessionId: 'run-1',
      startedAt: timestamp,
      endedAt: timestamp,
      steps: 10,
      distanceKm: 0.01,
      durationSeconds: 12,
      averagePace: '20\'00" /km',
    }),
  ).toMatchObject({ sessionId: 'run-1', steps: 10, startTime: '2026-10-25T00:00:00.000Z' });
  expect(
    __testing.mapRunActivity('bad', {
      startedAt: timestamp,
      endedAt: timestamp,
      steps: Number.NaN,
      distanceKm: 1,
      durationSeconds: 10,
      averagePace: '-- /km',
    }),
  ).toBeNull();
});

test('requires the signed-in owner for reads and writes', async () => {
  firebaseMocks.getCurrentFirebaseUser.mockReturnValue(null);
  await expect(getUserProfile('user-1')).rejects.toThrow('authentication');
  await expect(listRunActivities('user-1')).rejects.toThrow('authentication');
  await expect(
    saveRunActivity('user-1', {
      sessionId: 'run-1',
      startTime: '2026-10-25T00:00:00.000Z',
      endTime: '2026-10-25T00:01:00.000Z',
      durationSeconds: 60,
      steps: 100,
      distanceKm: 0.075,
      averagePace: '13\'20" /km',
    }),
  ).rejects.toThrow('authentication');
});

test('saves a validated run activity with server timestamps', async () => {
  const id = await saveRunActivity('user-1', {
    sessionId: 'run-1',
    sport: 'run',
    startTime: '2026-10-25T00:00:00.000Z',
    endTime: '2026-10-25T00:01:00.000Z',
    durationSeconds: 60,
    steps: 100,
    distanceKm: 0.075,
    averagePace: '13\'20" /km',
    averagePaceSecondsPerKm: 800,
    distanceSource: 'gps',
    completionReason: 'arrived',
  });
  expect(id).toBe('run-1');
  expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);
  expect(firestoreMocks.setDoc.mock.calls[0][1]).toMatchObject({
    sessionId: 'run-1',
    sport: 'run',
    steps: 100,
    distanceKm: 0.075,
    averagePaceSecondsPerKm: 800,
    distanceSource: 'gps',
    completionReason: 'arrived',
  });
});

test('maps new numeric fields while remaining compatible with old activities', () => {
  const timestamp = { toDate: () => new Date('2026-10-25T00:00:00.000Z') };
  const mapped = __testing.mapRunActivity('run-new', {
    startedAt: timestamp,
    endedAt: timestamp,
    sport: 'run',
    steps: 100,
    distanceKm: 5,
    durationSeconds: 1800,
    averagePace: '6:00 /km',
    averagePaceSecondsPerKm: 360,
    distanceSource: 'gps',
    completionReason: 'manual',
  });
  expect(mapped).toMatchObject({
    sport: 'run',
    averagePaceSecondsPerKm: 360,
    distanceSource: 'gps',
    completionReason: 'manual',
  });
});
