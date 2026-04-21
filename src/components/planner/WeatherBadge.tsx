interface Props {
  hint?: string;
}

export default function WeatherBadge({ hint }: Props) {
  if (!hint) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
      🌤️ {hint}
    </span>
  );
}
