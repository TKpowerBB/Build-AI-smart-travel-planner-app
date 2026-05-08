interface Props {
  /** Legacy seasonal hint from the LLM. */
  hint?: string;
  /** Real-time forecast values from Open-Meteo (pipeline step 4). */
  temperature?: number;
  humidity?: number;
  weather?: string;
}

/**
 * Prefer the real-time forecast triple when any of the three values is
 * populated. Falls back to the seasonal `hint` so older saved itineraries
 * (pre-weather pipeline) still render something.
 */
export default function WeatherBadge({ hint, temperature, humidity, weather }: Props) {
  const hasLive =
    temperature !== undefined || humidity !== undefined || (weather && weather.length > 0);

  if (hasLive) {
    const parts: string[] = [];
    if (weather) parts.push(weather);
    if (temperature !== undefined) parts.push(`${Math.round(temperature)}°C`);
    if (humidity !== undefined) parts.push(`💧${Math.round(humidity)}%`);
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
        🌤️ {parts.join(' · ')}
      </span>
    );
  }

  if (!hint) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
      🌤️ {hint}
    </span>
  );
}
