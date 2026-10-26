import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import BottomTabBar, { TabName } from '../components/BottomTabBar';
import CatAvatar from '../components/CatAvatar';
import { wallet } from '../data/mock';
import { radius } from '../theme';

type Props = {
  onBack: () => void;
  onTabPress?: (tab: TabName) => void;
};

// Wallet Header Icon
function WalletBagIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Path
        d="M 5 9 Q 5 6 8 6 L 20 6 Q 23 6 23 9 L 23 21 Q 23 24 20 24 L 8 24 Q 5 24 5 21 Z"
        fill="#55684B"
      />
      <Path
        d="M 9 6 Q 9 2 14 2 Q 19 2 19 6"
        stroke="#55684B"
        strokeWidth={2}
        fill="none"
      />
      <Circle cx="19" cy="15" r="2.5" fill="#E5A93D" />
    </Svg>
  );
}

// Circular Green Stat Icons
function WalkGreenIcon() {
  return (
    <View style={styles.iconCircleGreen}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="5" r="2.5" fill="#55684B" />
        <Path
          d="M 10 9 L 13 14 L 16 13 M 13 14 L 10 20 M 13 14 L 15 20 M 9 11 L 7 14"
          stroke="#55684B"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function RunGreenIcon() {
  return (
    <View style={styles.iconCircleGreen}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx="14" cy="5" r="2.5" fill="#55684B" />
        <Path
          d="M 13 8 L 10 12 L 6 13 M 10 12 L 14 16 L 11 21 M 13 10 L 17 12 L 20 11 M 14 16 L 18 18"
          stroke="#55684B"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function StepsGreenIcon() {
  return (
    <View style={styles.iconCircleGreen}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M 9 13 C 7.5 13 6.5 14.5 6.5 16.5 C 6.5 18.5 7.8 20 9.5 20 C 11.2 20 12.5 18.5 12.5 16.5 C 12.5 14.5 11 13 9 13 Z"
          fill="#55684B"
        />
        <Path
          d="M 15 6 C 13.5 6 12.5 7.5 12.5 9.5 C 12.5 11.5 13.8 13 15.5 13 C 17.2 13 18.5 11.5 18.5 9.5 C 18.5 7.5 17 6 15 6 Z"
          fill="#55684B"
        />
      </Svg>
    </View>
  );
}

export default function DistanceWalletScreen({ onBack, onTabPress }: Props) {
  const currentKm = wallet.km; // 12.8 km
  const nextGoalKm = wallet.nextGoalKm; // 20 km
  const coins = wallet.coins; // 128
  const pct = Math.min(1, currentKm / nextGoalKm);

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
          hitSlop={12}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <WalletBagIcon />
        <Text style={styles.headerTitle}>Distance Wallet</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Balance Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletTopRow}>
            {/* Mascot Avatar */}
            <View style={styles.avatarWrap}>
              <CatAvatar size={48} mood="sit" />
            </View>

            {/* Distance Number */}
            <Text style={styles.kmNumber}>{currentKm.toFixed(1)} km</Text>

            {/* Coins / Stars */}
            <View style={styles.coinBadge}>
              <Text style={styles.coinSymbol}>≈</Text>
              <Text style={styles.coinAmount}>{coins}</Text>
              <Text style={styles.coinStar}>⭐</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
          </View>

          {/* Goal Label */}
          <Text style={styles.goalLabel}>เป้าหมายถัดไป {nextGoalKm} km</Text>
        </View>

        {/* Section: สถิติรวม */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>สถิติรวม</Text>
        </View>

        <View style={styles.statsCard}>
          {/* Col 1: เดิน */}
          <View style={styles.statCol}>
            <WalkGreenIcon />
            <Text style={styles.statValue}>{wallet.walkKm} km</Text>
            <Text style={styles.statLabel}>เดิน</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Col 2: วิ่ง */}
          <View style={styles.statCol}>
            <RunGreenIcon />
            <Text style={styles.statValue}>{wallet.runKm} km</Text>
            <Text style={styles.statLabel}>วิ่ง</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Col 3: จำนวนก้าว */}
          <View style={styles.statCol}>
            <StepsGreenIcon />
            <Text style={styles.statValue}>{wallet.steps.toLocaleString()}</Text>
            <Text style={styles.statLabel}>จำนวนก้าว</Text>
          </View>
        </View>

        {/* Section: ประวัติการสะสม */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionTitle}>ประวัติการสะสม</Text>
          <Pressable hitSlop={8}>
            <Text style={styles.viewAllTopText}>ดูทั้งหมด ›</Text>
          </Pressable>
        </View>

        <View style={styles.historyCard}>
          {wallet.history.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && <View style={styles.itemDivider} />}
              <View style={styles.historyItemRow}>
                {item.type === 'เดิน' ? <WalkGreenIcon /> : <RunGreenIcon />}
                <View style={styles.historyTextCol}>
                  <Text style={styles.historyType}>{item.type}</Text>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
                <View style={styles.historyCoinBadge}>
                  <Text style={styles.coinEmoji}>🪙</Text>
                  <Text style={styles.historyCoinText}>+{item.coins}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}

          {/* Bottom View All Link */}
          <Pressable hitSlop={8} style={styles.viewAllBottomWrap}>
            <Text style={styles.viewAllBottomText}>ดูทั้งหมด</Text>
          </Pressable>
        </View>

        {/* Mascot Encouragement Bubble */}
        <View style={styles.catEncouragementRow}>
          <CatAvatar size={62} mood="walk" />
          <View style={styles.speechBubble}>
            <View style={styles.bubbleHeaderRow}>
              <Text style={styles.bubbleTitle}>เก่งมากเลย! 🌟</Text>
              <Text style={styles.bubbleChevron}>⌄</Text>
            </View>
            <Text style={styles.bubbleBody}>อีกนิดเดียวก็จะถึงเป้าหมายแล้ว</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Reusable Bottom Navigation Bar */}
      <BottomTabBar activeTab="Home" onTabPress={onTabPress ?? (() => onBack())} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backButton: {
    paddingRight: 6,
    paddingVertical: 4,
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '700',
    color: '#262A22',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#262A22',
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 90,
    gap: 14,
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFE9DE',
    elevation: 3,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    gap: 12,
  },
  walletTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    marginRight: 12,
  },
  kmNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.5,
    flex: 1,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#70756B',
  },
  coinAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#C78923',
  },
  coinStar: {
    fontSize: 16,
  },
  progressTrack: {
    height: 9,
    backgroundColor: '#EFEAE0',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#55684B',
    borderRadius: radius.pill,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8F85',
    textAlign: 'right',
  },
  sectionHeaderWrap: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE9DE',
    elevation: 2,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  iconCircleGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF2E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262A22',
  },
  statLabel: {
    fontSize: 12,
    color: '#8A8F85',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ECE4D8',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  viewAllTopText: {
    fontSize: 13,
    color: '#8A8F85',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE9DE',
    elevation: 2,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyTextCol: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  historyType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#262A22',
  },
  historyDate: {
    fontSize: 12,
    color: '#8A8F85',
  },
  historyCoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinEmoji: {
    fontSize: 14,
  },
  historyCoinText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C78923',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F0EBE0',
    marginVertical: 4,
  },
  viewAllBottomWrap: {
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'center',
  },
  viewAllBottomText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8F85',
  },
  catEncouragementRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
    gap: 12,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECE4D8',
    elevation: 2,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    gap: 2,
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubbleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#262A22',
  },
  bubbleChevron: {
    fontSize: 14,
    color: '#8A8F85',
    fontWeight: '600',
  },
  bubbleBody: {
    fontSize: 12,
    color: '#70756B',
  },
  bottomSpacer: {
    height: 20,
  },
});
