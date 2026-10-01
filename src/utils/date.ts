/**
 * Date and Epoch Day utilities for Dayfold.
 * Epoch day is the number of days since 1970-01-01 UTC.
 */

const MILLIS_IN_DAY = 86_400_000;

export function getEpochDay(date: Date = new Date(), dayStartHour: number = 0): number {
  // If the user configured dayStartHour > 0, subtract those hours before computing the calendar day
  const adjustedTime = new Date(date.getTime() - dayStartHour * 3600_000);
  const year = adjustedTime.getFullYear();
  const month = adjustedTime.getMonth();
  const day = adjustedTime.getDate();
  return Math.floor(Date.UTC(year, month, day) / MILLIS_IN_DAY);
}

export function epochDayToDate(epochDay: number): Date {
  // Return local Date corresponding to that UTC calendar day
  const utcMillis = epochDay * MILLIS_IN_DAY;
  const d = new Date(utcMillis);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function epochDayToIso(epochDay: number): string {
  const d = epochDayToDate(epochDay);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isoToEpochDay(isoStr: string): number {
  const [year, month, day] = isoStr.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MILLIS_IN_DAY);
}

export function formatDayName(epochDay: number, todayEpoch: number): string {
  if (epochDay === todayEpoch) {
    const d = epochDayToDate(epochDay);
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  }
  if (epochDay === todayEpoch + 1) {
    return 'Tomorrow';
  }
  if (epochDay === todayEpoch - 1) {
    return 'Yesterday';
  }
  const d = epochDayToDate(epochDay);
  return d.toLocaleDateString(undefined, { weekday: 'long' });
}

export function formatShortDate(epochDay: number): string {
  const d = epochDayToDate(epochDay);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatFullDateHeader(epochDay: number): string {
  const d = epochDayToDate(epochDay);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function minuteOfDayToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeStringToMinuteOfDay(timeStr: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function formatMinuteOfDay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  const displayMin = String(m).padStart(2, '0');
  return `${displayHour}:${displayMin} ${period}`;
}

