import { TravelProfile } from '@/types';

const MAX_TRIP_DAYS = 15;

export function getTripDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function validateTravelProfile(profile: Partial<TravelProfile>): string | null {
  if (!profile.destination) return 'Destination is required';
  if (!profile.startDate) return 'Start date is required';
  if (!profile.endDate) return 'End date is required';

  const days = getTripDays(profile.startDate, profile.endDate);
  if (days < 1) return 'End date must be after start date';
  if (days > MAX_TRIP_DAYS) return `Trip cannot exceed ${MAX_TRIP_DAYS} days (requested: ${days})`;

  if (!profile.totalPeople || profile.totalPeople < 1) return 'At least 1 traveler required';

  return null;
}
