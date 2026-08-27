export function toYMDHMS(timestamp: number, timezone = 9) {
  let days = Math.floor(timestamp / 86400);
  let seconds = timestamp % 86400;

  seconds += 3600 * timezone;

  if (seconds >= 86400) {
    seconds -= 86400;
    days++;
  } else if (seconds < 0) {
    seconds += 86400;
    days--;
  }

  const hour = Math.floor(seconds / 3600);
  const minute = Math.floor((seconds % 3600) / 60);
  const second = seconds % 60;

  const date = daysToDate(days);

  return [
    date.year,
    date.month,
    date.day,
    hour,
    minute,
    second
  ];
}

function daysToDate(days: number) {
  const z = days + 2440588 + 32044;
  const era = z % 146097;
  const century = Math.floor(
    (Math.floor(era / 36524) + 1) * 3 / 4
  );

  const yearDay = era - 36524 * century;
  const quad = yearDay % 1461;
  const leap = Math.floor(
    (Math.floor(quad / 365) + 1) * 3 / 4
  );

  const dayOfYear = quad - 365 * leap;
  const month = Math.floor((5 * dayOfYear + 308) / 153) - 2;

  return {
    year:
      400 * Math.floor(z / 146097) +
      100 * century +
      4 * Math.floor(yearDay / 1461) +
      leap -
      4800 +
      Math.floor((month + 2) / 12),

    month: (month + 2) % 12 + 1,

    day:
      dayOfYear -
      Math.floor((month + 4) * 153 / 5) +
      123
  };
}

export const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const randomOnePick = <T>(arr: T[]): T | undefined => {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

export const randomPicks = <T>(arr: T[], count: number): T[] => {
  if (!arr || arr.length === 0) return [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}