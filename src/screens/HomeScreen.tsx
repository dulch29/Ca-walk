import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import CatAvatar, { CatMood } from '../components/CatAvatar';
import { useAppContext } from '../context/AppContext';
import { merchantToStore } from '../services/storeAdapter';
import { styles } from './HomeScreen.styles';

export type HomeTarget = 'wallet' | 'missions' | 'coupons' | 'map' | 'store';

type Props = {
  onNavigate: (target: HomeTarget, storeId?: string) => void;
};

// Missions data matching the screenshot
const MISSIONS = [
  {
    id: 'm1',
    icon: '👟',
    title: 'เดินครบ 5 km',
    progressText: '3.2 / 5 km',
    progressPct: 0.64,
    reward: 20,
  },
  {
    id: 'm2',
    icon: '🏃',
    title: 'วิ่งต่อเนื่อง 20 นาที',
    progressText: '0 / 20 นาที',
    progressPct: 0,
    reward: 30,
  },
  {
    id: 'm3',
    icon: '🏪',
    title: 'ไปที่ร้านกาแฟ',
    progressText: '0 / 1 ครั้ง',
    progressPct: 0,
    reward: 50,
  },
  {
    id: 'm4',
    icon: '⭐',
    title: 'ทำภารกิจสะสม',
    progressText: '1 / 3',
    progressPct: 0.33,
    reward: 100,
  },
];

// Display coupons matching screenshot
const DEMO_COUPONS = [
  {
    id: 'c1',
    badgeText: 'ใช้งานได้',
    isUsable: true,
    title: 'ส่วนลด 20%',
    merchantName: '7-Eleven',
    brandBadge: '7',
    brandColor: '#008450',
    expiry: '📅 หมดอายุ 30 ก.ย. 2568',
    actionText: 'ใช้คูปอง',
  },
  {
    id: 'c2',
    badgeText: 'ยังไม่ปลดล็อค',
    isUsable: false,
    title: 'ส่วนลด 50%',
    merchantName: 'Cafe Amazon',
    brandBadge: '☕',
    brandColor: '#204E2D',
    expiry: '📅 หมดอายุ 30 ก.ย. 2568',
    actionText: 'ดูเงื่อนไข',
  },
];

// Graphic storefront banners matching reference screenshot
function StorefrontGraphic({
  type,
  height = 85,
}: {
  type: '7eleven' | 'amazon' | 'kfc' | 'default';
  height?: number;
}) {
  if (type === '7eleven') {
    return (
      <Svg width="100%" height={height} viewBox="0 0 220 85" preserveAspectRatio="none">
        <Rect x="0" y="0" width="220" height="85" fill="#EAE5DA" />
        <Rect x="15" y="16" width="190" height="69" fill="#FFFFFF" rx="4" />
        <Rect x="15" y="16" width="190" height="7" fill="#EE7623" />
        <Rect x="15" y="23" width="190" height="5" fill="#008450" />
        <Rect x="15" y="28" width="190" height="4" fill="#ED1C24" />
        <Rect x="25" y="40" width="55" height="38" fill="#E2EBF0" rx="2" />
        <Rect x="90" y="40" width="40" height="45" fill="#D3E5EC" rx="2" />
        <Rect x="140" y="40" width="55" height="38" fill="#E2EBF0" rx="2" />
        <Rect x="94" y="20" width="32" height="18" rx="3" fill="#FFFFFF" stroke="#008450" strokeWidth="1" />
        <Path d="M102 23 L116 23 L109 35" stroke="#ED1C24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M104 29 L114 29" stroke="#008450" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (type === 'amazon') {
    return (
      <Svg width="100%" height={height} viewBox="0 0 220 85" preserveAspectRatio="none">
        <Rect x="0" y="0" width="220" height="85" fill="#3B5338" />
        <Circle cx="25" cy="20" r="30" fill="#2E422C" opacity={0.7} />
        <Circle cx="195" cy="20" r="35" fill="#2E422C" opacity={0.7} />
        <Rect x="15" y="22" width="190" height="63" fill="#3D2B1D" rx="4" />
        <Rect x="20" y="26" width="180" height="5" fill="#523A27" />
        <Rect x="35" y="14" width="150" height="22" rx="4" fill="#1B432C" stroke="#DCA236" strokeWidth="1" />
        <Circle cx="55" cy="25" r="5" fill="#F4B02A" />
        <Rect x="68" y="22" width="75" height="6" rx="3" fill="#EAE5D8" />
        <Rect x="30" y="44" width="50" height="35" fill="#FDF4DC" rx="2" opacity={0.9} />
        <Rect x="90" y="44" width="40" height="41" fill="#FDF4DC" rx="2" opacity={0.9} />
        <Rect x="140" y="44" width="50" height="35" fill="#FDF4DC" rx="2" opacity={0.9} />
      </Svg>
    );
  }
  if (type === 'kfc') {
    return (
      <Svg width="100%" height={height} viewBox="0 0 220 85" preserveAspectRatio="none">
        <Rect x="0" y="0" width="220" height="85" fill="#E8DEC9" />
        <Rect x="15" y="14" width="190" height="24" rx="3" fill="#A3080C" />
        <Rect x="30" y="14" width="15" height="24" fill="#FFFFFF" />
        <Rect x="65" y="14" width="15" height="24" fill="#FFFFFF" />
        <Rect x="100" y="14" width="15" height="24" fill="#FFFFFF" />
        <Rect x="135" y="14" width="15" height="24" fill="#FFFFFF" />
        <Rect x="170" y="14" width="15" height="24" fill="#FFFFFF" />
        <Rect x="25" y="44" width="55" height="36" fill="#F3EFE6" rx="2" />
        <Rect x="90" y="44" width="40" height="41" fill="#E5DEC9" rx="2" />
        <Rect x="140" y="44" width="55" height="36" fill="#F3EFE6" rx="2" />
        <Rect x="90" y="18" width="30" height="16" rx="3" fill="#A3080C" stroke="#FFFFFF" strokeWidth="1" />
        <Circle cx="105" cy="26" r="4.5" fill="#FFFFFF" />
      </Svg>
    );
  }
  return (
    <View style={styles.couponImagePlaceholder}>
      <Text style={styles.couponBannerIcon}>🏪</Text>
    </View>
  );
}

export default function HomeScreen({ onNavigate }: Props) {
  const { user, merchants, currentLocation } = useAppContext();
  const [mood, setMood] = useState<CatMood>('sit');
  const [bubble, setBubble] = useState<string | null>(null);
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
    setMood('jump');
    setBubble('เมี้ยว~ วันนี้เดินเก่งจังเลย!');
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      setMood('sit');
      setBubble(null);
    }, 1800);
  };

  const km = user.redeemableDistanceKm > 0 ? user.redeemableDistanceKm : 12.8;
  const coins = Math.round(km * 10);
  const displayStores = merchants.map((m) =>
    merchantToStore(m, currentLocation),
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* 1. App Title */}
      <Text style={styles.appTitle}>Ca-Walk</Text>

      {/* 2. Hero Cat Landscape Area */}
      <Pressable
        onPress={petCat}
        accessibilityRole="button"
        accessibilityLabel="ลูบแมวเพื่อเล่นด้วย"
        style={styles.heroLandscape}
      >
        {/* Soft Landscape Silhouette Backdrop */}
        <View style={styles.landscapeBackdrop}>
          <Svg height="100%" width="100%" viewBox="0 0 340 190" preserveAspectRatio="none">
            {/* Distant misty hills */}
            <Path
              d="M 0 110 Q 70 80 150 100 Q 240 120 340 85 L 340 190 L 0 190 Z"
              fill="#EBF3E6"
            />
            {/* Misty tree silhouettes */}
            <Circle cx="35" cy="115" r="22" fill="#DCE7D6" opacity={0.7} />
            <Circle cx="70" cy="120" r="18" fill="#DCE7D6" opacity={0.6} />
            <Circle cx="280" cy="100" r="24" fill="#DCE7D6" opacity={0.7} />
            <Circle cx="315" cy="108" r="20" fill="#DCE7D6" opacity={0.6} />
            {/* Gentle foreground meadow */}
            <Path
              d="M 0 135 Q 110 120 220 138 Q 285 148 340 130 L 340 190 L 0 190 Z"
              fill="#D6E5CE"
            />
            {/* Soft ground line */}
            <Rect x="0" y="165" width="340" height="25" fill="#CADBBE" />
          </Svg>
        </View>

        {/* Speech Bubble */}
        {bubble && (
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{bubble}</Text>
          </View>
        )}

        {/* Animated Cat sitting in landscape */}
        <View style={styles.catAvatarWrapper}>
          <CatAvatar size={160} mood={mood} />
        </View>
      </Pressable>

      {/* 3. Search Bar Pill with Filter Icon */}
      <Pressable
        onPress={() => onNavigate('map')}
        accessibilityRole="search"
        accessibilityLabel="ค้นหาร้านค้า คูปอง หรือสถานที่"
        style={styles.searchBar}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>
          ค้นหาร้านค้า คูปอง หรือสถานที่
        </Text>
        <View style={styles.searchFilterDivider} />
        <View style={styles.searchFilterBtn}>
          <Text style={styles.searchFilterIcon}>🎚️</Text>
        </View>
      </Pressable>

      {/* 4. Distance Wallet Card ("กระเป๋าระยะทาง") */}
      <Pressable
        onPress={() => onNavigate('wallet')}
        accessibilityRole="button"
        accessibilityLabel="กระเป๋าระยะทาง"
        style={styles.walletCard}
      >
        <View style={styles.walletHeaderRow}>
          <Text style={styles.walletTitle}>👛 กระเป๋าระยะทาง</Text>
        </View>

        <View style={styles.walletMainRow}>
          <Text style={styles.walletDistance}>
            {km.toFixed(1)} <Text style={styles.walletUnit}>km</Text>
          </Text>
          <Text style={styles.walletArrow}>›</Text>
        </View>

        <View style={styles.walletProgressRow}>
          <View style={styles.walletTrack}>
            <View style={styles.walletProgressFillPrimary} />
            <View style={styles.walletProgressFillSecondary} />
          </View>
          <Text style={styles.walletCoinsText}>≈ {coins} 🪙</Text>
        </View>
      </Pressable>

      {/* 5. Daily Missions ("ภารกิจวันนี้") */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIcon}>🎯</Text>
          <Text style={styles.sectionTitle}>ภารกิจวันนี้</Text>
        </View>
        <Pressable
          onPress={() => onNavigate('missions')}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.seeAllLink}>ดูทั้งหมด ›</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {MISSIONS.map((m) => (
          <View key={m.id} style={styles.missionCard}>
            <View style={styles.missionIconWrapper}>
              <Text style={styles.missionIcon}>{m.icon}</Text>
            </View>
            <Text style={styles.missionTitle} numberOfLines={2}>
              {m.title}
            </Text>
            <Text style={styles.missionProgressText}>{m.progressText}</Text>
            <View style={styles.missionTrack}>
              <View
                style={[
                  styles.missionFill,
                  { width: `${m.progressPct * 100}%` },
                ]}
              />
            </View>
            <View style={styles.missionRewardBadge}>
              <Text style={styles.missionRewardText}>🪙 +{m.reward}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 6. My Coupons ("คูปองของฉัน") */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIcon}>💸</Text>
          <Text style={styles.sectionTitle}>คูปองของฉัน</Text>
        </View>
        <Pressable
          onPress={() => onNavigate('coupons')}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.seeAllLink}>ดูทั้งหมด ›</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {DEMO_COUPONS.map((c) => (
          <View key={c.id} style={styles.couponTicketCard}>
            {/* Top Banner with Store badge and Status pill */}
            <View style={styles.couponImageBanner}>
              <StorefrontGraphic
                type={c.id === 'c1' ? '7eleven' : 'amazon'}
                height={85}
              />

              <View style={styles.couponStoreBadge}>
                <Text
                  style={[
                    styles.couponStoreBadgeText,
                    { color: c.brandColor },
                  ]}
                >
                  {c.brandBadge}
                </Text>
              </View>

              <View
                style={[
                  styles.couponStatusPill,
                  !c.isUsable && styles.couponStatusPillLocked,
                ]}
              >
                <Text style={styles.couponStatusText}>{c.badgeText}</Text>
              </View>
            </View>

            {/* Ticket Notches for perforated look */}
            <View style={styles.notchLeft} />
            <View style={styles.notchRight} />

            {/* Coupon Content */}
            <View style={styles.couponBody}>
              <Text style={styles.couponTitle}>{c.title}</Text>
              <Text style={styles.couponMerchantName}>{c.merchantName}</Text>
              <Text style={styles.couponExpiry}>{c.expiry}</Text>

              <Pressable
                onPress={() => onNavigate('coupons')}
                accessibilityRole="button"
                accessibilityLabel={c.actionText}
                style={[
                  styles.couponActionBtn,
                  !c.isUsable && styles.couponActionBtnOutline,
                ]}
              >
                <Text
                  style={[
                    styles.couponActionBtnText,
                    !c.isUsable && styles.couponActionBtnTextOutline,
                  ]}
                >
                  {c.actionText}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 7. Nearby Stores ("ร้านค้าใกล้คุณ") */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIcon}>📍</Text>
          <Text style={styles.sectionTitle}>ร้านค้าใกล้คุณ</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {displayStores.map((s) => {
          const storeType =
            s.name.includes('Cafe') || s.name.includes('Amazon')
              ? 'amazon'
              : s.name.includes('7')
              ? '7eleven'
              : s.name.includes('KFC')
              ? 'kfc'
              : 'default';

          return (
            <Pressable
              key={s.id}
              onPress={() => onNavigate('store', s.id)}
              accessibilityRole="button"
              accessibilityLabel={s.name}
              style={styles.storeCard}
            >
              <View style={styles.storeBanner}>
                <StorefrontGraphic type={storeType} height={80} />
              </View>
            <View style={styles.storeInfo}>
              <View style={styles.storeNameRow}>
                <Text style={styles.storeName} numberOfLines={1}>
                  {s.name}
                </Text>
                <Text style={styles.storeCardArrow}>›</Text>
              </View>
              <Text style={styles.storeDistance}>📍 {s.km} km</Text>
              <View style={styles.storeRatingRow}>
                <Text style={styles.storeRating}>⭐ {s.rating}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}
      </ScrollView>
    </ScrollView>
  );
}
