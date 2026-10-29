import { StyleSheet } from 'react-native';
import { STORY_WIDTH, STORY_HEIGHT } from '../components/story/storyModel';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1EBDD' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 8,
  },
  bars: { flex: 1, flexDirection: 'row', gap: 6 },
  pageButton: { flex: 1, minHeight: 44, justifyContent: 'center' },
  bar: { height: 3, backgroundColor: '#D6D0C4', borderRadius: 2 },
  barOn: { backgroundColor: '#171813' },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 30, color: '#171813' },
  scaledCanvas: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    transformOrigin: 'top left',
  },
  stage: { flex: 1 },
  slide: { height: '100%', alignItems: 'center', justifyContent: 'center' },
  preview: { overflow: 'hidden', borderRadius: 22, backgroundColor: '#F1EBDD' },
  actions: { paddingHorizontal: 28, paddingTop: 10, paddingBottom: 8, gap: 6 },
  shareButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 28,
    backgroundColor: '#171813',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Caveat-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  homeButton: {
    minHeight: 44,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeText: {
    fontSize: 20,
    lineHeight: 26,
    color: '#171813',
    fontFamily: 'Caveat-Regular',
  },
  disabled: { opacity: 0.45 },
  error: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9B2525',
    textAlign: 'center',
  },
  notice: { alignItems: 'center' },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5C564A',
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  retryText: {
    fontSize: 14,
    color: '#171813',
    textDecorationLine: 'underline',
  },
});
