import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import CatAvatar, { CatMood } from '../components/CatAvatar';
import { useAppContext } from '../context/AppContext';
import { quests } from '../data/mock';
import { merchantToStore } from '../services/storeAdapter';
import { font } from '../theme';
import { styles } from './HomeScreen.styles';

export type HomeTarget = 'wallet' | 'missions' | 'coupons' | 'map' | 'store';

type Props = {
  onNavigate: (target: HomeTarget, storeId?: string) => void;
};

export default function HomeScreen({ onNavigate }: Props) {
  const { user, merchants, coupons: contextCoupons, currentLocation } =
    useAppContext();
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

  const nextGoalKm = 10.0;
  const km = user.redeemableDistanceKm;
  const coins = Math.round(km * 10);
  const goalPct = Math.min(1, km / nextGoalKm);
  const daily = quests.filter((q) => q.kind === 'daily');

  const displayStores = merchants.map((m) =>
    merchantToStore(m, currentLocation),
  );

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
          <Text style={styles.bigKm}>{km.toFixed(1)} km</Text>
          <Text style={styles.walletCoins}>≈ {coins} 🪙</Text>
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
        {daily.map((q) => (
          <View key={q.id} style={styles.questCard}>
            <Text style={styles.questIcon}>{q.icon}</Text>
            <Text style={font.body} numberOfLines={2}>
              {q.title}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.min(1, q.progress / q.goal) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.rowBetween}>
              <Text style={font.small}>
                {q.progress}/{q.goal} {q.unit}
              </Text>
              <Text style={styles.reward}>+{q.reward} 🪙</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <SectionHeader
        title="🎟️ คูปองในกระเป๋าของคุณ"
        onMore={() => onNavigate('coupons')}
      />
      {contextCoupons.length === 0 ? (
        <View style={styles.coupon}>
          <Text style={font.small}>
            ยังไม่มีคูปองในกระเป๋า แวะดูร้านค้าแล้วนำระยะทางไปแลกได้เลย!
          </Text>
        </View>
      ) : (
        contextCoupons.slice(0, 2).map((c) => {
          const usable = c.status === 'unlocked';
          return (
            <View key={c.couponId} style={styles.coupon}>
              <View style={styles.flex}>
                <Text
                  style={[styles.tag, usable ? styles.tagOn : styles.tagOff]}
                >
                  {usable ? 'ใช้งานได้' : 'ใช้แล้ว'}
                </Text>
                <Text style={font.h2}>{c.dealTitle}</Text>
                <Text style={font.body}>{c.merchantName}</Text>
                <Text style={font.small}>
                  📅 หมดอายุ{' '}
                  {new Date(c.expiresAt).toLocaleDateString('th-TH')}
                </Text>
              </View>
              <Pressable
                onPress={() => onNavigate('coupons')}
                accessibilityRole="button"
                style={[
                  styles.couponBtn,
                  !usable && styles.couponBtnOutline,
                ]}
              >
                <Text
                  style={
                    usable ? styles.couponBtnText : styles.couponBtnTextOutline
                  }
                >
                  {usable ? 'ใช้คูปอง' : 'ดูรหัส'}
                </Text>
              </Pressable>
            </View>
          );
        })
      )}

      <SectionHeader title="📍 ร้านค้าใกล้คุณ" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hList}
      >
        {displayStores.map((s) => (
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
          <Text style={styles.explore}>ทั้งหมด ›</Text>
        </Pressable>
      )}
    </View>
  );
}
