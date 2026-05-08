import { TransitCard as TransitCardType, Companion } from '@/types';
import MiniMap from './MiniMap';
import ParticipantsBadge from './ParticipantsBadge';

const MODE_ICONS: Record<string, string> = {
  walk: '🚶', taxi: '🚕', bus: '🚌', subway: '🚇',
  car: '🚗', boat: '⛴️', plane: '✈️',
};

interface Props {
  card: TransitCardType;
  companions: Companion[];
}

export default function TransitCard({ card, companions }: Props) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{card.emoji || MODE_ICONS[card.mode]}</span>
        <span className="text-xs font-medium text-gray-600 capitalize">
          {card.title || card.mode}
        </span>
        <span className="ml-auto text-xs font-mono text-gray-500">
          {card.startTime || card.time}
          {card.endTime ? `–${card.endTime}` : ''}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <span className="font-medium truncate max-w-[40%]" title={card.fromAddress || card.from}>
          {card.from}
        </span>
        <span className="text-gray-400 flex-shrink-0">→</span>
        <span className="font-medium truncate max-w-[40%]" title={card.toAddress || card.to}>
          {card.to}
        </span>
        <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{card.duration}min</span>
      </div>
      {card.aiNote && (
        <p className="text-xs text-indigo-600 mt-1 leading-snug">💡 {card.aiNote}</p>
      )}
      {card.userNote && (
        <p className="text-xs text-gray-700 mt-1 leading-snug bg-yellow-50 px-2 py-1 rounded">
          📝 {card.userNote}
        </p>
      )}
      <MiniMap
        fromLat={card.fromLat}
        fromLng={card.fromLng}
        toLat={card.toLat}
        toLng={card.toLng}
        from={card.from}
        to={card.to}
      />
      <ParticipantsBadge participants={card.participants} companions={companions} />
    </div>
  );
}
