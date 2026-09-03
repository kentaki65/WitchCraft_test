type Vec3 = [number, number, number];
type Target = {
  id: string;
  position: [number, number, number];
};

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

export const getDistance = (p1: Vec3, p2: Vec3) => Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);

export const randomPicks = <T>(arr: T[], count: number): T[] => {
  if (!arr || arr.length === 0) return [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function findNearest(points: string[], target: [number, number, number]): string | undefined {
  const targets: Target[] = points.map(id => ({ id, position: api.getPosition(id) }));

  const nearest = targets.reduce<Target | undefined>((nearest, current) => {
    if (!nearest) return current;

    const dx = current.position[0] - target[0];
    const dy = current.position[1] - target[1];
    const dz = current.position[2] - target[2];

    const ndx = nearest.position[0] - target[0];
    const ndy = nearest.position[1] - target[1];
    const ndz = nearest.position[2] - target[2];

    const distance = dx * dx + dy * dy + dz * dz;
    const nearestDistance =
      ndx * ndx + ndy * ndy + ndz * ndz;

    return distance < nearestDistance ? current : nearest;
  }, undefined);

  return nearest?.id;
}

export function subtractVec(a: Vec3, b: Vec3): Vec3 {
  return [
    b[0] - a[0],
    b[1] - a[1],
    b[2] - a[2]
  ];
}

export function divideVec(a: Vec3, b: Vec3, x: number): Vec3[] | undefined{
  if(x <= 1) return;
  const points: Vec3[] = [];

  for(let k = 1; k < x; k++){
    // 内分点の公式: ((x - k) * a + k * b) / x
    const targetX = ((x - k) * a[0] + k * b[0]) / x;
    const targetY = ((x - k) * a[1] + k * b[1]) / x;
    const targetZ = ((x - k) * a[2] + k * b[2]) / x;

    points.push([targetX, targetY, targetZ]);
  }

  return points;
}

export function normalize(arr: number[]) {
  const len = Math.hypot(...arr);
  if (len === 0) return arr.map(() => 0);
  return arr.map(val => val / len);
}