import { DailyItinerary, Companion } from '@/types';
import FixedPointCard from './FixedPointCard';
import ActivityCard from './ActivityCard';
import TransitCard from './TransitCard';
import AdCard from './AdCard';

interface Props {
  day: DailyItinerary;
  companions: Companion[];
}

export default function DayView({ day, companions }: Props) {
  return (
    <div className="space-y-3 px-4 py-4">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
        {day.dayLabel} · {day.date}
      </h2>
      {day.cards.map((card, i) => {
        if (card.type === 'fixed_point') return <FixedPointCard key={i} card={card} />;
        if (card.type === 'activity') return <ActivityCard key={i} card={card} companions={companions} />;
        if (card.type === 'transit') return <TransitCard key={i} card={card} companions={companions} />;
        if (card.type === 'ad') return <AdCard key={i} card={card} />;
        return null;
      })}
    </div>
  );
}
