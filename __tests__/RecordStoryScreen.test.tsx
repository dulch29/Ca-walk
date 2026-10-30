import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import RecordStoryScreen from '../src/screens/RecordStoryScreen';
import { StoryCanvas } from '../src/components/story/StoryCanvas';
import { storyFixture } from '../test/fixtures/storySummary';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 }),
}));
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
  releaseCapture: jest.fn(),
}));
jest.mock('react-native-share', () => ({ open: jest.fn() }));

const capture = captureRef as jest.Mock;
const shareOpen = Share.open as jest.Mock;
let tree: ReactTestRenderer.ReactTestRenderer;
const text = () => JSON.stringify(tree.toJSON());
const button = (label: string) =>
  tree.root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];

async function render(summary = storyFixture, extra = {}) {
  await act(async () => {
    tree = ReactTestRenderer.create(
      <RecordStoryScreen
        summary={summary}
        onClose={jest.fn()}
        onHome={jest.fn()}
        {...extra}
      />,
      {
        createNodeMock: element => ({
          storyPage: (element.props as { testID?: string }).testID,
        }),
      },
    );
  });
}

async function loadImages() {
  await act(async () => {
    for (const canvas of tree.root
      .findAllByType(View)
      .filter(node => node.props.testID?.startsWith('story-canvas-'))) {
      canvas.props.onLayout?.({
        nativeEvent: { layout: { width: 1080, height: 1920 } },
      });
    }
    for (const image of tree.root.findAllByType(Image)) {
      image.props.onLoad?.({ nativeEvent: {} });
    }
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  capture.mockResolvedValue('file:///story.png');
  shareOpen.mockResolvedValue({ success: true });
  jest.spyOn(Image, 'getSize').mockImplementation((_uri, success) => {
    success(1080, 1920);
  });
});
afterEach(async () => {
  if (tree) {
    await act(async () => tree.unmount());
  }
  jest.restoreAllMocks();
});

it('shows the displayed Story 3 photo location in both labels', async () => {
  await render({
    ...storyFixture,
    photos: ['file:///first.jpg', 'file:///queen-sirikit.jpg'],
    photoLocations: {
      'file:///first.jpg': 'สวนลุมพินี',
      'file:///queen-sirikit.jpg': 'สวนสิริกิติ์',
    },
  });

  const labels = tree.root
    .findAllByType(Text)
    .filter(node => node.props.children === 'สวนสิริกิติ์');
  expect(labels).toHaveLength(2);
  expect(text()).not.toContain('Your own route');
});

it('renders four artwork-only pages using actual steps, sport and average pace', async () => {
  await render();
  expect(tree.root.findAllByType(StoryCanvas)).toHaveLength(4);
  expect(text()).toContain('You ran');
  expect(text()).toContain('4,200');
  expect(text()).toContain('6:00 /km');
  expect(text()).not.toMatch(/2\.4x|Lumpini|Quest Completed|story_park/);
  for (const canvas of tree.root.findAllByType(StoryCanvas)) {
    expect(
      canvas.findAll(node => node.props.accessibilityRole === 'button'),
    ).toHaveLength(0);
  }
});

it('disables export until artwork is loaded, then captures the selected page as 1080x1920 PNG', async () => {
  await render();
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(true);
  await loadImages();
  await act(async () => button('หน้า Story 3 จาก 4').props.onPress());
  await act(async () => button('แชร์ภาพกิจกรรม').props.onPress());
  expect(capture).toHaveBeenCalledWith(
    expect.objectContaining({
      props: expect.objectContaining({ testID: 'story-canvas-2' }),
    }),
    expect.objectContaining({
      format: 'png',
      width: 1080,
      height: 1920,
      result: 'tmpfile',
    }),
  );
  expect(shareOpen).toHaveBeenCalledWith(
    expect.objectContaining({
      url: 'file:///story.png',
      type: 'image/png',
      failOnCancel: false,
    }),
  );
});

it('locks double taps and page changes until capture and share finish', async () => {
  let resolveCapture!: (uri: string) => void;
  capture.mockImplementation(
    () =>
      new Promise(resolve => {
        resolveCapture = resolve;
      }),
  );
  await render();
  await loadImages();
  await act(async () => {
    button('แชร์ภาพกิจกรรม').props.onPress();
    button('แชร์ภาพกิจกรรม').props.onPress();
  });
  expect(capture).toHaveBeenCalledTimes(1);
  expect(tree.root.findByType(ScrollView).props.scrollEnabled).toBe(false);
  expect(button('หน้า Story 2 จาก 4').props.disabled).toBe(true);
  await act(async () => resolveCapture('file:///story.png'));
  expect(shareOpen).toHaveBeenCalledTimes(1);
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(false);
});

it('treats cancelled sharing as neutral and permits another attempt', async () => {
  shareOpen.mockResolvedValue({ success: false, dismissedAction: true });
  await render();
  await loadImages();
  await act(async () => button('แชร์ภาพกิจกรรม').props.onPress());
  expect(text()).not.toContain('แชร์ไม่สำเร็จ');
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(false);
});

it('reports capture/share failures and permits retry without completing the activity again', async () => {
  capture.mockRejectedValueOnce(new Error('capture failed'));
  await render();
  await loadImages();
  await act(async () => button('แชร์ภาพกิจกรรม').props.onPress());
  expect(text()).toContain('แชร์ไม่สำเร็จ');
  await act(async () => button('แชร์ภาพกิจกรรม').props.onPress());
  expect(shareOpen).toHaveBeenCalledTimes(1);
  shareOpen.mockRejectedValueOnce(new Error('target unavailable'));
  await act(async () => button('แชร์ภาพกิจกรรม').props.onPress());
  expect(text()).toContain('แชร์ไม่สำเร็จ');
});

it('verifies PNG dimensions before opening the native share sheet', async () => {
  jest.spyOn(Image, 'getSize').mockImplementation((_uri, success) => {
    success(360, 640);
  });
  await render();
  await loadImages();
  await act(async () => button('แชร์ภาพกิจกรรม').props.onPress());
  expect(shareOpen).not.toHaveBeenCalled();
  expect(text()).toContain('แชร์ไม่สำเร็จ');
});

it('falls back to another session photo, then no-photo artwork, with an explicit retry', async () => {
  await render({
    ...storyFixture,
    photos: ['file:///missing.jpg', 'file:///good.jpg'],
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    await act(async () => {
      tree.root
        .findAllByType(Image)
        .filter(image => image.props.source?.uri)
        .forEach(image =>
          image.props.onError?.({ nativeEvent: { error: 'missing' } }),
        );
    });
  }
  await loadImages();
  expect(
    tree.root.findAllByType(Image).some(image => image.props.source?.uri),
  ).toBe(false);
  expect(text()).toContain('A little time outside.');
  expect(button('ลองโหลดรูปอีกครั้ง')).toBeDefined();
  await act(async () => button('ลองโหลดรูปอีกครั้ง').props.onPress());
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(true);
});

it('never uses the legacy photo prop or images from the previous session', async () => {
  await render(storyFixture, { photoUri: 'file:///previous-session.jpg' });
  expect(text()).not.toContain('previous-session.jpg');
  await act(async () =>
    tree.update(
      <RecordStoryScreen
        summary={{ ...storyFixture, sessionId: 'next-session', photos: [] }}
        onClose={jest.fn()}
      />,
    ),
  );
  expect(
    tree.root.findAllByType(Image).some(image => image.props.source?.uri),
  ).toBe(false);
});

it('keeps Home and close callbacks separate', async () => {
  const onClose = jest.fn();
  const onHome = jest.fn();
  await render(storyFixture, { onClose, onHome });
  await act(async () => button('กลับหน้า Home').props.onPress());
  expect(onHome).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => button('ปิดหน้า Story').props.onPress());
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('requires all photos, static images and positive layout before enabling share', async () => {
  await render({ ...storyFixture, photos: ['file:///one.jpg'] });
  await act(async () => {
    for (const image of tree.root.findAllByType(Image)) {
      if (!image.props.source?.uri) {
        image.props.onLoad?.({ nativeEvent: {} });
      }
    }
  });
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(true);
  await loadImages();
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(false);
});
it('blocks static image failures and resets loading when retried or session changes', async () => {
  await render();
  await act(async () =>
    tree.root
      .findAllByType(Image)[0]
      .props.onError({ nativeEvent: { error: 'asset' } }),
  );
  await loadImages();
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(true);
  await act(async () => button('ลองโหลดรูปอีกครั้ง').props.onPress());
  await loadImages();
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(false);
  await act(async () =>
    tree.update(
      <RecordStoryScreen
        summary={{ ...storyFixture, sessionId: 'new' }}
        onClose={jest.fn()}
      />,
    ),
  );
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(true);
});
it('preserves seven-digit steps and bounds long photo locations to two lines', async () => {
  const photo = 'file:///long-location.jpg';
  const location = 'ชื่อสถานที่ภาษาไทยยาวมาก'.repeat(8);
  await render({
    ...storyFixture,
    steps: 1234567,
    photos: [photo],
    photoLocations: { [photo]: location },
  });
  expect(text()).toContain('1,234,567');
  const labels = tree.root
    .findAllByType(Text)
    .filter(node => node.props.children === location);
  expect(labels).toHaveLength(2);
  expect(labels.every(node => node.props.numberOfLines === 2)).toBe(true);
});

it('re-enables sharing after a drag ends on the current page without momentum', async () => {
  await render();
  await loadImages();
  const pager = tree.root.findByType(ScrollView);
  await act(async () => pager.props.onScrollBeginDrag());
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(true);
  await act(async () =>
    pager.props.onScrollEndDrag({ nativeEvent: { contentOffset: { x: 0 } } }),
  );
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(false);
  await act(async () => pager.props.onMomentumScrollBegin());
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(true);
  await act(async () =>
    pager.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 0 } } }),
  );
  expect(button('แชร์ภาพกิจกรรม').props.disabled).toBe(false);
});
