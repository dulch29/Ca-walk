export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RunSession {
  sessionId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  steps: number;
  distanceKm: number;
  averagePace: string;
  gpsDistanceKm?: number;
  destinationName?: string;
  photos?: string[];
  trackCoordinates?: Array<[number, number]>;
}

export interface MerchantMetrics {
  walkIns: number;
  redeemed: number;
  feeBaht: number;
}

export interface MerchantPromotion {
  title: string;
  description: string;
  requiredDistanceKm: number;
}

export interface Merchant {
  merchantId: string;
  merchantName: string;
  category: string;
  location: Coordinates;
  promotion: MerchantPromotion;
  metrics: MerchantMetrics;
}

export type CouponStatus = 'unlocked' | 'redeemed' | 'expired';

export interface Coupon {
  couponId: string;
  merchantId: string;
  merchantName: string;
  dealTitle: string;
  requiredDistanceKm: number;
  status: CouponStatus;
  unlockedAt: string;
  expiresAt: string;
  oneTimeToken: string;
  redeemedAt?: string;
}

export interface MockUser {
  uid: string;
  displayName: string;
  totalSteps: number;
  totalDistanceKm: number;
  redeemableDistanceKm: number;
  runHistory: RunSession[];
}

// distanceKm = steps * 0.75 / 1000 for every run; totals sum to 4000 steps / 3.0 km.
const MOCK_RUN_HISTORY: RunSession[] = [
  {
    sessionId: 'run_mock_001',
    startTime: '2026-10-20T06:00:00.000Z',
    endTime: '2026-10-20T06:09:45.000Z',
    durationSeconds: 585,
    steps: 1200,
    distanceKm: 0.9,
    averagePace: '10\'50" /km',
  },
  {
    sessionId: 'run_mock_002',
    startTime: '2026-10-21T17:30:00.000Z',
    endTime: '2026-10-21T17:43:00.000Z',
    durationSeconds: 780,
    steps: 1600,
    distanceKm: 1.2,
    averagePace: '10\'50" /km',
  },
  {
    sessionId: 'run_mock_003',
    startTime: '2026-10-23T06:15:00.000Z',
    endTime: '2026-10-23T06:24:00.000Z',
    durationSeconds: 540,
    steps: 1200,
    distanceKm: 0.9,
    averagePace: '10\'00" /km',
  },
];

export const MOCK_USER: MockUser = {
  uid: 'user_mock_01',
  displayName: 'Ca-walk Demo',
  totalSteps: 4000,
  totalDistanceKm: 3.0,
  redeemableDistanceKm: 3.0,
  runHistory: MOCK_RUN_HISTORY,
};

export const MOCK_MERCHANTS: Merchant[] = [
  {
    merchantId: 'merchant_01',
    merchantName: 'ร้านข้าวมันไก่บรรทัดทอง',
    category: 'อาหาร',
    location: { latitude: 13.7425, longitude: 100.5214 },
    promotion: {
      title: 'คูปองส่วนลด 50 บาท',
      description: 'เดินครบ 4 กม. รับส่วนลด 50 บาท เมื่อทานที่ร้าน',
      requiredDistanceKm: 4.0,
    },
    metrics: { walkIns: 12, redeemed: 8, feeBaht: 64 },
  },
  {
    merchantId: 'merchant_02',
    merchantName: 'สามย่านคาเฟ่',
    category: 'เครื่องดื่ม',
    location: { latitude: 13.7335, longitude: 100.5288 },
    promotion: {
      title: 'ลด 20 บาท เครื่องดื่มทุกเมนู',
      description: 'เดินครบ 2 กม. รับส่วนลดเครื่องดื่ม 20 บาท',
      requiredDistanceKm: 2.0,
    },
    metrics: { walkIns: 7, redeemed: 5, feeBaht: 40 },
  },
  {
    merchantId: 'merchant_03',
    merchantName: 'ขนมหวานจุฬาฯ ซอย 12',
    category: 'ของหวาน',
    location: { latitude: 13.7401, longitude: 100.5236 },
    promotion: {
      title: 'ฟรีท็อปปิ้ง 1 อย่าง',
      description: 'เดินครบ 1.5 กม. รับท็อปปิ้งฟรี',
      requiredDistanceKm: 1.5,
    },
    metrics: { walkIns: 4, redeemed: 3, feeBaht: 24 },
  },
  {
    merchantId: 'merchant_04',
    merchantName: 'ก๋วยเตี๋ยวเรือบรรทัดทอง',
    category: 'อาหาร',
    location: { latitude: 13.7448, longitude: 100.5191 },
    promotion: {
      title: 'ฟรีลูกชิ้นเพิ่ม 1 ไม้',
      description: 'เดินครบ 3 กม. รับลูกชิ้นเพิ่มฟรี 1 ไม้',
      requiredDistanceKm: 3.0,
    },
    metrics: { walkIns: 9, redeemed: 6, feeBaht: 48 },
  },
  {
    merchantId: 'merchant_05',
    merchantName: 'ร้านน้ำผลไม้ปั่นสามย่านมิตรทาวน์',
    category: 'เครื่องดื่ม',
    location: { latitude: 13.7343, longitude: 100.5283 },
    promotion: {
      title: 'ซื้อ 1 แถม 1 น้ำปั่น',
      description: 'เดินครบ 5 กม. รับน้ำปั่นแก้วที่สองฟรี',
      requiredDistanceKm: 5.0,
    },
    metrics: { walkIns: 5, redeemed: 2, feeBaht: 16 },
  },
];

export const MOCK_COUPONS: Coupon[] = [
  {
    couponId: 'coupon_mock_001',
    merchantId: 'merchant_03',
    merchantName: 'ขนมหวานจุฬาฯ ซอย 12',
    dealTitle: 'ฟรีท็อปปิ้ง 1 อย่าง',
    requiredDistanceKm: 1.5,
    status: 'redeemed',
    unlockedAt: '2026-10-21T18:00:00.000Z',
    expiresAt: '2026-10-24T18:00:00.000Z',
    oneTimeToken: 'CW-MOCK-0001',
    redeemedAt: '2026-10-22T12:30:00.000Z',
  },
];
