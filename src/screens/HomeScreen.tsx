import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import CatAvatar, { CatMood } from '../components/CatAvatar';
import { AmazonLogo, KfcLogo, SevenElevenLogo } from '../components/BrandLogos';
import { useAppContext } from '../context/AppContext';
import { styles } from './HomeScreen.styles';

export type HomeTarget = 'wallet' | 'missions' | 'coupons' | 'map' | 'store';

type Props = {
  onNavigate: (target: HomeTarget, storeId?: string) => void;
};

// Static image references for instant bundling
const HERO_LANDSCAPE = require('../../Assests/Images/hero_landscape.jpg');
const STORE_IMAGES = {
  '7eleven': require('../../Assests/Images/store_7eleven.jpg'),
  amazon: require('../../Assests/Images/store_amazon.jpg'),
  kfc: require('../../Assests/Images/store_kfc.jpg'),
};

// 1. Whimsical Hand-drawn Brand Logo
function CaWalkLogo() {
  return (
    <View style={styles.logoContainer}>
      <Svg width={145} height={42} viewBox="0 0 145 42">
        <Path
          d="M 24 11 C 14 10 7 17 7 26 C 7 34 14 38 24 38 C 29 38 33 35 35 31"
          fill="none"
          stroke="#262A22"
          strokeWidth={3.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 48 26 C 48 20 42 20 38 23 C 35 26 35 32 39 34 C 44 36 48 33 48 26 M 48 21 L 48 36 C 48 37 49 38 52 37"
          fill="none"
          stroke="#262A22"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 56 27 L 63 26"
          fill="none"
          stroke="#262A22"
          strokeWidth={3.2}
          strokeLinecap="round"
        />
        <Path
          d="M 68 15 L 73 35 L 79 21 L 85 35 L 90 16"
          fill="none"
          stroke="#262A22"
          strokeWidth={3.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 103 26 C 103 20 97 20 93 23 C 90 26 90 32 94 34 C 99 36 103 33 103 26 M 103 21 L 103 36 C 103 37 104 38 107 37"
          fill="none"
          stroke="#262A22"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 113 9 L 113 36 C 113 37 115 38 118 37"
          fill="none"
          stroke="#262A22"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 125 9 L 125 36 M 137 22 L 127 29 L 139 37"
          fill="none"
          stroke="#262A22"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

// 2. Botanical Foliage Watermark on the Wallet Card
function WalletFoliage() {
  return (
    <View style={styles.walletFoliage} pointerEvents="none">
      <Svg width={140} height={120} viewBox="0 0 140 120">
        <Path
          d="M 140 120 Q 110 80 90 45 Q 75 15 65 0"
          stroke="#3F522E"
          strokeWidth={2}
          fill="none"
          opacity={0.4}
        />
        <Path
          d="M 90 45 Q 65 40 70 24 Q 85 28 90 45 Z"
          fill="#3F522E"
          opacity={0.35}
        />
        <Path
          d="M 100 62 Q 125 50 120 34 Q 102 44 100 62 Z"
          fill="#3F522E"
          opacity={0.35}
        />
        <Path
          d="M 78 26 Q 52 14 62 4 Q 74 12 78 26 Z"
          fill="#3F522E"
          opacity={0.3}
        />
        <Path
          d="M 112 85 Q 86 78 90 60 Q 106 68 112 85 Z"
          fill="#3F522E"
          opacity={0.35}
        />
        <Path
          d="M 125 102 Q 142 90 136 74 Q 120 84 125 102 Z"
          fill="#3F522E"
          opacity={0.3}
        />
      </Svg>
    </View>
  );
}

// 3. Crisp Embossed Gold Coin Vector
function GoldCoin({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle cx="10" cy="10" r="9" fill="#ECA928" stroke="#BD7E10" strokeWidth="1" />
      <Circle cx="10" cy="10" r="7" fill="#F8C741" />
      <Circle cx="10" cy="10" r="5.5" fill="none" stroke="#DDA11B" strokeWidth="0.8" />
      <Path
        d="M 10 6.2 L 11.2 8.7 L 13.8 9.1 L 11.9 10.9 L 12.4 13.5 L 10 12.2 L 7.6 13.5 L 8.1 10.9 L 6.2 9.1 L 8.8 8.7 Z"
        fill="#FFFFFF"
        opacity={0.95}
      />
    </Svg>
  );
}

// 4. Section Icons & Controls
function TargetIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#5F7D4E" strokeWidth="2.2" />
      <Circle cx="12" cy="12" r="6.5" stroke="#7A9A67" strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="3" fill="#4B663C" />
    </Svg>
  );
}

function CouponIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7z"
        stroke="#5F7D4E"
        strokeWidth="2"
        fill="#E8F0E4"
      />
      <Path
        d="M12 6v12"
        stroke="#5F7D4E"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
    </Svg>
  );
}

function LocationPinIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21c-4-4.5-7-8.5-7-12a7 7 0 1 1 14 0c0 3.5-3 7.5-7 12z"
        stroke="#5F7D4E"
        strokeWidth="2"
        fill="#E8F0E4"
      />
      <Circle cx="12" cy="9" r="2.5" fill="#4B663C" />
    </Svg>
  );
}

function WalletPouchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10c0-2 2-4 5-4h6c3 0 5 2 5 4v8c0 2-2 4-5 4H9c-3 0-5-2-5-4v-8z"
        fill="#E8F2E4"
      />
      <Path
        d="M8 6c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5"
        stroke="#E8F2E4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="1.5" fill="#4A6138" />
    </Svg>
  );
}

function SearchGlassIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#60665A" strokeWidth="2.4" strokeLinecap="round">
      <Circle cx="10.5" cy="10.5" r="7" />
      <Path d="M16 16l5 5" />
    </Svg>
  );
}

function FilterSlidersIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#50564B" strokeWidth="2" strokeLinecap="round">
      <Path d="M3 7h18" />
      <Circle cx="16" cy="7" r="2.5" fill="#FFFFFF" stroke="#50564B" strokeWidth="2" />
      <Path d="M3 17h18" />
      <Circle cx="8" cy="17" r="2.5" fill="#FFFFFF" stroke="#50564B" strokeWidth="2" />
    </Svg>
  );
}

// 5. Official-style Store Brand Logo Badges
function StoreBrandBadge({ type }: { type: '7eleven' | 'amazon' | 'kfc' }) {
  if (type === '7eleven') {
    return <SevenElevenLogo size={36} />;
  }
  if (type === 'amazon') {
    return <AmazonLogo size={36} />;
  }
  return <KfcLogo size={36} />;
}

// 6. Vector Mission Icons
function SneakerIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 28 28" fill="none">
      <Path
        d="M 3 19 C 4 14 7 13 12 13 L 16 9 C 18 8 22 9 23 13 L 25 16 C 26 18 25 21 22 21 L 4 21 Z"
        stroke="#5C7449"
        strokeWidth="2"
        fill="#EBF3E6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M 13 13 L 16 17" stroke="#5C7449" strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M 17 12 L 20 16" stroke="#5C7449" strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="3" y="21" width="22" height="3" rx="1.5" fill="#5C7449" />
    </Svg>
  );
}

function RunnerIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 28 28" fill="none">
      <Circle cx="17" cy="6" r="3" fill="#C78923" />
      <Path
        d="M 15 10 L 12 14 L 8 15 M 12 14 L 16 18 L 13 24 M 15 12 L 19 14 L 23 13 M 16 18 L 20 20"
        stroke="#C78923"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CafeShopIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 28 28" fill="none">
      {/* Awning */}
      <Path
        d="M 3 9 L 25 9 L 23 14 L 20 14 L 17 14 L 14 14 L 11 14 L 8 14 L 5 14 Z"
        fill="#5C7449"
        stroke="#3F522E"
        strokeWidth="1.2"
      />
      {/* Pillars and glass */}
      <Path d="M 5 14 L 5 23 L 23 23 L 23 14" stroke="#3F522E" strokeWidth="1.8" fill="#FAF6ED" />
      <Rect x="10" y="16" width="8" height="7" fill="#5C7449" rx="1" />
      {/* Roof trim */}
      <Path d="M 2 9 L 4 5 L 24 5 L 26 9" stroke="#3F522E" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function StarGoalIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 28 28" fill="none">
      <Path
        d="M 14 3 L 17.5 9.8 L 25 10.9 L 19.5 16.2 L 20.8 23.6 L 14 20 L 7.2 23.6 L 8.5 16.2 L 3 10.9 L 10.5 9.8 Z"
        stroke="#C78923"
        strokeWidth="2"
        fill="#FDF0D5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Missions data matching the reference mockup
const MISSIONS = [
  {
    id: 'm1',
    IconComponent: SneakerIcon,
    title: 'เดินครบ 5 km',
    progressText: '3.2 / 5 km',
    progressPct: 0.64,
    reward: 20,
  },
  {
    id: 'm2',
    IconComponent: RunnerIcon,
    title: 'วิ่งต่อเนื่อง 20 นาที',
    progressText: '0 / 20 นาที',
    progressPct: 0,
    reward: 30,
  },
  {
    id: 'm3',
    IconComponent: CafeShopIcon,
    title: 'ไปที่ร้านกาแฟ',
    progressText: '0 / 1 ครั้ง',
    progressPct: 0,
    reward: 50,
  },
  {
    id: 'm4',
    IconComponent: StarGoalIcon,
    title: 'ทำภารกิจครบ 3 อย่าง',
    progressText: '1 / 3',
    progressPct: 0.33,
    reward: 100,
  },
];

// Display coupons matching reference mockup
const DEMO_COUPONS = [
  {
    id: 'c1',
    badgeText: 'ใช้งานได้',
    isUsable: true,
    title: 'ส่วนลด 20%',
    merchantName: '7-Eleven',
    storeType: '7eleven' as const,
    expiry: '📅 หมดอายุ 30 ก.ย. 2568',
    actionText: 'ใช้คูปอง',
  },
  {
    id: 'c2',
    badgeText: 'ยังไม่ปลดล็อก',
    isUsable: false,
    title: 'ส่วนลด 50%',
    merchantName: 'Cafe Amazon',
    storeType: 'amazon' as const,
    expiry: '📅 หมดอายุ 30 ก.ย. 2568',
    actionText: 'ดูเงื่อนไข',
  },
];

// Nearby stores matching reference mockup
const DEMO_STORES = [
  {
    id: 's1',
    name: 'Cafe Amazon',
    km: 1.2,
    rating: 4.5,
    type: 'amazon' as const,
  },
  {
    id: 's2',
    name: '7-Eleven',
    km: 2.4,
    rating: 4.2,
    type: '7eleven' as const,
  },
  {
    id: 's3',
    name: 'KFC',
    km: 3.1,
    rating: 4.0,
    type: 'kfc' as const,
  },
];

export default function HomeScreen({ onNavigate }: Props) {
  const { user } = useAppContext();
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

  // 12.8 km default matching reference mockup
  const km = user.redeemableDistanceKm > 3.0 ? user.redeemableDistanceKm : 12.8;
  const coins = Math.round(km * 10);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* 1. App Title with Whimsical Hand-drawn Logo */}
      <CaWalkLogo />

      {/* 2. Hero Cat Landscape Area */}
      <Pressable
        onPress={petCat}
        accessibilityRole="button"
        accessibilityLabel="ลูบแมวเพื่อเล่นด้วย"
        style={styles.heroLandscape}
      >
        {/* Scenic Ghibli landscape backdrop */}
        <Image
          source={HERO_LANDSCAPE}
          style={styles.heroLandscapeImage}
          resizeMode="cover"
        />

        {/* Speech Bubble */}
        {bubble && (
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{bubble}</Text>
          </View>
        )}

        {/* Animated Cat sitting in landscape foreground */}
        <View style={styles.catAvatarWrapper}>
          <CatAvatar size={195} mood={mood} />
        </View>
      </Pressable>

      {/* 3. Search Bar Pill with Filter Icon */}
      <Pressable
        onPress={() => onNavigate('map')}
        accessibilityRole="search"
        accessibilityLabel="ค้นหาร้านค้า คูปอง หรือสถานที่"
        style={styles.searchBar}
      >
        <SearchGlassIcon />
        <Text style={styles.searchPlaceholder}>
          ค้นหาร้านค้า คูปอง หรือสถานที่
        </Text>
        <View style={styles.searchFilterDivider} />
        <View style={styles.searchFilterBtn}>
          <FilterSlidersIcon />
        </View>
      </Pressable>

      {/* 4. Distance Wallet Card ("กระเป๋าระยะทาง") */}
      <Pressable
        onPress={() => onNavigate('wallet')}
        accessibilityRole="button"
        accessibilityLabel="กระเป๋าระยะทาง"
        style={styles.walletCard}
      >
        <WalletFoliage />

        <View style={styles.walletContent}>
          <View style={styles.walletHeaderRow}>
            <WalletPouchIcon />
            <Text style={styles.walletTitle}>กระเป๋าระยะทาง</Text>
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
            <View style={styles.walletCoinsWrapper}>
              <Text style={styles.walletCoinsText}>≈ {coins}</Text>
              <GoldCoin size={16} />
            </View>
          </View>
        </View>
      </Pressable>

      {/* 5. Daily Missions ("ภารกิจวันนี้") */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <TargetIcon />
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
        {MISSIONS.map((m) => {
          const Icon = m.IconComponent;
          return (
            <View key={m.id} style={styles.missionCard}>
              <View style={styles.missionIconWrapper}>
                <Icon />
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
                <GoldCoin size={14} />
                <Text style={styles.missionRewardText}>+{m.reward}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* 6. My Coupons ("คูปองของฉัน") */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <CouponIcon />
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
            {/* Top Banner with Real Storefront Photo and Brand badge */}
            <View style={styles.couponImageBanner}>
              <Image
                source={STORE_IMAGES[c.storeType]}
                style={styles.couponImage}
                resizeMode="cover"
              />

              <View style={styles.couponStoreBadge}>
                <StoreBrandBadge type={c.storeType} />
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
          <LocationPinIcon />
          <Text style={styles.sectionTitle}>ร้านค้าใกล้คุณ</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {DEMO_STORES.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => onNavigate('store', s.id)}
            accessibilityRole="button"
            accessibilityLabel={s.name}
            style={styles.storeCard}
          >
            <View style={styles.storeBanner}>
              <Image
                source={STORE_IMAGES[s.type]}
                style={styles.storeImage}
                resizeMode="cover"
              />
              <View style={styles.storeFloatingBadge}>
                <StoreBrandBadge type={s.type} />
              </View>
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
                <Text style={styles.storeRating}>⭐ {s.rating.toFixed(1)}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </ScrollView>
  );
}
