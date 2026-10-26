import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { activities } from '../data/meMock';
import { Sport } from './RecordScreen';

type Props = {
  onBack: () => void;
  onOpen: (activityId: string) => void;
};

const FILTERS: { label: string; key: Sport | 'all' }[] = [
  { label: 'ทั้งหมด', key: 'all' },
  { label: 'เดิน', key: 'walk' },
  { label: 'วิ่ง', key: 'run' },
];

function BackArrow() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#262A22" strokeWidth={2.2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

function WalkFigureIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#55684B" strokeWidth={2.2}>
      <Circle cx="13" cy="4" r="2" fill="#55684B" />
      <Path d="M13 6l-2 5 3 4-2 7" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 11l-3 4" strokeLinecap="round" />
      <Path d="M11 11l4-2 3 3" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 15l-3 6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RunFigureIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#55684B" strokeWidth={2.2}>
      <Circle cx="15" cy="4" r="2" fill="#55684B" />
      <Path d="M15 6l-4 4 2 3-5 5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 11l3-1 3-3" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13 13l4 2 2 5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 16l3-2" strokeLinecap="round" />
    </Svg>
  );
}

export default function ActivityHistoryScreen({ onBack, onOpen }: Props) {
  const [filter, setFilter] = useState<Sport | 'all'>('all');
  const [monthIndex, setMonthIndex] = useState(0); // 0 = กันยายน 2568

  const months = ['กันยายน 2568', 'สิงหาคม 2568', 'กรกฎาคม 2568'];

  const filteredList = activities.filter(
    a => filter === 'all' || a.sport === filter,
  );

  return (
    <View style={styles.root}>
      {/* Top Header: ← ประวัติกิจกรรม */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
          hitSlop={12}
          style={styles.backBtn}
        >
          <BackArrow />
        </Pressable>
        <Text style={styles.headerTitle}>ประวัติกิจกรรม</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Tab Pills */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => {
            const isSelected = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isSelected && styles.filterTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Month Selector Bar */}
        <View style={styles.monthBar}>
          <Pressable
            onPress={() => setMonthIndex(prev => Math.min(prev + 1, months.length - 1))}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="เดือนก่อนหน้า"
          >
            <Text style={styles.monthArrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthText}>{months[monthIndex]}</Text>
          <Pressable
            onPress={() => setMonthIndex(prev => Math.max(prev - 1, 0))}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="เดือนถัดไป"
          >
            <Text style={styles.monthArrow}>›</Text>
          </Pressable>
        </View>

        {/* Empty State */}
        {filteredList.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>ยังไม่มีกิจกรรมในหมวดนี้</Text>
          </View>
        )}

        {/* Activity Cards */}
        {filteredList.map(item => {
          const isRun = item.sport === 'run';
          return (
            <Pressable
              key={item.id}
              onPress={() => onOpen(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${isRun ? 'วิ่ง' : 'เดิน'} ${item.km} km ${item.date}`}
              style={styles.activityCard}
            >
              <View style={styles.iconCircle}>
                {isRun ? <RunFigureIcon /> : <WalkFigureIcon />}
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.sportName}>{isRun ? 'วิ่ง' : 'เดิน'}</Text>
                <Text style={styles.distanceValue}>{item.km} km</Text>
                <Text style={styles.dateText}>{item.date}</Text>
              </View>

              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>สำเร็จ</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
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
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.2,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE4D6',
  },
  filterPillActive: {
    backgroundColor: '#55684B',
    borderColor: '#55684B',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#525F4C',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EAE4D6',
    paddingHorizontal: 18,
    paddingVertical: 8,
    shadowColor: '#4A4031',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  monthArrow: {
    fontSize: 22,
    fontWeight: '800',
    color: '#55684B',
    paddingHorizontal: 6,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#262A22',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE4D6',
    padding: 14,
    gap: 14,
    shadowColor: '#4A4031',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF1E7',
    borderWidth: 1,
    borderColor: '#DFE8DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  sportName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6E7869',
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#262A22',
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: 12,
    color: '#8C9486',
    fontWeight: '500',
  },
  badgeSuccess: {
    backgroundColor: '#55684B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#8C9486',
    fontWeight: '600',
  },
});
