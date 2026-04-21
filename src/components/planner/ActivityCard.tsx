import { ActivityCard as ActivityCardType, Companion } from '@/types';
import WeatherBadge from './WeatherBadge';
import ParticipantsBadge from './ParticipantsBadge';

const SUBTYPE_ICONS: Record<string, string> = {
  experience: '🎯',
  rest: '😴',
  meal: '🍽️',
  place: '📍',
};

const SUBTYPE_COLORS: Record<string, string> = {
  experience: 'border-l-purple-400',
  rest: 'border-l-blue-300',
  meal: 'border-l-orange-400',
  place: 'border-l-green-400',
};

interface Props {
  card: ActivityCardType;
  companions: Companion[];
}

export default function ActivityCard({ card, companions }: Props) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${SUBTYPE_COLORS[card.subtype]}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{SUBTYPE_ICONS[card.subtype]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-800 text-sm leading-tight">{card.title}</p>
            <span className="text-xs font-mono text-gray-500 flex-shrink-0">{card.time}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
          <p className="text-xs text-gray-400 mt-1">📍 {card.location}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">⏱ {card.duration}min</span>
            <WeatherBadge hint={card.weatherHint} />
          </div>
          <ParticipantsBadge participants={card.participants} companions={companions} />
        </div>
      </div>
    </div>
  );
}
