'use client';
import { DailyItinerary } from '@/types';

interface Props {
  days: DailyItinerary[];
  selected: number;
  onChange: (i: number) => void;
}

export default function DayTabs({ days, selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-white border-b scrollbar-hide">
      {days.map((day, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selected === i
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {day.dayLabel}
        </button>
      ))}
    </div>
  );
}
