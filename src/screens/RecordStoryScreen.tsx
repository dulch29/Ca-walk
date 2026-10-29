import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import {
  StoryCanvas,
  type StoryCanvasStatus,
} from '../components/story/StoryCanvas';
import {
  STORY_HEIGHT,
  STORY_PAGES,
  STORY_WIDTH,
  type StoryPage,
} from '../components/story/storyModel';
import type { RunSummary } from '../types/activity';
import { styles } from './RecordStoryScreen.styles';

type Props = {
  summary: Readonly<RunSummary>;
  onClose: () => void;
  onHome?: () => void;
};
const INITIAL_STATUS: StoryCanvasStatus = {
  ready: false,
  photoFailed: false,
  assetFailed: false,
};

export default function RecordStoryScreen(props: Props) {
  return <StoryPager key={props.summary.sessionId} {...props} />;
}

function StoryPager({ summary, onClose, onHome }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<StoryPage>(0);
  const [busy, setBusy] = useState(false);
  const busyLock = useRef(false);
  const [paging, setPaging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [statuses, setStatuses] = useState(
    STORY_PAGES.map(() => INITIAL_STATUS),
  );
  const [stageHeight, setStageHeight] = useState(
    Math.max(1, height - insets.top - insets.bottom - 230),
  );
  const slides = useRef<(React.ComponentRef<typeof View> | null)[]>([]);
  const pager = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const previewWidth = Math.min(
    width - 32,
    (stageHeight * STORY_WIDTH) / STORY_HEIGHT,
  );
  const previewHeight = (previewWidth * STORY_HEIGHT) / STORY_WIDTH;
  const scale = previewWidth / STORY_WIDTH;
  const status = statuses[page];
  const canShare = status.ready && !busy && !paging;

  useEffect(() => {
    pager.current?.scrollTo({ x: page * width, animated: false });
  }, [width, page]);

  const updateStatus = useCallback(
    (index: StoryPage, next: StoryCanvasStatus) => {
      setStatuses(previous => {
        const current = previous[index];
        if (
          current.ready === next.ready &&
          current.photoFailed === next.photoFailed &&
          current.assetFailed === next.assetFailed
        ) {
          return previous;
        }
        return previous.map((item, i) => (i === index ? next : item));
      });
    },
    [],
  );

  const share = async () => {
    if (busyLock.current || !canShare) {
      return;
    }
    const node = slides.current[page];
    if (!node) {
      return;
    }
    busyLock.current = true;
    setBusy(true);
    setError(null);
    try {
      const captured = await captureRef(node, {
        format: 'png',
        quality: 1,
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        result: 'tmpfile',
      });
      const uri = captured.startsWith('file://')
        ? captured
        : `file://${captured}`;
      await new Promise<void>((resolve, reject) => {
        Image.getSize(
          uri,
          (w, h) =>
            w === STORY_WIDTH && h === STORY_HEIGHT
              ? resolve()
              : reject(new Error('Unexpected PNG dimensions')),
          reject,
        );
      });
      await Share.open({
        url: uri,
        type: 'image/png',
        title: 'Ca-Walk Story',
        failOnCancel: false,
      });
    } catch {
      setError('แชร์ไม่สำเร็จ ลองอีกครั้ง');
    } finally {
      busyLock.current = false;
      setBusy(false);
    }
  };

  const retryImages = () => {
    if (busyLock.current) {
      return;
    }
    setStatuses(STORY_PAGES.map(() => INITIAL_STATUS));
    setAttempt(previous => previous + 1);
    setError(null);
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.topBar}>
        <View style={styles.bars}>
          {STORY_PAGES.map(index => (
            <Pressable
              key={index}
              style={styles.pageButton}
              onPress={() => {
                if (!busyLock.current) {
                  setPage(index);
                  setPaging(false);
                }
              }}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`หน้า Story ${index + 1} จาก 4`}
              accessibilityState={{ selected: page === index, disabled: busy }}
            >
              <View style={[styles.bar, index <= page && styles.barOn]} />
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={onClose}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="ปิดหน้า Story"
          accessibilityState={{ disabled: busy }}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
      <View
        style={styles.stage}
        onLayout={event => setStageHeight(event.nativeEvent.layout.height)}
      >
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          scrollEnabled={!busy}
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false}
          onScrollBeginDrag={() => setPaging(true)}
          onScrollEndDrag={event => {
            const x = event.nativeEvent.contentOffset.x;
            if (Math.abs(x - Math.round(x / width) * width) < 1) {
              setPage(STORY_PAGES[Math.round(x / width)] ?? 0);
              setPaging(false);
            }
          }}
          onMomentumScrollBegin={() => setPaging(true)}
          onMomentumScrollEnd={event => {
            if (!busyLock.current) {
              setPage(
                STORY_PAGES[
                  Math.round(event.nativeEvent.contentOffset.x / width)
                ] ?? 0,
              );
              setPaging(false);
            }
          }}
        >
          {STORY_PAGES.map(index => (
            <View key={index} style={[styles.slide, { width }]}>
              <View
                style={[
                  styles.preview,
                  { width: previewWidth, height: previewHeight },
                ]}
              >
                <View style={[styles.scaledCanvas, { transform: [{ scale }] }]}>
                  <StoryCanvas
                    key={`${summary.sessionId}:${attempt}:${index}`}
                    ref={node => {
                      slides.current[index] = node;
                    }}
                    page={index}
                    summary={summary}
                    onStatusChange={next => updateStatus(index, next)}
                  />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={styles.actions}>
        {error && (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={styles.error}
          >
            {error}
          </Text>
        )}
        {(status.photoFailed || status.assetFailed) && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              {status.assetFailed
                ? 'โหลดภาพตกแต่งไม่สำเร็จ'
                : 'บางรูปโหลดไม่ได้ ใช้รูปที่เหลือหรือพื้นกระดาษแทน'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="ลองโหลดรูปอีกครั้ง"
              onPress={retryImages}
              disabled={busy}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>ลองโหลดรูปอีกครั้ง</Text>
            </Pressable>
          </View>
        )}
        <Pressable
          style={[styles.shareButton, !canShare && styles.disabled]}
          onPress={share}
          disabled={!canShare}
          accessibilityRole="button"
          accessibilityLabel="แชร์ภาพกิจกรรม"
          accessibilityState={{ disabled: !canShare, busy }}
        >
          <Text style={styles.shareText}>
            {busy
              ? 'กำลังเตรียมภาพ…'
              : !status.ready
              ? 'กำลังโหลดภาพ…'
              : 'Share this story'}
          </Text>
        </Pressable>
        {onHome && (
          <Pressable
            style={styles.homeButton}
            onPress={onHome}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="กลับหน้า Home"
            accessibilityState={{ disabled: busy }}
          >
            <Text style={styles.homeText}>Back to Home</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
