import type { Vec2, Vec3 } from "../core/types";

declare const normalizedBrand: unique symbol;

export type NormalizedVec3 = Vec3 & {
  readonly [normalizedBrand]: true;
};

interface Target {
  id: string;
  position: Vec3;
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

export const randomUniqueNumber = (min: number, max: number): () => number => {
  const mentionedNumber: number[] = [];

  return function () {
    while (true) {
      const random = Math.floor(Math.random() * (max - min + 1)) + min;

      if (!mentionedNumber.includes(random)) {
        mentionedNumber.push(random);
        return random;
      }
    }
  };
};

export const randomOnePick = <T>(arr: T[]): T | undefined => {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const getDistance = (p1: Vec3, p2: Vec3) => Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);
export const getDistance2D = (p1: Vec2, p2: Vec2) => Math.hypot(p2[1] - p1[1], p2[0] - p2[0]);

export const randomPicks = <T>(arr: T[], count: number): T[] => {
  if (!arr || arr.length === 0) return [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function findNearest(points: string[], target: Vec3): string | undefined {
  if (points.some(e => !api.checkValid(e))) return undefined;

  const targets: Target[] = points.map(id => ({ id, position: api.getPosition(id) }));

  const nearest = targets.reduce<Target | undefined>((nearest, current) => {
    if (!nearest) return current;

    const [dx, dy, dz] = subtractVec(current.position, target);
    const [ndx, ndy, ndz] = subtractVec(nearest.position, target);

    const distance = dx * dx + dy * dy + dz * dz;
    const nearestDistance = ndx * ndx + ndy * ndy + ndz * ndz;

    return distance < nearestDistance ? current : nearest;
  }, undefined);

  return nearest?.id;
}

export function subtractVec(a: Vec3, b: Vec3): Vec3 {
  return [
    a[0] - b[0],
    a[1] - b[1],
    a[2] - b[2]
  ];
}

export function getOffsetPosition(
  vec: Vec3 | NormalizedVec3,
  playerPos: Vec3,
  distance: number
): Vec3 {
  const [vx, vy, vz] = vec;
  const [px, py, pz] = playerPos;

  return [
    vx * distance + px,
    vy * distance + py,
    vz * distance + pz
  ]
}

export function divideVec(start: Vec3, end: Vec3, divideNum: number): Vec3[] | undefined {
  if (divideNum <= 1) return;
  const points: Vec3[] = [];

  for (let k = 1; k < divideNum; k++) {
    // 内分点の公式: ((x - k) * a + k * b) / x
    const targetX = ((divideNum - k) * start[0] + k * end[0]) / divideNum;
    const targetY = ((divideNum - k) * start[1] + k * end[1]) / divideNum;
    const targetZ = ((divideNum - k) * start[2] + k * end[2]) / divideNum;

    points.push([targetX, targetY, targetZ]);
  }

  return points;
}

export function distanceToSegment(
  point: Vec3,
  start: Vec3,
  end: Vec3
): number {
  const [dx, dy, dz] = subtractVec(end, start);
  const lengthSq = dx * dx + dy * dy + dz * dz;

  if (lengthSq === 0) {
    return getDistance(point, start);
  }

  const t = Math.max(0, Math.min(1,
    (
      (point[0] - start[0]) * dx +
      (point[1] - start[1]) * dy +
      (point[2] - start[2]) * dz
    ) / lengthSq
  ));

  const closest = getOffsetPosition([dx, dy, dz], start, t);
  return getDistance(point, closest);
}

export function normalize(arr: Vec3): NormalizedVec3 | null {
  const len = Math.hypot(...arr);

  if (len === 0) return [0, 0, 0] as NormalizedVec3;

  return [
    arr[0] / len,
    arr[1] / len,
    arr[2] / len,
  ] as NormalizedVec3;
}

export function spreadVector3D(vec: NormalizedVec3, maxConeAngleRad: number): Vec3 {
  const [dx, dy, dz] = vec;
  const [ax, ay, az] = Math.abs(dy) < 0.99 ? [0, 1, 0] : [1, 0, 0];

  let ux = ay * dz - az * dy;
  let uy = az * dx - ax * dz;
  let uz = ax * dy - ay * dx;
  const uLen = Math.hypot(ux, uy, uz);
  ux /= uLen;
  uy /= uLen;
  uz /= uLen;

  const vx = dy * uz - dz * uy;
  const vy = dz * ux - dx * uz;
  const vz = dx * uy - dy * ux;

  const cosMax = Math.cos(maxConeAngleRad);
  const cosTheta = 1 - Math.random() * (1 - cosMax);
  const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
  const phi = Math.random() * Math.PI * 2;

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  return [
    dx * cosTheta + (ux * cosPhi + vx * sinPhi) * sinTheta,
    dy * cosTheta + (uy * cosPhi + vy * sinPhi) * sinTheta,
    dz * cosTheta + (uz * cosPhi + vz * sinPhi) * sinTheta,
  ];
}

export function dot(a: number[], b: number[]): number {
  return a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
}

export function tickToSeconds(tick: number) {
  return Math.floor(tick / 20)
}