import { AdCard as AdCardType } from '@/types';

export default function AdCard({ card }: { card: AdCardType }) {
  return (
    <a
      href={card.linkUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-600 font-semibold uppercase tracking-wide bg-amber-100 px-2 py-0.5 rounded-full">Ad</span>
        <p className="font-semibold text-gray-800 text-sm">{card.title}</p>
      </div>
      <p className="text-xs text-gray-500 mt-1 ml-0">{card.desc}</p>
    </a>
  );
}
