import {
  getStoryHeading,
  getStoryPhoto,
  getStoryMetrics,
  getStoryEndTime,
  getStoryLocation,
} from '../src/components/story/storyModel';
import { formatPaceSeconds } from '../src/services/locationUtils';
import { storyFixture } from '../test/fixtures/storySummary';

it('uses the completed sport and real steps, including zero', () => {
  expect(getStoryHeading(1, storyFixture)).toBe('You ran');
  expect(getStoryHeading(1, { ...storyFixture, sport: 'walk' })).toBe(
    'You walked',
  );
  expect(getStoryMetrics({ ...storyFixture, steps: 0 }).steps).toBe('0');
  expect(getStoryMetrics(storyFixture)).toMatchObject({
    distance: '5.00 km',
    duration: '30:00',
    pace: '6:00 /km',
  });
});

it('uses the displayed photo location instead of its destination', () => {
  const summary = {
    ...storyFixture,
    destinationName: 'ร้านกาแฟปลายทาง',
    photos: ['file:///first.jpg', 'file:///queen-sirikit.jpg'],
    photoLocations: {
      'file:///first.jpg': 'สวนลุมพินี',
      'file:///queen-sirikit.jpg': 'สวนสิริกิติ์',
    },
  };
  const displayedPhoto = getStoryPhoto(summary, 2);

  expect(getStoryHeading(2, summary)).toBe('A moment from your run.');
  expect(displayedPhoto).toBe('file:///queen-sirikit.jpg');
  expect(getStoryLocation(summary, displayedPhoto)).toBe('สวนสิริกิติ์');
  expect(
    getStoryLocation(
      { ...summary, photoLocations: {} },
      displayedPhoto,
    ),
  ).toBe('ตำแหน่งที่ถ่ายรูป');
  expect(getStoryLocation(summary, null)).toBe('เส้นทางของคุณ');
  expect(getStoryLocation(summary, displayedPhoto)).not.toContain(
    'ร้านกาแฟปลายทาง',
  );
});

it('uses only session photos and chooses the second for the moment page', () => {
  expect(getStoryPhoto(storyFixture, 0)).toBeNull();
  expect(getStoryPhoto({ ...storyFixture, photos: ['file:///a.jpg'] }, 2)).toBe(
    'file:///a.jpg',
  );
  const summary = {
    ...storyFixture,
    photos: ['', 'file:///a.jpg', 'file:///b.jpg'],
  };
  expect(getStoryPhoto(summary, 0)).toBe('file:///a.jpg');
  expect(getStoryPhoto(summary, 2)).toBe('file:///b.jpg');
  expect(getStoryPhoto(summary, 3)).toBe('file:///a.jpg');
});

it('uses a stable, localized completion time, never the current time', () => {
  const expected = new Date(storyFixture.endTime).toLocaleTimeString(
    undefined,
    { hour: '2-digit', minute: '2-digit', hour12: false },
  );
  jest.useFakeTimers().setSystemTime(new Date('2030-01-01T12:00:00Z'));
  expect(getStoryEndTime(storyFixture)).toBe(expected);
  jest.setSystemTime(new Date('2031-02-02T08:00:00Z'));
  expect(getStoryEndTime(storyFixture)).toBe(expected);
  expect(getStoryEndTime({ ...storyFixture, endTime: 'invalid' })).toBe('--');
  jest.useRealTimers();
});

it('formats pace as minutes and seconds and handles unavailable GPS honestly', () => {
  expect(formatPaceSeconds(360)).toBe('6:00');
  expect(formatPaceSeconds(359.6)).toBe('6:00');
  for (const value of [null, 0, -1, NaN, Infinity]) {
    expect(formatPaceSeconds(value)).toBe('--');
  }
  expect(
    getStoryMetrics({
      ...storyFixture,
      distanceSource: 'unavailable',
      averagePaceSecondsPerKm: null,
    }),
  ).toMatchObject({ distance: 'GPS distance unavailable', pace: '-- /km' });
  expect(
    getStoryMetrics({
      ...storyFixture,
      km: 0,
      steps: 0,
      seconds: 0,
      averagePaceSecondsPerKm: null,
    }),
  ).toMatchObject({
    steps: '0',
    distance: '0.00 km',
    duration: '0:00',
    pace: '-- /km',
  });
});
