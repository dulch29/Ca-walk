import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import CatAvatar, { CatMood } from '../components/CatAvatar';
import { coupons, quests, stores, wallet } from '../data/mock';
import { font } from '../theme';
import { styles } from './HomeScreen.styles';

export type HomeTarget = 'wallet' | 'missions' | 'coupons' | 'map' | 'store';

type Props = {
  onNavigate: (target: HomeTarget, storeId?: string) => void;
};

export default function HomeScreen({ onNavigate }: Props) {
  const [mood, setMood] = useState<CatMood>('sit');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const petCat = () => {
    setMood('touch');
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setMood('sit'), 1500);
  };

  const goalPct = Math.min(1, wallet.km / wallet.nextGoalKm);
  const daily = quests.filter(q => q.kind === 'daily');

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={font.title}>Ca-Walk</Text>

      <Pressable
        onPress={petCat}
        accessibilityRole="button"
        accessibilityLabel="ลูบแมว"
        style={styles.catCard}
      >
        <CatAvatar size={120} mood={mood} />
        <Text style={styles.catHint}>
          {mood === 'touch'
            ? 'เมี้ยว~ วันนี้ไปไหนกันดี?'
            : 'แตะเพื่อเล่นกับแมว'}
        </Text>
      </Pressable>

      {/* search is "talking to the cat"; it opens the map */}
      <Pressable
        onPress={() => onNavigate('map')}
        accessibilityRole="search"
        accessibilityLabel="ค้นหาร้านค้า คูปอง หรือสถานที่"
        style={styles.search}
      >
        <Text style={font.body}>🔍</Text>
        <Text style={[font.small, styles.flex]}>
          ค้นหาร้านค้า คูปอง หรือสถานที่
        </Text>
        <Text style={styles.explore}>Explore</Text>
      </Pressable>

      <Pressable
        onPress={() => onNavigate('wallet')}
        accessibilityRole="button"
        accessibilityLabel="กระเป๋าระยะทาง"
        style={styles.walletCard}
      >
        <Text style={styles.walletLabel}>👛 กระเป๋าระยะทาง</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.bigKm}>{wallet.km.toFixed(1)} km</Text>
          <Text style={styles.walletCoins}>≈ {wallet.coins} 🪙</Text>
        </View>
        <View style={styles.trackLight}>
          <View style={[styles.fillLight, { width: `${goalPct * 100}%` }]} />
        </View>
      </Pressable>

      <SectionHeader
        title="🎯 ภารกิจวันนี้"
        onMore={() => onNavigate('missions')}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hList}
      >
        {daily.map(q => (
          <View key={q.id} style={styles.questCard}>
            <Text style={styles.questIcon}>{q.icon}</Text>
            <Text style={font.body} numberOfLines={2}>
              {q.title}
            </Text>
            <Text style={font.small}>
              {q.progress} / {q.goal} {q.unit}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.min(1, q.progress / q.goal) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.reward}>🪙 +{q.reward}</Text>
          </View>
        ))}
      </ScrollView>

      <SectionHeader
        title="🎟️ คูปองของฉัน"
        onMore={() => onNavigate('coupons')}
      />
      {[coupons[0], coupons[3]].map(c => {
        const usable = c.status === 'usable';
        return (
          <View key={c.id} style={styles.coupon}>
            <View style={styles.flex}>
              <Text style={[styles.tag, usable ? styles.tagOn : styles.tagOff]}>
                {usable ? 'ใช้งานได้' : 'ยังไม่ปลดล็อก'}
              </Text>
              <Text style={font.h2}>{c.title}</Text>
              <Text style={font.body}>{c.store}</Text>
              <Text style={font.small}>📅 หมดอายุ {c.expires}</Text>
            </View>
            <Pressable
              onPress={() => onNavigate('coupons')}
              accessibilityRole="button"
              style={[styles.couponBtn, !usable && styles.couponBtnOutline]}
            >
              <Text
                style={
                  usable ? styles.couponBtnText : styles.couponBtnTextOutline
                }
              >
                {usable ? 'ใช้คูปอง' : 'ดูเงื่อนไข'}
              </Text>
            </Pressable>
          </View>
        );
      })}

      <SectionHeader title="📍 ร้านค้าใกล้คุณ" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hList}
      >
        {stores.map(s => (
          <Pressable
            key={s.id}
            onPress={() => onNavigate('store', s.id)}
            accessibilityRole="button"
            accessibilityLabel={s.name}
            style={styles.storeCard}
          >
            <View style={styles.storeImg}>
              <Text style={styles.questIcon}>🏪</Text>
            </View>
            <Text style={font.body}>{s.name}</Text>
            <Text style={font.small}>
              📍 {s.km} km ⭐ {s.rating}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

function SectionHeader({
  title,
  onMore,
}: {
  title: string;
  onMore?: () => void;
}) {
  return (
    <View style={styles.rowBetween}>
      <Text style={font.h2}>{title}</Text>
      {onMore && (
        <Pressable onPress={onMore} accessibilityRole="button" hitSlop={8}>
          <Text style={font.small}>ดูทั้งหมด ›</Text>
        </Pressable>
      )}
    </View>
  );
}
