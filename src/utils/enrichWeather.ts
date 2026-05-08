import { ActivityCard, DailyItinerary } from '@/types';

/**
 * Pipeline step 4: enrich each activity card with temperature/humidity/weather
 * by querying Open-Meteo (no API key required) using each card's lat/lng + date.
 *
 * - Up to 16 days of forecast, then climatology fallback isn't worth the cost.
 *   For dates beyond the forecast horizon we silently skip.
 * - All requests for the same lat/lng/date are cached within a single call so
 *   neighbouring cards in a day reuse one HTTP round-trip.
 *
 * Failures (network, parsing) are swallowed; weather is best-effort
 * decoration and must never block itinerary generation.
 */
export async function enrichWithWeather(days: DailyItinerary[]): Promise<DailyItinerary[]> {
  const cache = new Map<string, { temperature?: number; humidity?: number; weather?: string }>();

  await Promise.all(
    days.flatMap((day) =>
      day.cards.map(async (c) => {
        if (c.type !== 'activity') return;
        const card = c as ActivityCard;
        if (!isValidCoord(card.lat) || !isValidCoord(card.lng)) return;
        const date = card.startDate || day.date;
        if (!date) return;

        // Cache by 0.1 degree grid + date; neighbouring cards share weather.
        const key = `${card.lat.toFixed(1)},${card.lng.toFixed(1)},${date}`;
        let wx = cache.get(key);
        if (!wx) {
          wx = await fetchWeather(card.lat, card.lng, date);
          cache.set(key, wx);
        }
        if (wx.temperature !== undefined) card.temperature = wx.temperature;
        if (wx.humidity !== undefined) card.humidity = wx.humidity;
        if (wx.weather !== undefined) card.weather = wx.weather;
      })
    )
  );

  return days;
}

function isValidCoord(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n !== 0;
}

async function fetchWeather(
  lat: number,
  lng: number,
  date: string
): Promise<{ temperature?: number; humidity?: number; weather?: string }> {
  // Open-Meteo serves ~16 days of forecast; older/farther dates return empty.
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,relative_humidity_2m_mean,weathercode` +
    `&timezone=auto&start_date=${date}&end_date=${date}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return {};
    const json = (await res.json()) as {
      daily?: {
        temperature_2m_max?: number[];
        relative_humidity_2m_mean?: number[];
        weathercode?: number[];
      };
    };
    const d = json.daily;
    if (!d) return {};
    return {
      temperature: d.temperature_2m_max?.[0],
      humidity: d.relative_humidity_2m_mean?.[0],
      weather: weatherCodeToLabel(d.weathercode?.[0]),
    };
  } catch {
    return {};
  }
}

/** WMO weather interpretation codes to short human labels. */
function weatherCodeToLabel(code: number | undefined): string | undefined {
  if (code === undefined) return undefined;
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Thunderstorm';
  return undefined;
}
