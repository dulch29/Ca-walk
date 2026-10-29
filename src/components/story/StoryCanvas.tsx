import React, { forwardRef, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { RunSummary } from '../../types/activity';
import { OutsideStoryPage } from './OutsideStoryPage';
import { StepsStoryPage } from './StepsStoryPage';
import { MomentStoryPage } from './MomentStoryPage';
import { RestStoryPage } from './RestStoryPage';
import {
  getStoryPhoto,
  STORY_HEIGHT,
  STORY_WIDTH,
  type StoryPage,
} from './storyModel';
import { PAPER, type StoryImageEvents } from './StoryArtwork';

export type StoryCanvasStatus = {
  ready: boolean;
  photoFailed: boolean;
  assetFailed: boolean;
};
type Props = {
  page: StoryPage;
  summary: Readonly<RunSummary>;
  onStatusChange?: (status: StoryCanvasStatus) => void;
};
const PAGE_IMAGES = [
  ['cat', 'paper', 'paw'],
  ['cat', 'accent', 'fish'],
  ['cat', 'accent', 'star'],
  ['cat', 'paw', 'star', 'sparkle'],
];

export const StoryCanvas = forwardRef<React.ComponentRef<typeof View>, Props>(
  function StoryCanvasView({ page, summary, onStatusChange }, ref) {
    const [failedPhotos, setFailedPhotos] = useState<string[]>([]);
    const [loaded, setLoaded] = useState<string[]>([]);
    const [assetFailed, setAssetFailed] = useState(false);
    const [hasLayout, setHasLayout] = useState(false);
    const available = summary.photos.filter(
      uri => uri.trim() && !failedPhotos.includes(uri),
    );
    const preferred = getStoryPhoto(summary, page);
    const photo =
      preferred && available.includes(preferred)
        ? preferred
        : available[0] ?? null;
    const imageIds = [...PAGE_IMAGES[page]];
    if (photo && page !== 1) {
      imageIds.push('photo');
    }
    if (photo && page === 2) {
      imageIds.push('polaroid');
    }
    const keyFor = (id: string) =>
      id === 'photo' || id === 'polaroid' ? `${id}:${photo}` : id;
    const ready =
      hasLayout &&
      !assetFailed &&
      imageIds.every(id => loaded.includes(keyFor(id)));
    const photoFailed = failedPhotos.length > 0;

    useEffect(() => {
      onStatusChange?.({ ready, photoFailed, assetFailed });
    }, [ready, photoFailed, assetFailed, onStatusChange]);

    const imageEvents: StoryImageEvents = id => ({
      onLoad: () =>
        setLoaded(previous =>
          previous.includes(keyFor(id)) ? previous : [...previous, keyFor(id)],
        ),
      onError: () => {
        if ((id === 'photo' || id === 'polaroid') && photo) {
          setFailedPhotos(previous =>
            previous.includes(photo) ? previous : [...previous, photo],
          );
        } else {
          setAssetFailed(true);
        }
      },
    });
    const props = { summary, photo, imageEvents };
    return (
      <View
        ref={ref}
        collapsable={false}
        testID={`story-canvas-${page}`}
        onLayout={event =>
          setHasLayout(
            event.nativeEvent.layout.width > 0 &&
              event.nativeEvent.layout.height > 0,
          )
        }
        style={styles.canvas}
      >
        {page === 0 && <OutsideStoryPage {...props} />}
        {page === 1 && <StepsStoryPage {...props} />}
        {page === 2 && <MomentStoryPage {...props} />}
        {page === 3 && <RestStoryPage {...props} />}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  canvas: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    backgroundColor: PAPER,
    overflow: 'hidden',
  },
});
