import type { Merchant, Coordinates } from './mockData';
import type { Store } from '../data/mock';
import { haversineDistanceMeters } from './locationUtils';

export function merchantToStore(
  merchant: Merchant,
  userLocation?: Coordinates | null,
): Store {
  let distanceKm = 0.8;
  if (userLocation) {
    distanceKm =
      Math.round(
        (haversineDistanceMeters(userLocation, merchant.location) / 1000) * 10,
      ) / 10;
  }
  return {
    id: merchant.merchantId,
    name: merchant.merchantName,
    km: distanceKm,
    rating: 4.8,
    reviews: `${merchant.metrics.walkIns * 8 + 40}`,
    tags: merchant.category,
    hours: '10:00 - 21:00',
    address: 'ย่านบรรทัดทอง - สามย่าน กรุงเทพฯ',
    hasCoupon: true,
    x: 0.5,
    y: 0.5,
  };
}
