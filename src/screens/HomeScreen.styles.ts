import { StyleSheet } from 'react-native';
import { colors, radius, space } from '../theme';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F2EB', // Warm Cream from screenshot
  },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: 110, // Avoid overlapping floating bottom bar
    gap: space.lg,
  },
  flex: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // 1. Top Bar App Title
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#262A22',
    letterSpacing: -0.5,
    paddingHorizontal: space.xs,
  },

  // 2. Hero Cat Landscape Area
  heroLandscape: {
    width: '100%',
    height: 190,
    borderRadius: 24,
    backgroundColor: '#FAF7EE',
    borderColor: '#ECE4D8',
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  landscapeBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  catAvatarWrapper: {
    zIndex: 3,
    marginBottom: 6,
  },
  speechBubble: {
    position: 'absolute',
    top: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 4,
    elevation: 2,
    zIndex: 10,
  },
  speechText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  // 3. Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E2D7',
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: space.sm,
    color: '#70756B',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: '#8A8F85',
  },
  searchFilterDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E8E2D7',
    marginHorizontal: space.sm,
  },
  searchFilterBtn: {
    paddingHorizontal: space.xs,
  },
  searchFilterIcon: {
    fontSize: 16,
    color: '#555A50',
  },

  // 4. Distance Wallet Card (Dark Sage Olive)
  walletCard: {
    backgroundColor: '#617850', // Deep olive from screenshot
    borderRadius: 22,
    padding: space.lg,
    paddingVertical: space.xl,
    gap: space.sm,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E8F2E4',
  },
  walletMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletDistance: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  walletUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DCE8D6',
  },
  walletArrow: {
    fontSize: 22,
    color: '#DCE8D6',
    fontWeight: '600',
  },
  walletProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.xs,
  },
  walletTrack: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: '#4B5E3C', // darker olive
    overflow: 'hidden',
    flexDirection: 'row',
  },
  walletProgressFillPrimary: {
    height: '100%',
    width: '48%',
    backgroundColor: '#EAE6D8', // warm cream primary segment
  },
  walletProgressFillSecondary: {
    height: '100%',
    width: '24%',
    backgroundColor: '#A8C996', // sage green secondary segment
  },
  walletCoinsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#262A22',
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#70756B',
  },

  // 5. Daily Missions ("ภารกิจวันนี้")
  horizontalList: {
    gap: space.md,
    paddingRight: space.lg,
  },
  missionCard: {
    width: 142,
    backgroundColor: '#FAF6ED', // Warm cream card
    borderColor: '#ECE4D6',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: space.md,
    gap: 6,
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  missionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE4D6',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  missionIcon: {
    fontSize: 18,
  },
  missionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#262A22',
    lineHeight: 18,
  },
  missionProgressText: {
    fontSize: 11,
    color: '#70756B',
  },
  missionTrack: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: '#E6DECE',
    overflow: 'hidden',
    marginVertical: 2,
  },
  missionFill: {
    height: '100%',
    backgroundColor: '#8BA677',
  },
  missionRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  missionRewardText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C78923',
  },

  // 6. My Coupons ("คูปองของฉัน")
  couponTicketCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E2D7',
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  couponImageBanner: {
    height: 85,
    backgroundColor: '#EBE4D5',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: space.sm,
    position: 'relative',
  },
  couponImagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFE7DA',
  },
  couponBannerIcon: {
    fontSize: 24,
  },
  couponStoreBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5DED3',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    zIndex: 2,
  },
  couponStoreBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262A22',
  },
  couponStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: '#5C7A4D',
    zIndex: 2,
  },
  couponStatusPillLocked: {
    backgroundColor: '#7A8075',
  },
  couponStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  couponBody: {
    padding: space.md,
    gap: 4,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262A22',
  },
  couponMerchantName: {
    fontSize: 12,
    color: '#70756B',
  },
  couponExpiry: {
    fontSize: 11,
    color: '#8A8F85',
    marginVertical: 4,
  },
  couponActionBtn: {
    backgroundColor: '#617850',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xs,
  },
  couponActionBtnOutline: {
    backgroundColor: '#FAF6ED',
    borderColor: '#D8CFBF',
    borderWidth: 1,
  },
  couponActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  couponActionBtnTextOutline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555A50',
  },
  // Ticket notches
  notchLeft: {
    position: 'absolute',
    left: -8,
    top: 85,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F7F2EB', // Match root bg
    borderColor: '#E8E2D7',
    borderWidth: 1,
    zIndex: 10,
  },
  notchRight: {
    position: 'absolute',
    right: -8,
    top: 85,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F7F2EB', // Match root bg
    borderColor: '#E8E2D7',
    borderWidth: 1,
    zIndex: 10,
  },

  // 7. Nearby Stores ("ร้านค้าใกล้คุณ")
  storeCard: {
    width: 145,
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E2D7',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  storeBanner: {
    height: 80,
    backgroundColor: '#ECE4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeBannerText: {
    fontSize: 32,
  },
  storeInfo: {
    padding: space.sm,
    gap: 3,
  },
  storeNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#262A22',
    flex: 1,
  },
  storeDistance: {
    fontSize: 11,
    color: '#70756B',
  },
  storeRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  storeRating: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444840',
  },
  storeCardArrow: {
    fontSize: 14,
    color: '#A0A69A',
  },
});
