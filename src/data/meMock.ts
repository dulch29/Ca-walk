// shortcut: static demo data from the Me mockups, replace with Firestore reads when backend lands
import type { Sport } from '../screens/RecordScreen';

export const profile = {
  name: 'Meow',
  totalKm: 128.6,
  steps: 182430,
  couponsUsed: 12,
  today: { km: 5.2, steps: 7842, kcal: 428 },
};

export type Activity = {
  id: string;
  sport: Sport;
  km: number;
  steps: number;
  kcal: number;
  pace: string;
  time: string;
  date: string;
};

export const activities: Activity[] = [
  { id: 'a1', sport: 'run', km: 5.23, steps: 7842, kcal: 428, pace: '7:12', time: '00:38:45', date: '12 ก.ย. 2568 · 08:24' },
  { id: 'a2', sport: 'walk', km: 3.12, steps: 4210, kcal: 196, pace: '11:05', time: '00:34:35', date: '10 ก.ย. 2568 · 17:03' },
  { id: 'a3', sport: 'walk', km: 4.87, steps: 6530, kcal: 301, pace: '10:48', time: '00:52:36', date: '8 ก.ย. 2568 · 07:41' },
  { id: 'a4', sport: 'run', km: 7.02, steps: 9120, kcal: 560, pace: '6:30', time: '00:45:38', date: '5 ก.ย. 2568 · 06:22' },
  { id: 'a5', sport: 'walk', km: 4.26, steps: 5710, kcal: 262, pace: '11:20', time: '00:48:17', date: '2 ก.ย. 2568 · 18:15' },
];

export type CouponHistory = {
  id: string;
  store: string;
  title: string;
  date: string;
  status: 'used' | 'expired';
};

export const couponHistory: CouponHistory[] = [
  { id: 'ch1', store: 'Cafe Amazon', title: 'ส่วนลด 50%', date: '12 ก.ย. 2568', status: 'used' },
  { id: 'ch2', store: '7-Eleven', title: 'เครื่องดื่ม 1 แถม 1', date: '5 ก.ย. 2568', status: 'used' },
  { id: 'ch3', store: 'KFC', title: 'ไก่ทอด 1 ชิ้น', date: '28 ส.ค. 2568', status: 'used' },
  { id: 'ch4', store: "McDonald's", title: 'ชุดอาหารว่าง', date: '20 ส.ค. 2568', status: 'expired' },
  { id: 'ch5', store: 'Boots', title: 'ส่วนลด 15%', date: '15 ส.ค. 2568', status: 'used' },
];
