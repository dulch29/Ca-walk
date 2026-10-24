// shortcut: static demo data from the mockups, replace with Firestore reads when backend lands
export type QuestKind = 'daily' | 'weekly' | 'special';

export type Quest = {
  id: string;
  kind: QuestKind;
  title: string;
  icon: string;
  progress: number;
  goal: number;
  unit: string;
  reward: number;
};

export type Coupon = {
  id: string;
  title: string;
  store: string;
  expires: string;
  status: 'usable' | 'locked' | 'used';
  unlockKm?: number;
};

export type Store = {
  id: string;
  name: string;
  km: number;
  rating: number;
  reviews: string;
  tags: string;
  hours: string;
  address: string;
  hasCoupon: boolean;
  // position on the placeholder map, 0..1
  x: number;
  y: number;
};

export const wallet = {
  km: 12.8,
  coins: 128,
  nextGoalKm: 20,
  walkKm: 8.4,
  runKm: 4.4,
  steps: 18421,
  history: [
    { id: 'h1', type: 'เดิน', date: '12 ก.ย. 2568 08:24', coins: 21 },
    { id: 'h2', type: 'วิ่ง', date: '11 ก.ย. 2568 17:32', coins: 34 },
    { id: 'h3', type: 'เดิน', date: '10 ก.ย. 2568 09:15', coins: 18 },
  ],
};

export const quests: Quest[] = [
  {
    id: 'q1',
    kind: 'daily',
    title: 'เดินครบ 5 km',
    icon: '👟',
    progress: 3.2,
    goal: 5,
    unit: 'km',
    reward: 20,
  },
  {
    id: 'q2',
    kind: 'daily',
    title: 'วิ่งต่อเนื่อง 20 นาที',
    icon: '🏃',
    progress: 0,
    goal: 20,
    unit: 'นาที',
    reward: 30,
  },
  {
    id: 'q3',
    kind: 'daily',
    title: 'ไปที่ร้านกาแฟ',
    icon: '🏪',
    progress: 0,
    goal: 1,
    unit: 'ครั้ง',
    reward: 50,
  },
  {
    id: 'q4',
    kind: 'daily',
    title: 'ทำภารกิจครบ 3 อย่าง',
    icon: '⭐',
    progress: 1,
    goal: 3,
    unit: '',
    reward: 100,
  },
  {
    id: 'q5',
    kind: 'weekly',
    title: 'สะสมระยะทาง 20 km',
    icon: '🏃',
    progress: 12,
    goal: 20,
    unit: 'km',
    reward: 100,
  },
  {
    id: 'q6',
    kind: 'special',
    title: 'เทศกาลฤดูใบไม้ร่วง',
    icon: '🍂',
    progress: 0,
    goal: 1,
    unit: '1 - 30 ก.ย. 2568',
    reward: 200,
  },
];

export const coupons: Coupon[] = [
  {
    id: 'c1',
    title: 'ส่วนลด 20%',
    store: '7-Eleven',
    expires: '30 ก.ย. 2568',
    status: 'usable',
  },
  {
    id: 'c2',
    title: 'ฟรีเมนูขนม',
    store: 'Cafe Amazon',
    expires: '25 ก.ย. 2568',
    status: 'usable',
  },
  {
    id: 'c3',
    title: 'ส่วนลด 15%',
    store: 'Inthanin',
    expires: '20 ก.ย. 2568',
    status: 'usable',
  },
  {
    id: 'c4',
    title: 'ส่วนลด 50%',
    store: 'Cafe Amazon',
    expires: '30 ก.ย. 2568',
    status: 'locked',
    unlockKm: 50,
  },
];

export const stores: Store[] = [
  {
    id: 's1',
    name: 'Cafe Amazon',
    km: 1.2,
    rating: 4.5,
    reviews: '1.2k',
    tags: 'กาแฟ • เครื่องดื่ม • ขนม',
    hours: 'เปิด 06:00 - 22:00',
    address: '125 ถนนพญาไท กรุงเทพฯ',
    hasCoupon: true,
    x: 0.62,
    y: 0.35,
  },
  {
    id: 's2',
    name: '7-Eleven',
    km: 2.4,
    rating: 4.2,
    reviews: '860',
    tags: 'ร้านสะดวกซื้อ',
    hours: 'เปิด 24 ชม.',
    address: '88 ถนนบรรทัดทอง กรุงเทพฯ',
    hasCoupon: true,
    x: 0.25,
    y: 0.55,
  },
  {
    id: 's3',
    name: 'KFC',
    km: 3.1,
    rating: 4.0,
    reviews: '540',
    tags: 'อาหาร • ไก่ทอด',
    hours: 'เปิด 10:00 - 21:00',
    address: '9 สามย่าน กรุงเทพฯ',
    hasCoupon: false,
    x: 0.75,
    y: 0.7,
  },
];

export const storeCoupons = [
  {
    id: 'sc1',
    title: 'ส่วนลดเครื่องดื่ม 20%',
    cond: 'เมื่อสั่งเมนูเครื่องดื่ม (ขั้นต่ำ 1 แก้ว)',
    expires: 'ใช้ได้ถึง 30 ก.ย. 2568',
  },
  {
    id: 'sc2',
    title: 'ฟรีท็อปปิ้ง 1 อย่าง',
    cond: 'เมื่อซื้อครบ 80 บาท',
    expires: 'ใช้ได้ถึง 30 ก.ย. 2568',
  },
];
