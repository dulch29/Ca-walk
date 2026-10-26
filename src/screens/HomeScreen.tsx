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

  const km = user.redeemableDistanceKm;
  const coins = Math.round(km * 10);
  const daily = quests.filter((q) => q.kind === 'daily');

  const displayStores = merchants.map((m) =>
    merchantToStore(m, currentLocation),
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* 1. Top Bar Greeting & Coin Badge */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greetingTitle}>
            สวัสดี, {user.displayName || 'น้องแมว'} 🐾
          </Text>
          <Text style={styles.greetingSubtitle}>
            ก้าวเล็ก ๆ ที่พาไปไกลกว่าเดิม
          </Text>
        </View>
        <Pressable
          onPress={() => onNavigate('wallet')}
          accessibilityRole="button"
          accessibilityLabel="เหรียญสะสมของคุณ"
          style={styles.coinBadge}
        >
          <Text style={styles.coinBadgeText}>🪙 {coins}</Text>
        </Pressable>
      </View>

      {/* 2. Hero Cat Card with embedded stats */}
      <Pressable
        onPress={petCat}
        accessibilityRole="button"
        accessibilityLabel="ลูบแมวเพื่อเล่นด้วย"
        style={styles.heroCard}
      >
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>
            {mood === 'touch'
              ? 'เมี้ยว~ วันนี้ไปเดินเล่นกันนะ!'
              : 'แตะตัวน้องแมวเพื่อเล่นด้วยกัน'}
          </Text>
        </View>

        <View style={styles.catContainer}>
          <CatAvatar size={130} mood={mood} />
        </View>

        <View style={styles.heroStatsRow}>
          <Pressable
            onPress={() => onNavigate('wallet')}
            style={styles.heroStatItem}
            accessibilityRole="button"
            accessibilityLabel="ระยะทางสะสม"
          >
            <Text style={styles.heroStatLabel}>ระยะสะสม</Text>
            <Text style={styles.heroStatValue}>{km.toFixed(1)} km</Text>
          </Pressable>

          <View style={styles.heroStatDivider} />

          <Pressable
            onPress={() => onNavigate('wallet')}
            style={styles.heroStatItem}
            accessibilityRole="button"
            accessibilityLabel="เหรียญสะสม"
          >
            <Text style={styles.heroStatLabel}>เหรียญ</Text>
            <Text style={styles.heroStatValue}>{coins} 🪙</Text>
          </Pressable>
        </View>
      </Pressable>

      {/* 3. Search Bar Pill */}
      <Pressable
        onPress={() => onNavigate('map')}
        accessibilityRole="search"
        accessibilityLabel="ค้นหาร้านค้า คูปอง หรือสถานที่"
        style={styles.searchBar}
      >
        <Text style={font.body}>🔍</Text>
        <Text style={[styles.searchPlaceholder, styles.flex]}>
          ค้นหาร้านค้า คูปอง หรือสถานที่
        </Text>
        <Text style={styles.searchPillBtn}>สำรวจ</Text>
      </Pressable>

      {/* 4. Special Event Banner (Wireframe Screen 8) */}
      <Pressable
        onPress={() => onNavigate('missions')}
        accessibilityRole="button"
        accessibilityLabel="กิจกรรมพิเศษ สะสมก้าวแลกรางวัล"
        style={styles.eventBanner}
      >
        <Text style={styles.eventIcon}>🎁</Text>
        <View style={styles.flex}>
          <Text style={styles.eventBadge}>Special Event</Text>
          <Text style={styles.eventTitle}>เดินสะสมระยะทางย่านบรรทัดทอง</Text>
          <Text style={styles.eventSubtitle}>
            รับคูปองส่วนลดสูงสุด 50% จากร้านค้าพาร์ทเนอร์
          </Text>
        </View>
      </Pressable>

      {/* 5. Daily Quests ("เควสประจำวัน") */}
      <SectionHeader
        title="เควสประจำวัน"
        onMore={() => onNavigate('missions')}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hList}
      >
        {daily.map((q) => (
          <View key={q.id} style={styles.questCard}>
            <View style={styles.questHeader}>
              <Text style={styles.questIcon}>{q.icon}</Text>
              <Text style={styles.reward}>+{q.reward} 🪙</Text>
            </View>
            <Text style={font.bodyMedium} numberOfLines={2}>
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
              <Text style={font.caption}>
                {q.progress}/{q.goal} {q.unit}
              </Text>
              <Text style={font.caption}>
                {q.progress >= q.goal ? '✓ สำเร็จ' : 'กำลังทำ'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 6. Coupons in Pocket */}
      <SectionHeader
        title="คูปองในกระเป๋าของคุณ"
        onMore={() => onNavigate('coupons')}
      />
      {contextCoupons.length === 0 ? (
        <View style={styles.coupon}>
          <Text style={font.small}>
            🎟️ ยังไม่มีคูปองในกระเป๋า แวะดูร้านค้าแล้วนำระยะทางไปแลกได้เลย!
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
                <Text style={font.h3}>{c.dealTitle}</Text>
                <Text style={font.body}>{c.merchantName}</Text>
                <Text style={font.caption}>
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

      {/* 7. Partner Stores */}
      <SectionHeader
        title="ร้านค้าร่วมรายการ"
        onMore={() => onNavigate('map')}
      />
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
            <Text style={font.bodyMedium} numberOfLines={1}>
              {s.name}
            </Text>
            <Text style={font.caption}>
              📍 {s.km} km ⭐ {s.rating}
            </Text>
            <Text style={styles.storeDealBadge}>แลกส่วนลด</Text>
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
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onMore && (
        <Pressable onPress={onMore} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.exploreLink}>ดูทั้งหมด ›</Text>
        </Pressable>
      )}
    </View>
  );
}
