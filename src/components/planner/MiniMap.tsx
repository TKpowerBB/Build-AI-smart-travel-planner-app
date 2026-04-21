interface Props {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  from: string;
  to: string;
}

export default function MiniMap({ fromLat, fromLng, toLat, toLng, from, to }: Props) {
  // Normalize coordinates to SVG space (0-100)
  const minLat = Math.min(fromLat, toLat);
  const maxLat = Math.max(fromLat, toLat);
  const minLng = Math.min(fromLng, toLng);
  const maxLng = Math.max(fromLng, toLng);

  const pad = 15;
  const rangeX = maxLng - minLng || 0.01;
  const rangeY = maxLat - minLat || 0.01;

  const toSvg = (lat: number, lng: number) => ({
    x: pad + ((lng - minLng) / rangeX) * (100 - pad * 2),
    y: pad + ((maxLat - lat) / rangeY) * (100 - pad * 2),
  });

  const p1 = toSvg(fromLat, fromLng);
  const p2 = toSvg(toLat, toLng);

  // Curved path midpoint
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2 - 20;

  return (
    <div className="mt-2 bg-blue-50 rounded-xl overflow-hidden">
      <svg viewBox="0 0 100 100" className="w-full h-24">
        {/* Route curve */}
        <path
          d={`M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`}
          stroke="#6366f1"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 2"
        />
        {/* From dot */}
        <circle cx={p1.x} cy={p1.y} r="4" fill="#6366f1" />
        {/* To dot */}
        <circle cx={p2.x} cy={p2.y} r="4" fill="#10b981" />
      </svg>
      <div className="px-3 pb-2 flex justify-between text-xs text-gray-500">
        <span className="text-indigo-600 font-medium truncate max-w-[45%]">{from}</span>
        <span className="text-emerald-600 font-medium truncate max-w-[45%] text-right">{to}</span>
      </div>
    </div>
  );
}
