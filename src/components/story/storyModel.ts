import type { RunSummary } from '../../types/activity';
import { formatPaceSeconds } from '../../services/locationUtils';

export type StoryPage = 0 | 1 | 2 | 3;
export const STORY_PAGES: StoryPage[] = [0, 1, 2, 3];
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export function getStoryHeading(page: StoryPage, summary: RunSummary): string {
  switch (page) {
    case 0:
      return 'You went\noutside.';
    case 1:
      return summary.sport === 'run' ? 'You ran' : 'You walked';
    case 2:
      return summary.completionReason === 'arrived'
        ? 'Here’s where you went.'
        : `A moment from your ${summary.sport}.`;
    case 3:
      return 'So that’s where\nyou were.';
  }
}

export function getStoryPhoto(
  summary: RunSummary,
  page: StoryPage,
): string | null {
  const photos = summary.photos.filter(uri => uri.trim().length > 0);
  return (page === 2 ? photos[1] ?? photos[0] : photos[0]) ?? null;
}

export function getStoryMetrics(summary: RunSummary) {
  const seconds = Math.max(0, Math.floor(summary.seconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
  const remainder = String(seconds % 60).padStart(2, '0');
  return {
    steps: summary.steps.toLocaleString(),
    distance:
      summary.distanceSource === 'gps'
        ? `${summary.km.toFixed(2)} km`
        : 'GPS distance unavailable',
    duration: hours
      ? `${hours}:${minutes}:${remainder}`
      : `${Math.floor(seconds / 60)}:${remainder}`,
    pace: `${formatPaceSeconds(
      summary.distanceSource === 'gps' ? summary.averagePaceSecondsPerKm : null,
    )} /km`,
  };
}

export function getStoryEndTime(summary: RunSummary): string {
  const date = new Date(summary.endTime);
  return Number.isNaN(date.getTime())
    ? '--'
    : date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
}

export function getStoryLocation(
  summary: RunSummary,
  photo: string | null,
): string {
  if (!photo) {
    return 'เส้นทางของคุณ';
  }
  return summary.photoLocations?.[photo]?.trim() || 'ตำแหน่งที่ถ่ายรูป';
}
