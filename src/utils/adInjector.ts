import { AdCard, DailyItinerary, ItineraryCard } from '@/types';

const DUMMY_ADS: AdCard[] = [
  {
    type: 'ad',
    title: '✈️ Best Flight Deals',
    desc: 'Compare prices from 500+ airlines',
    imageUrl: undefined,
    linkUrl: '#',
  },
  {
    type: 'ad',
    title: '🏨 Hotel Tonight',
    desc: 'Last-minute deals up to 60% off',
    imageUrl: undefined,
    linkUrl: '#',
  },
  {
    type: 'ad',
    title: '🚗 Rent a Car',
    desc: 'Free cancellation on most bookings',
    imageUrl: undefined,
    linkUrl: '#',
  },
];

let adIndex = 0;

function nextAd(): AdCard {
  const ad = DUMMY_ADS[adIndex % DUMMY_ADS.length];
  adIndex++;
  return ad;
}

// Inserts an AdCard after every AD_INTERVAL activity cards within each day
const AD_INTERVAL = 3;

export function injectAds(itinerary: DailyItinerary[]): DailyItinerary[] {
  return itinerary.map((day) => {
    const cards: ItineraryCard[] = [];
    let activityCount = 0;

    for (const card of day.cards) {
      cards.push(card);
      if (card.type === 'activity') {
        activityCount++;
        if (activityCount % AD_INTERVAL === 0) {
          cards.push(nextAd());
        }
      }
    }

    return { ...day, cards };
  });
}
