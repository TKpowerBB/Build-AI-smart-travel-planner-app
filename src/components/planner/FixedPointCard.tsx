import { FixedPointCard as FixedPointCardType } from '@/types';

const ICONS = { trip_start: '✈️', trip_end: '🏠' };
const COLORS = {
  trip_start: 'bg-indigo-500',
  trip_end: 'bg-emerald-500',
};

export default function FixedPointCard({ card }: { card: FixedPointCardType }) {
  return (
    <div className={`${COLORS[card.subtype]} text-white rounded-2xl p-4 shadow-sm`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{ICONS[card.subtype]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base">{card.title}</p>
          <p className="text-sm opacity-80">{card.location}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-mono font-bold text-lg">{card.time}</p>
          <p className="text-xs opacity-70">{card.duration}min</p>
        </div>
      </div>
    </div>
  );
}
