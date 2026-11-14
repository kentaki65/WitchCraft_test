//@ts-nocheck
import { World } from "../types";
import { setTimeout } from "@plugins/helpers";
import { Promise } from "../api/promise";
import { TICK_CONFIG } from "../constance";

// src/lru.ts
var BoundedCache = class {
  constructor(max) {
    this.max = max;
    this.map = /* @__PURE__ */ new Map();
  }
  get(key) {
    return this.map.get(key);
  }
  set(key, value) {
    this.map.set(key, value);
    if (this.map.size > this.max) {
      this.map.delete(this.map.keys().next().value);
    }
  }
};

// src/column.ts
var NO_WATER = -1e4;
var WATER_REACH = 15;
var CACHE_SIZE = 4096;
var CACHE_LIMIT = 1073741824;
var ColumnField = class {
  constructor(biomes, terrain, water_) {
    this.biomes = biomes;
    this.terrain = terrain;
    this.water_ = water_;
    /** 固体の地表高さ（水中は河床/湖床） */
    this.ground = 0;
    /** 水面の高さ。水が無ければ NO_WATER */
    this.water = NO_WATER;
    /** その列のバイオーム（getBiome と同じエントリ index） */
    this.biomeId = 0;
    this.keyX = new Int32Array(CACHE_SIZE);
    this.keyZ = new Int32Array(CACHE_SIZE);
    this.used = new Uint8Array(CACHE_SIZE);
    this.cGround = new Int32Array(CACHE_SIZE);
    this.cWater = new Int32Array(CACHE_SIZE);
    this.cBiome = new Int8Array(CACHE_SIZE);
  }
  /** キャッシュ付き（getBlockId の縦スキャン・単点 API 用） */
  load(x, z) {
    if (!(Math.abs(x) < CACHE_LIMIT && Math.abs(z) < CACHE_LIMIT)) {
      this.compute(x, z);
      return;
    }
    const slot = (Math.imul(x, 73856093) ^ Math.imul(z, 19349663)) & CACHE_SIZE - 1;
    if (this.used[slot] === 1 && this.keyX[slot] === x && this.keyZ[slot] === z) {
      this.ground = this.cGround[slot];
      this.water = this.cWater[slot];
      this.biomeId = this.cBiome[slot];
      return;
    }
    this.compute(x, z);
    this.used[slot] = 1;
    this.keyX[slot] = x;
    this.keyZ[slot] = z;
    this.cGround[slot] = this.ground;
    this.cWater[slot] = this.water;
    this.cBiome[slot] = this.biomeId;
  }
  /** キャッシュなし（範囲 API 用）。x, z は整数 */
  compute(x, z) {
    const biomes = this.biomes;
    biomes.blend(x, z);
    this.biomeId = biomes.blendIds[0];
    const px = x + this.terrain.perturbX(x, z);
    const pz = z + this.terrain.perturbZ(x, z);
    const noWater = this.terrain.noWater(biomes, px, pz);
    if (!this.water_.query(px, pz)) {
      this.ground = noWater;
      this.water = NO_WATER;
      return;
    }
    const w = this.water_;
    const distance = w.distance;
    const radius = w.radius;
    const influence = radius + WATER_REACH;
    if (!(distance <= influence)) {
      this.ground = noWater;
      this.water = NO_WATER;
      return;
    }
    const waterHeight = w.waterHeight;
    const nearRadius = radius + 4;
    const nearHeight = waterHeight + 2;
    let ground;
    let water = NO_WATER;
    if (distance <= radius) {
      let progress = distance / radius;
      if (w.isLake) {
        progress *= progress * progress;
        ground = Math.floor(w.bedHeight + (waterHeight - w.bedHeight) * progress - 2);
      } else {
        progress *= progress;
        ground = Math.floor(w.bedHeight + (waterHeight - w.bedHeight) * progress);
      }
      water = waterHeight;
    } else if (distance <= nearRadius) {
      const progress = (distance - radius) / (nearRadius - radius);
      ground = waterHeight + Math.ceil((nearHeight - waterHeight) * progress);
    } else {
      const progress = (distance - nearRadius) / (influence - nearRadius);
      ground = nearHeight + Math.ceil((noWater - nearHeight) * progress);
    }
    this.ground = ground;
    this.water = water;
  }
};

// src/rng.ts
export class SeededRandom {
  constructor(seed) {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
    }
    this.a = hash;
  }
  next() {
    let state = this.a += 1831565813;
    state = Math.imul(state ^ state >>> 15, state | 1);
    state ^= state + Math.imul(state ^ state >>> 7, state | 61);
    return ((state ^ state >>> 14) >>> 0) / 4294967296;
  }
};

function selectWeightedIndex(frequencies, total, rng) {
  const target = rng.next() * total;
  let cumulative = 0;
  let index = 0;
  while (cumulative <= target) {
    cumulative += frequencies[index];
    index++;
  }
  return index - 1;
}
var F2 = 0.5 * (Math.sqrt(3) - 1);
var G2 = (3 - Math.sqrt(3)) / 6;
var GRAD3 = new Float32Array([
  1,
  1,
  0,
  -1,
  1,
  0,
  1,
  -1,
  0,
  -1,
  -1,
  0,
  1,
  0,
  1,
  -1,
  0,
  1,
  1,
  0,
  -1,
  -1,
  0,
  -1,
  0,
  1,
  1,
  0,
  -1,
  1,
  0,
  1,
  -1,
  0,
  -1,
  -1
]);
function masher() {
  let n = 4022871197;
  return (data) => {
    for (let i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      let h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 4294967296;
    }
    return (n >>> 0) * 23283064365386963e-26;
  };
}
function alea(seed) {
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let c = 1;
  const mash = masher();
  s0 = mash(" ");
  s1 = mash(" ");
  s2 = mash(" ");
  s0 -= mash(seed);
  if (s0 < 0) s0 += 1;
  s1 -= mash(seed);
  if (s1 < 0) s1 += 1;
  s2 -= mash(seed);
  if (s2 < 0) s2 += 1;
  return () => {
    const t = 2091639 * s0 + c * 23283064365386963e-26;
    s0 = s1;
    s1 = s2;
    return s2 = t - (c = t | 0);
  };
}
function makeNoise2D(seed) {
  const random = alea(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 0; i < 255; i++) {
    const r = i + ~~(random() * (256 - i));
    const aux = p[i];
    p[i] = p[r];
    p[r] = aux;
  }
  const perm = new Uint8Array(512);
  const permMod12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }
  return (x, y) => {
    let n0 = 0;
    let n1 = 0;
    let n2 = 0;
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    let i1;
    let j1;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = permMod12[ii + perm[jj]] * 3;
      t0 *= t0;
      n0 = t0 * t0 * (GRAD3[gi0] * x0 + GRAD3[gi0 + 1] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
      t1 *= t1;
      n1 = t1 * t1 * (GRAD3[gi1] * x1 + GRAD3[gi1 + 1] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
      t2 *= t2;
      n2 = t2 * t2 * (GRAD3[gi2] * x2 + GRAD3[gi2 + 1] * y2);
    }
    return 70 * (n0 + n1 + n2);
  };
}
function makeOctaves(seed, defs) {
  const fns = defs.map((_, i) => makeNoise2D(`${seed}${i}`));
  const n = defs.length;
  return (x, y) => {
    let value = 0;
    for (let i = 0; i < n; i++) {
      value += fns[i](x * defs[i][1], y * defs[i][1]) * defs[i][0];
    }
    return value;
  };
}

// src/blocks.ts
var MIN_Y = -128;
var BEDROCK_Y = -100;
var SOIL_DEPTH = 4;
var GRASS = ["Grass Block", "Dirt", "Water"];
var FROZEN = ["Packed Snow", "Snow", "Ice"];
var JUNGLE = ["Jungle Grass Block", "Dirt", "Water"];
var SAND = ["Sand", "Sand", "Water"];
var SNOWY = ["Snow", "Dirt", "Ice"];
var MOUNTAIN_ID = 23;
var SOILS = [
  JUNGLE,
  SAND,
  FROZEN,
  SAND,
  ["Red Sand", "Red Sand", "Water"],
  JUNGLE,
  GRASS,
  FROZEN,
  GRASS,
  GRASS,
  SNOWY,
  GRASS,
  GRASS,
  GRASS,
  GRASS,
  GRASS,
  FROZEN,
  GRASS,
  JUNGLE,
  ["Pine Grass Block", "Dirt", "Water"],
  FROZEN,
  SNOWY,
  GRASS,
  GRASS,
  GRASS
];
var STONE_NAMES = ["Stone", "Andesite", "Diorite", "Granite"];
var CLAY_GRID = 100;
var CLAY_STEP = 50;
var CLAY_CACHE_MAX = 256;
function resolveId(name) {
  const id = api.getInitialItemMetadata(name).id;
  if (id === void 0) throw new Error(`Unknown block name: ${name}`);
  return id;
}
var TerrainBlocks = class {
  constructor(seed, biomes, column) {
    this.seed = seed;
    this.biomes = biomes;
    this.column = column;
    this.top = new Int32Array(SOILS.length);
    this.low = new Int32Array(SOILS.length);
    this.topWater = new Int32Array(SOILS.length);
    this.bedrock = resolveId("Bedrock");
    this.water = resolveId("Water");
    this.sand = resolveId("Sand");
    this.clay = resolveId("Clay");
    this.chalk = resolveId("Chalk");
    this.snow = resolveId("Snow");
    this.stoneBlock = resolveId("Stone");
    this.grass = resolveId("Grass Block");
    this.rockyDirt = resolveId("Rocky Dirt");
    this.dirt = resolveId("Dirt");
    this.clayCells = new BoundedCache(CLAY_CACHE_MAX);
    /** 直近の列の石の種類（縦スキャン用） */
    this.stoneX = NaN;
    this.stoneZ = NaN;
    this.stoneId = 0;
    for (let i = 0; i < SOILS.length; i++) {
      this.top[i] = resolveId(SOILS[i][0]);
      this.low[i] = resolveId(SOILS[i][1]);
      this.topWater[i] = resolveId(SOILS[i][2]);
    }
    this.stone = Int32Array.from(STONE_NAMES.map(resolveId));
  }
  /** 整数座標のブロック ID */
  blockAt(x, y, z) {
    if (y < MIN_Y) return 0;
    const col = this.column;
    col.load(x, z);
    return this.blockIn(x, y, z, col.ground, col.water, col.biomeId);
  }
  /** 地表高度を指定して1ブロック生成する。水面・河床の特殊処理は適用しない。 */
  generateBlock(x, y, z, groundY) {
    if (y < MIN_Y) return 0;
    this.biomes.blend(x, z);
    return this.blockIn(x, y, z, groundY, NO_WATER, this.biomes.blendIds[0]);
  }
  /** 同じ列の地形ブロックを生成するときにバイオーム計算を再利用する。 */
  createColumnGenerator(x, z, groundY) {
    let biomeId = -1;
    return (y) => {
      if (y < MIN_Y) return 0;
      if (biomeId < 0) {
        this.biomes.blend(x, z);
        biomeId = this.biomes.blendIds[0];
      }
      return this.blockIn(x, y, z, groundY, NO_WATER, biomeId);
    };
  }
  /**
   * 1 列分のブロック ID。要素 i は y = MIN_Y + i。上端は max(地表, 水面, 岩盤 y=-100)（それより上は全て空気なので含めない）。
   * 列情報（地表・水面・バイオーム・石の種類）は 1 回だけ求め、石の層は fill で埋める。
   */
  columnAt(x, z) {
    const col = this.column;
    col.load(x, z);
    const gh = col.ground;
    const wh = col.water;
    const biomeId = col.biomeId;
    const top = Math.max(gh, wh === NO_WATER ? gh : wh, BEDROCK_Y);
    const out = new Int32Array(top - MIN_Y + 1);
    const stoneTop = gh - SOIL_DEPTH - 1;
    if (stoneTop >= MIN_Y) {
      out.fill(this.stoneAt(x, z), 0, stoneTop - MIN_Y + 1);
      if (BEDROCK_Y <= stoneTop) out[BEDROCK_Y - MIN_Y] = this.bedrock;
    }
    for (let y = Math.max(MIN_Y, stoneTop + 1); y <= top; y++) {
      out[y - MIN_Y] = this.blockIn(x, y, z, gh, wh, biomeId);
    }
    return out;
  }
  /** 列情報（地表 gh・水面 wh・バイオーム）が分かっているときの y のブロック ID（y >= MIN_Y） */
  blockIn(x, y, z, gh, wh, biomeId) {
    const hasWater = wh !== NO_WATER;
    if (y > gh && !(hasWater && y <= wh)) return y === BEDROCK_Y ? this.bedrock : 0;
    let id = 0;
    if (y === gh) id = this.topsoil(biomeId, gh);
    if (y >= gh - SOIL_DEPTH && y < gh) id = this.lowsoil(biomeId, y, gh);
    if (y < gh - SOIL_DEPTH) id = this.stoneAt(x, z);
    if (y === BEDROCK_Y) id = this.bedrock;
    if (hasWater && y > gh && y <= wh) id = y === wh ? this.topWater[biomeId] : this.water;
    if (hasWater && y <= gh && y >= gh - 2) {
      if (wh === gh) {
        if (y === gh) id = this.sand;
      } else {
        const bed = this.riverbed(x, z);
        if (bed !== 0) id = bed;
        else if (y === gh) id = this.lowsoil(biomeId, gh, gh);
      }
    }
    return id;
  }
  topsoil(biomeId, gh) {
    if (biomeId === MOUNTAIN_ID) return gh > 80 ? this.snow : gh > 60 ? this.stoneBlock : this.grass;
    return this.top[biomeId];
  }
  lowsoil(biomeId, y, gh) {
    if (biomeId === MOUNTAIN_ID) {
      return y > 85 && y >= gh - 2 ? this.snow : y > 57 ? this.stoneBlock : y > 53 ? this.rockyDirt : this.dirt;
    }
    return this.low[biomeId];
  }
  stoneAt(x, z) {
    if (x !== this.stoneX || z !== this.stoneZ) {
      this.stoneX = x;
      this.stoneZ = z;
      this.stoneId = this.stone[this.biomes.stoneType(x, z)];
    }
    return this.stoneId;
  }
  /** 河床点まで距離² < 100 なら Chalk/Clay の ID、そうでなければ 0 */
  riverbed(x, z) {
    const cx = Math.floor(x / CLAY_GRID);
    const cz = Math.floor(z / CLAY_GRID);
    let best = 1e10;
    let bx = 0;
    let bz = 0;
    for (let k = -1; k < 9; k++) {
      let nx = cx;
      let nz = cz;
      if (k >= 0) {
        nx = cx + (k / 3 | 0) - 1;
        nz = cz + k % 3 - 1;
        if (nx === cx && nz === cz) continue;
      }
      const pts = this.clayCell(nx, nz);
      for (let i = 0; i < pts.length; i += 2) {
        const dx = pts[i] - x;
        const dz = pts[i + 1] - z;
        const d = dx * dx + dz * dz;
        if (d < best) {
          best = d;
          bx = pts[i];
          bz = pts[i + 1];
        }
      }
    }
    if (!(best < 100)) return 0;
    return new SeededRandom(`${this.seed}${bx}${bz}`).next() < 0.3 ? this.chalk : this.clay;
  }
  /** 1 セル 4 点（jittered grid: 50 刻みの 2×2 + floor(rng*50)） */
  clayCell(cx, cz) {
    const key = cx * 1048576 + cz;
    let pts = this.clayCells.get(key);
    if (pts === void 0) {
      pts = new Int32Array(8);
      const rng = new SeededRandom(`${cx}${cz}${this.seed}jitter`);
      let n = 0;
      for (let ox = cx * CLAY_GRID; ox < (cx + 1) * CLAY_GRID; ox += CLAY_STEP) {
        for (let oz = cz * CLAY_GRID; oz < (cz + 1) * CLAY_GRID; oz += CLAY_STEP) {
          pts[n++] = ox + Math.floor(rng.next() * CLAY_STEP);
          pts[n++] = oz + Math.floor(rng.next() * CLAY_STEP);
        }
      }
      this.clayCells.set(key, pts);
    }
    return pts;
  }
};

// src/biomePoints.ts
var GRID = 288;
var MIN_DIST = 150;
var SHAPE = GRID - MIN_DIST;
var TRIES = 40;
var MIN_PLUS_EPSILON = MIN_DIST + 1e-14 * Math.max(1, SHAPE / 128 | 0);
var DELTA_DISTANCE = Math.max(0, MIN_DIST - MIN_PLUS_EPSILON);
var SQUARED_MIN_DISTANCE = MIN_DIST * MIN_DIST;
var CELL_CACHE_MAX = 2048;
var BiomePointField = class {
  constructor(seed) {
    this.seed = seed;
    /** 現在の近傍点（有効数は count） */
    this.xs = new Float64Array(64);
    this.zs = new Float64Array(64);
    this.count = 0;
    /** 直近の nearest() で見つかった最近傍までの距離 */
    this.bestDist = 0;
    this.cells = new BoundedCache(CELL_CACHE_MAX);
    this.gather = new Array(9);
    this.curCx = NaN;
    this.curCz = NaN;
  }
  /** 最近傍点の index（近傍に点が無ければ -1）。同距離は先勝ち（strict-less）。bundle の getClosestPoint と同じ */
  nearest(qx, qz) {
    this.ensure(Math.floor(qx / GRID), Math.floor(qz / GRID));
    const xs = this.xs;
    const zs = this.zs;
    let best = 1e4;
    let bi = -1;
    for (let i = 0; i < this.count; i++) {
      const dx = xs[i] - qx;
      const dz = zs[i] - qz;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < best) {
        best = d;
        bi = i;
      }
    }
    this.bestDist = best;
    return bi;
  }
  ensure(cx, cz) {
    if (cx === this.curCx && cz === this.curCz) return;
    const g = this.gather;
    let n = 0;
    let total = 0;
    g[n] = this.cell(cx, cz);
    total += g[n++].length;
    for (let ax = cx - 1; ax <= cx + 1; ax++) {
      for (let az = cz - 1; az <= cz + 1; az++) {
        if (ax === cx && az === cz) continue;
        g[n] = this.cell(ax, az);
        total += g[n++].length;
      }
    }
    const need = total >> 1;
    if (need > this.xs.length) {
      this.xs = new Float64Array(need * 2);
      this.zs = new Float64Array(need * 2);
    }
    let k = 0;
    for (let c = 0; c < 9; c++) {
      const pts = g[c];
      for (let i = 0; i < pts.length; i += 2) {
        this.xs[k] = pts[i];
        this.zs[k] = pts[i + 1];
        k++;
      }
    }
    this.count = k;
    this.curCx = cx;
    this.curCz = cz;
  }
  /**
   * 1 セルのバイオーム点（poisson-disk-sampling の結果と同一）。
   * この設定（138×138 に最小距離 150）では 3 点は互いに 150 以上離れられないので、点は最大 2 個:
   * 1 点目は乱数 2 回、2 点目は 1 点目の周りの候補（40 回まで）のうち最初に範囲内かつ距離 ≥150 のもの。
   * 乱数の消費順（距離 → 角度）と距離判定（Math.pow）はライブラリと同じ。
   */
  cell(cx, cz) {
    const key = cx * 67108864 + (cz + 33554432);
    let pts = this.cells.get(key);
    if (pts === void 0) {
      const rng = new SeededRandom(`${cx}${cz}${this.seed}pts`);
      const x0 = rng.next() * SHAPE;
      const z0 = rng.next() * SHAPE;
      let x1 = 0;
      let z1 = 0;
      let two = false;
      for (let t = 0; t < TRIES; t++) {
        const distance = MIN_PLUS_EPSILON + DELTA_DISTANCE * rng.next();
        const angle = rng.next() * Math.PI * 2;
        const nx = x0 + Math.cos(angle) * distance;
        if (!(nx >= 0 && nx < SHAPE)) continue;
        const nz = z0 + Math.sin(angle) * distance;
        if (!(nz >= 0 && nz < SHAPE)) continue;
        if (Math.pow(nx - x0, 2) + Math.pow(nz - z0, 2) < SQUARED_MIN_DISTANCE) continue;
        x1 = nx;
        z1 = nz;
        two = true;
        break;
      }
      pts = new Float64Array(two ? 4 : 2);
      pts[0] = Math.floor(cx * GRID + x0);
      pts[1] = Math.floor(cz * GRID + z0);
      if (two) {
        pts[2] = Math.floor(cx * GRID + x1);
        pts[3] = Math.floor(cz * GRID + z1);
      }
      this.cells.set(key, pts);
    }
    return pts;
  }
};

// src/biome.ts
var ENTRIES = [
  ["Jungle", 2, "Forest"],
  ["Desert", 31, null],
  ["FrozenBadlandsPlains", 2, "Plains"],
  ["CactusDesert", 1, null],
  ["RedDesert", 4, null],
  ["Jungle", 6, "Forest"],
  ["Plains", 62, null],
  ["FrozenBadlandsPlains", 2, "Plains"],
  ["MaplePlains", 4, null],
  ["TallGrassPlains", 2, null],
  ["SnowyPlains", 4, null],
  ["Forest", 16, null],
  ["CherryForest", 4, null],
  ["PearForest", 6, null],
  ["AutumnForest", 6, null],
  ["PumpkinForest", 24, null],
  ["FrozenBadlandsForest", 2, "Forest"],
  ["CherryForest", 2, null],
  ["Jungle", 4, "Forest"],
  ["PineForest", 12, "Forest"],
  ["FrozenBadlandsForest", 2, "Forest"],
  ["SnowyPineForest", 2, "Forest"],
  ["RollingHills", 32, null],
  ["SnowyMountains", 16, null],
  ["BlueForest", 4, null]
];
var MIN_ORIGIN_DISTANCE = {
  Jungle: 200,
  PineForest: 200,
  SnowyPineForest: 200,
  FrozenBadlandsPlains: 400,
  FrozenBadlandsForest: 400
};
var BIOME_NAMES = ENTRIES.map((e) => e[0]);
var FREQUENCIES = Int32Array.from(ENTRIES.map((e) => e[1]));
var TOTAL_FREQUENCY = ENTRIES.reduce((sum, e) => sum + e[1], 0);
var MIN_DISTANCE_BY_ID = Int32Array.from(ENTRIES.map((e) => MIN_ORIGIN_DISTANCE[e[0]] || 0));
var ALT_ID_BY_ID = Int32Array.from(
  ENTRIES.map((e) => e[2] === null ? -1 : ENTRIES.findIndex((x) => x[0] === e[2]))
);
var STONE_FREQUENCIES = Int32Array.from([100, 4, 2, 1]);
var STONE_TOTAL = 107;
var POINT_MEMO_MAX = 4096;
var BLEND_DISTANCE = 60;
var COORD_LIMIT = 67108864;
var BiomeField = class {
  constructor(seed) {
    this.seed = seed;
    this.pointMemo = /* @__PURE__ */ new Map();
    this.stoneMemo = /* @__PURE__ */ new Map();
    /** blend() の結果（先頭が最近傍 = getBiome のバイオーム）。有効数は blendCount */
    this.blendIds = new Int8Array(64);
    this.blendWeights = new Float64Array(64);
    this.blendCount = 0;
    this.points = new BiomePointField(seed);
    this.offset = makeOctaves(`${seed}BiomeOffsetSimplex`, [[1, 0.2], [5, 1 / 70]]);
  }
  /** 整数座標 (x, z) の biomeId（= BiomeSelector.generate(x,z)[0].biomeId = getBiome の biomeId） */
  biomeId(x, z) {
    const qx = x + Math.floor(this.offset(x, z));
    const qz = z + Math.floor(this.offset(x + 500, z + 860));
    const i = this.points.nearest(qx, qz);
    return i < 0 ? this.pointBiome(0, 0) : this.pointBiome(this.points.xs[i], this.points.zs[i]);
  }
  /**
   * 整数座標 (x, z) の石の種類（0..3 = Stone/Andesite/Diorite/Granite）。
   * 最近傍バイオーム点ごとに SeededRandom(`${px}|${pz}|${seed}Modifiers`) で決まる（標準 biomeEntries 共通）。
   */
  stoneType(x, z) {
    const qx = x + Math.floor(this.offset(x, z));
    const qz = z + Math.floor(this.offset(x + 500, z + 860));
    const i = this.points.nearest(qx, qz);
    const px = i < 0 ? 0 : this.points.xs[i];
    const pz = i < 0 ? 0 : this.points.zs[i];
    const cacheable = Math.abs(px) < COORD_LIMIT && Math.abs(pz) < COORD_LIMIT;
    const key = px * 134217728 + (pz + COORD_LIMIT);
    if (cacheable) {
      const hit = this.stoneMemo.get(key);
      if (hit !== void 0) return hit;
    }
    const type = selectWeightedIndex(STONE_FREQUENCIES, STONE_TOTAL, new SeededRandom(`${px}|${pz}|${this.seed}Modifiers`));
    if (cacheable) {
      if (this.stoneMemo.size >= POINT_MEMO_MAX) this.stoneMemo.clear();
      this.stoneMemo.set(key, type);
    }
    return type;
  }
  /**
   * generate() と同じ順序・同じ浮動小数演算の (biomeId, weight) 列を blendIds/blendWeights に作る。
   * 最近傍との距離差が 60 未満の点だけ。重み = (60 - diff) / (60 + Σ(60 - diff))
   */
  blend(x, z) {
    const qx = x + Math.floor(this.offset(x, z));
    const qz = z + Math.floor(this.offset(x + 500, z + 860));
    const pts = this.points;
    const ids = this.blendIds;
    const w = this.blendWeights;
    const near = pts.nearest(qx, qz);
    if (near < 0) {
      ids[0] = this.pointBiome(0, 0);
      w[0] = 1;
      this.blendCount = 1;
      return;
    }
    const xs = pts.xs;
    const zs = pts.zs;
    const best = pts.bestDist;
    const cx = xs[near];
    const cz = zs[near];
    ids[0] = this.pointBiome(cx, cz);
    w[0] = 0;
    let n = 1;
    let remaining = BLEND_DISTANCE;
    for (let i = 0; i < pts.count && n < 64; i++) {
      if (xs[i] === cx && zs[i] === cz) continue;
      const dx = xs[i] - qx;
      const dz = zs[i] - qz;
      const diff = Math.sqrt(dx * dx + dz * dz) - best;
      if (diff < BLEND_DISTANCE) {
        ids[n] = this.pointBiome(xs[i], zs[i]);
        w[n] = diff;
        n++;
        remaining += BLEND_DISTANCE - diff;
      }
    }
    for (let i = 0; i < n; i++) w[i] = (BLEND_DISTANCE - w[i]) / remaining;
    this.blendCount = n;
  }
  /** バイオーム点 (px,pz) のエントリ index。点ごとに決定的なのでメモ化する */
  pointBiome(px, pz) {
    const cacheable = Math.abs(px) < COORD_LIMIT && Math.abs(pz) < COORD_LIMIT;
    const key = px * 134217728 + (pz + COORD_LIMIT);
    if (cacheable) {
      const hit = this.pointMemo.get(key);
      if (hit !== void 0) return hit;
    }
    let id = selectWeightedIndex(FREQUENCIES, TOTAL_FREQUENCY, new SeededRandom(`${px}|${pz}|${this.seed}`));
    if (Math.max(Math.abs(px), Math.abs(pz)) < MIN_DISTANCE_BY_ID[id]) id = ALT_ID_BY_ID[id];
    if (cacheable) {
      if (this.pointMemo.size >= POINT_MEMO_MAX) this.pointMemo.clear();
      this.pointMemo.set(key, id);
    }
    return id;
  }
};

// src/heightNoise.ts
var KIND_BY_BIOME_ID = [
  "Forest",
  "Desert",
  "FBPlains",
  "Desert",
  "RedDesert",
  "Forest",
  "Plains",
  "FBPlains",
  "Plains",
  "Plains",
  "Plains",
  "Forest",
  "Forest",
  "Forest",
  "Forest",
  "Forest",
  "FBForest",
  "Forest",
  "Forest",
  "Forest",
  "FBForest",
  "Forest",
  "RollingHills",
  "SnowyMountains",
  "BlueForest"
];
var TerrainNoise = class {
  constructor(seed) {
    this.seed = seed;
    this.byKind = /* @__PURE__ */ new Map();
    this.byBiome = new Array(KIND_BY_BIOME_ID.length);
    this.global = makeOctaves(`${seed}GlobalHeightmapOffset`, [[11, 1 / 4e3], [4, 1e-3]]);
    this.perturb = makeOctaves(`${seed}HeightmapPerturb`, [[1, 1 / 14], [5, 1 / 65], [20, 4e-3]]);
  }
  /** HeightmapGenerator.generateAndSet の xPerturb / zPerturb */
  perturbX(x, z) {
    return Math.floor(this.perturb(x, z));
  }
  perturbZ(x, z) {
    return Math.floor(this.perturb(x + 200, z + 778));
  }
  /**
   * NoWaterHeightmap.getNoWaterHeightmapVal: floor(Σ h_i(x,z) * w_i) + floor(global(x,z))。
   * 重みは biomes.blend() の直近の結果を使う。
   */
  noWater(biomes, x, z) {
    const ids = biomes.blendIds;
    const w = biomes.blendWeights;
    const n = biomes.blendCount;
    let height = 0;
    for (let i = 0; i < n; i++) height += this.fnOf(ids[i])(x, z) * w[i];
    return Math.floor(height) + Math.floor(this.global(x, z));
  }
  fnOf(biomeId) {
    let f = this.byBiome[biomeId];
    if (f === void 0) {
      f = this.kindFn(KIND_BY_BIOME_ID[biomeId]);
      this.byBiome[biomeId] = f;
    }
    return f;
  }
  kindFn(kind) {
    let f = this.byKind.get(kind);
    if (f === void 0) {
      f = this.make(kind);
      this.byKind.set(kind, f);
    }
    return f;
  }
  make(kind) {
    const seed = this.seed;
    const std = (a, b) => this.stdNoise(kind, seed, a, b);
    switch (kind) {
      case "Desert": {
        const n = std(2, 1);
        return (x, z) => -5 + n(x, z);
      }
      case "RedDesert": {
        const n = std(2, 1);
        return (x, z) => -5 + n(x, z);
      }
      case "Plains": {
        const n = std(4, 2);
        return (x, z) => -5 + n(x, z);
      }
      case "Forest": {
        const n = std(4, 2);
        return (x, z) => -5 + n(x, z);
      }
      case "BlueForest": {
        const n = std(4, 2);
        return (x, z) => -5 + n(x, z);
      }
      case "FBPlains": {
        const n = std(3, 1);
        return (x, z) => -5 + n(x, z);
      }
      case "FBForest": {
        const n = std(3, 1);
        return (x, z) => -5 + n(x, z);
      }
      case "RollingHills": {
        const n = makeOctaves(`${seed}RollingHillsBiomeHeightMap`, [[20, 5e-3], [4, 1 / 70]]);
        return (x, z) => 20 + n(x, z);
      }
      case "SnowyMountains": {
        const r1 = makeOctaves(`${seed}SnowyMountainsBiomeRidgedNoise`, [[80, 5e-3]]);
        const r2 = makeOctaves(`${seed}SnowyMountainsBiomeRidgedNoiseOctave2`, [[20, 1 / 120]]);
        const nr = makeOctaves(`${seed}SnowyMountainsBiomeNonRidgedNoise`, [[8, 1 / 120]]);
        const amplitude = 80 + 20;
        return (x, z) => 0 + (amplitude - Math.abs(r1(x, z)) - Math.abs(r2(x, z))) + nr(x, z);
      }
    }
  }
  /** 標準形（[a, 1/70], [b, 1/30]）のノイズ。シード名は各クラスのコンストラクタに渡る文字列 */
  stdNoise(kind, seed, a, b) {
    const name = {
      Desert: "DesertBiomeHeightMap",
      RedDesert: "RedDesertDesertBiomeHeightMap",
      Plains: "PlainsBiomeHeightMap",
      Forest: "ForestBiomeHeightMap",
      BlueForest: "BlueForestBiomeHeightMap",
      FBPlains: "FrozenBadlandsPlainsHeightMap",
      FBForest: "FrozenBadlandsForestHeightMap"
    };
    return makeOctaves(`${seed}${name[kind]}`, [[a, 1 / 70], [b, 1 / 30]]);
  }
};

// src/water.ts
var GRID2 = 224;
var CENTER_OFFSET = 11;
var SELF_FLUX = 100;
var RIVER_WIDTH = 23;
var RIVER_AT_FLUX = 800;
var WIDTH_OFFSET = 2;
var LAKE_MIN_RADIUS = 15;
var LAKE_MAX_RADIUS = 60;
var LAKE_AT_FLUX = 1700;
var LAKE_NO_FLUX_CUTOFF = 50;
var LAKE_NOISE_AMPLITUDE = 14;
var RIVER_REACH = 29;
var CELL_CACHE_MAX2 = 1024;
var NO_RECT = new Float64Array(0);
var Cell = class {
  constructor() {
    this.ox = 0;
    this.oz = 0;
    this.h = 0;
    this.linked = false;
    this.hasDown = false;
    this.downCx = 0;
    this.downCz = 0;
    this.dox = 0;
    this.doz = 0;
    this.dh = 0;
    /** 上流セル: [ox, oz, h, incomingFlux] を 4 要素ずつ */
    this.ups = null;
    this.incoming = 0;
    this.lakeDone = false;
    this.hasLake = false;
    this.lakeR = 0;
    this.lakeWater = 0;
    this.lakeBed = 0;
    /** 下流セルの湖（getWaterInfo(downhill, false) の lakeInfo） */
    this.downResolved = false;
    this.dHasLake = false;
    this.dLakeR = 0;
    this.dLakeWater = 0;
    /** 影響が及び得る矩形 [minX, maxX, minZ, maxZ] の列。null は未計算 */
    this.rects = null;
  }
};
var segAlong = 0;
var segFrac = 0;
var segLength = 0;
function closestOnSegment(px, pz, ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  const lengthSq = dx * dx + dz * dz;
  const projection = ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / lengthSq;
  let cx;
  let cz;
  if (projection < 0) {
    cx = ax;
    cz = az;
    segFrac = 0;
  } else if (projection > 1) {
    cx = bx;
    cz = bz;
    segFrac = 1;
  } else {
    cx = ax + projection * (bx - ax);
    cz = az + projection * (bz - az);
    segFrac = projection;
  }
  const ex = px - cx;
  const ez = pz - cz;
  segAlong = Math.sqrt(ex * ex + ez * ez);
  segLength = Math.sqrt(lengthSq);
}
var WaterField = class {
  constructor(seed, biomes, terrain, rejectEarly = true) {
    this.seed = seed;
    this.biomes = biomes;
    this.terrain = terrain;
    this.rejectEarly = rejectEarly;
    this.distance = 0;
    this.radius = 0;
    this.waterHeight = 0;
    this.bedHeight = 0;
    this.isLake = false;
    this.cells = new BoundedCache(CELL_CACHE_MAX2);
    this.lastKey = NaN;
    this.last = null;
    this.lakeNoise = makeOctaves(`${seed}GlobalHeightmapOffset`, [[10, 1 / 55], [4, 0.04]]);
  }
  query(x, z) {
    const cell = this.cellAt(Math.floor(x / GRID2), Math.floor(z / GRID2));
    if (this.rejectEarly && !inRects(cell.rects, x, z)) return false;
    return this.compute(cell, x, z);
  }
  // ---- セルの構築 ----
  /** 解決済み（上流・湖・下流の湖・矩形まで確定）のセル */
  cellAt(cx, cz) {
    const key = cx * 1048576 + cz;
    if (key === this.lastKey) return this.last;
    const cell = this.getCell(cx, cz);
    if (cell.rects === null) this.resolve(cell, cx, cz);
    this.lastKey = key;
    this.last = cell;
    return cell;
  }
  /** origin と noWater 高さだけ持つセル（キャッシュ付き） */
  getCell(cx, cz) {
    const key = cx * 1048576 + cz;
    let cell = this.cells.get(key);
    if (cell === void 0) {
      cell = new Cell();
      const rng = new SeededRandom(`${cx}${cz}${this.seed}riverCell`);
      cell.ox = cx * GRID2 + GRID2 / 2 + Math.floor(rng.next() * CENTER_OFFSET * 2 - CENTER_OFFSET);
      cell.oz = cz * GRID2 + GRID2 / 2 + Math.floor(rng.next() * CENTER_OFFSET * 2 - CENTER_OFFSET);
      this.biomes.blend(cell.ox, cell.oz);
      cell.h = this.terrain.noWater(this.biomes, cell.ox, cell.oz);
      this.cells.set(key, cell);
    }
    return cell;
  }
  /** 4 近傍のうち最大の下りを選ぶ（厳密大のみ更新）。走査順は (-1,0) (0,-1) (0,1) (1,0) */
  link(cell, cx, cz) {
    if (cell.linked) return;
    let maxDrop = -1;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (Math.abs(dx) + Math.abs(dz) !== 1) continue;
        const n = this.getCell(cx + dx, cz + dz);
        const drop = cell.h - n.h;
        if (drop > 0 && drop > maxDrop) {
          maxDrop = drop;
          cell.hasDown = true;
          cell.downCx = cx + dx;
          cell.downCz = cz + dz;
          cell.dox = n.ox;
          cell.doz = n.oz;
          cell.dh = n.h;
        }
      }
    }
    cell.linked = true;
  }
  /** 上流セルの一覧と合計流量。明示スタックで深い集水域でも再帰しない。 */
  fillUps(cell, cx, cz) {
    if (cell.ups !== null) return;
    const stack = [{
      cell,
      cx,
      cz,
      nextNeighbor: 0,
      found: [],
      total: 0,
      waitingFor: null
    }];
    const neighbors = [[-1, 0], [0, -1], [0, 1], [1, 0]];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (frame.waitingFor !== null) {
        const upstream = frame.waitingFor;
        frame.found.push(upstream.ox, upstream.oz, upstream.h, upstream.incoming);
        frame.total += upstream.incoming + SELF_FLUX;
        frame.waitingFor = null;
      }

      if (frame.nextNeighbor >= neighbors.length) {
        frame.cell.ups = Float64Array.from(frame.found);
        frame.cell.incoming = frame.total;
        stack.pop();
        continue;
      }

      const [dx, dz] = neighbors[frame.nextNeighbor++];
      const nx = frame.cx + dx;
      const nz = frame.cz + dz;
      const upstream = this.getCell(nx, nz);
      this.link(upstream, nx, nz);
      if (!upstream.hasDown || upstream.downCx !== frame.cx || upstream.downCz !== frame.cz) continue;

      if (upstream.ups === null) {
        frame.waitingFor = upstream;
        stack.push({
          cell: upstream,
          cx: nx,
          cz: nz,
          nextNeighbor: 0,
          found: [],
          total: 0,
          waitingFor: null
        });
      } else {
        frame.found.push(upstream.ox, upstream.oz, upstream.h, upstream.incoming);
        frame.total += upstream.incoming + SELF_FLUX;
      }
    }
  }
  fillLake(cell) {
    if (cell.hasDown || cell.lakeDone) return;
    cell.lakeDone = true;
    const total = cell.incoming + SELF_FLUX;
    if (total < LAKE_NO_FLUX_CUTOFF) return;
    cell.hasLake = true;
    const radius = LAKE_MIN_RADIUS + Math.ceil(total / LAKE_AT_FLUX * (LAKE_MAX_RADIUS - LAKE_MIN_RADIUS));
    cell.lakeR = radius;
    cell.lakeWater = Math.floor(cell.h - 7);
    cell.lakeBed = Math.floor(cell.lakeWater - (4 + radius * 0.35));
  }
  resolve(cell, cx, cz) {
    this.fillUps(cell, cx, cz);
    this.fillLake(cell);
    if (cell.hasDown && !cell.downResolved) {
      const d = this.getCell(cell.downCx, cell.downCz);
      this.fillUps(d, cell.downCx, cell.downCz);
      this.fillLake(d);
      cell.dHasLake = d.hasLake;
      cell.dLakeR = d.lakeR;
      cell.dLakeWater = d.lakeWater;
      cell.downResolved = true;
    }
    cell.rects = this.rejectEarly ? buildRects(cell) : NO_RECT;
  }
  // ---- 列ごとの計算（WaterBodyGenerator.getInfoNeededForWaterGen） ----
  compute(cell, x, z) {
    let minEdge = 1e4;
    let nearAlong = 0;
    let riverWidth = 0;
    let fluxRatio = 0;
    let fracNearest = 0;
    let originH = 0;
    let lakeOrDownH = 0;
    if (cell.hasDown) {
      closestOnSegment(x, z, cell.ox, cell.oz, cell.dox, cell.doz);
      nearAlong = Math.floor(segAlong);
      let flux = cell.incoming;
      flux += segFrac * SELF_FLUX;
      fluxRatio = Math.min(1, flux / RIVER_AT_FLUX);
      riverWidth = Math.max(1, Math.ceil(fluxRatio * RIVER_WIDTH));
      minEdge = nearAlong - riverWidth / 2;
      originH = cell.h + -3;
      if (cell.dHasLake) {
        lakeOrDownH = cell.dLakeWater;
        const into = segLength - cell.dLakeR;
        fracNearest = Math.min(1, segLength * segFrac / into);
      } else {
        lakeOrDownH = cell.dh + -3;
        fracNearest = segFrac;
      }
    }
    const ups = cell.ups;
    for (let i = 0; i < ups.length; i += 4) {
      closestOnSegment(x, z, ups[i], ups[i + 1], cell.ox, cell.oz);
      const along = Math.floor(segAlong);
      let flux = ups[i + 3];
      flux += segFrac * SELF_FLUX;
      const ratio = Math.min(1, flux / RIVER_AT_FLUX);
      const width = Math.max(1, Math.ceil(ratio * RIVER_WIDTH));
      const edge = along - width / 2;
      if (edge < minEdge) {
        minEdge = edge;
        nearAlong = along;
        fluxRatio = ratio;
        riverWidth = width;
        originH = ups[i + 2] + -3;
        if (cell.hasLake) {
          lakeOrDownH = cell.lakeWater;
          const into = segLength - cell.lakeR;
          fracNearest = Math.min(1, segLength * segFrac / into);
        } else {
          lakeOrDownH = cell.h + -3;
          fracNearest = segFrac;
        }
      }
    }
    if (minEdge === 1e4) return false;
    let distToLakeEdge = 1e4;
    let effectiveRadius = 0;
    const dxo = cell.ox - x;
    const dzo = cell.oz - z;
    const distOrigin = Math.sqrt(dxo * dxo + dzo * dzo);
    if (cell.hasLake) {
      let radiusNoise = this.lakeNoise(x, z);
      radiusNoise += LAKE_NOISE_AMPLITUDE;
      radiusNoise *= cell.lakeR / LAKE_MAX_RADIUS;
      effectiveRadius = cell.lakeR - radiusNoise;
      distToLakeEdge = distOrigin - effectiveRadius;
    }
    const interpolated = Math.floor(lakeOrDownH + (originH - lakeOrDownH) * (1 - fracNearest));
    if (minEdge < distToLakeEdge) {
      this.distance = nearAlong;
      this.radius = (riverWidth + WIDTH_OFFSET) / 2;
      this.waterHeight = interpolated;
      this.bedHeight = interpolated - (Math.ceil(fluxRatio * 10) + 2);
      this.isLake = false;
    } else {
      this.distance = distOrigin;
      this.radius = effectiveRadius;
      this.waterHeight = cell.lakeWater;
      this.bedHeight = cell.lakeBed;
      this.isLake = true;
    }
    return true;
  }
};
function inRects(rects, x, z) {
  for (let i = 0; i < rects.length; i += 4) {
    if (x >= rects[i] && x <= rects[i + 1] && z >= rects[i + 2] && z <= rects[i + 3]) return true;
  }
  return false;
}
function buildRects(cell) {
  const r = [];
  const seg = (ax, az, bx, bz) => {
    r.push(
      Math.min(ax, bx) - RIVER_REACH,
      Math.max(ax, bx) + RIVER_REACH,
      Math.min(az, bz) - RIVER_REACH,
      Math.max(az, bz) + RIVER_REACH
    );
  };
  if (cell.hasDown) seg(cell.ox, cell.oz, cell.dox, cell.doz);
  const ups = cell.ups;
  for (let i = 0; i < ups.length; i += 4) seg(ups[i], ups[i + 1], cell.ox, cell.oz);
  if (cell.hasLake) {
    const reach = cell.lakeR + 15 + 1;
    r.push(cell.ox - reach, cell.ox + reach, cell.oz - reach, cell.oz + reach);
  }
  return Float64Array.from(r);
}

function normalizeBounds(b) {
  if (
    b === null || b === void 0 ||
    b.min === null || b.min === void 0 || b.max === null || b.max === void 0 ||
    !Number.isFinite(b.min[0]) || !Number.isFinite(b.min[1]) ||
    !Number.isFinite(b.max[0]) || !Number.isFinite(b.max[1])
  ) {
    throw new Error("Invalid bounds: " + JSON.stringify(b));
  }
  const minX = Math.floor(b.min[0]);
  const minZ = Math.floor(b.min[1]);
  const sizeX = Math.floor(b.max[0]) - minX + 1;
  const sizeZ = Math.floor(b.max[1]) - minZ + 1;
  return sizeX > 0 && sizeZ > 0
    ? { minX, minZ, sizeX, sizeZ }
    : { minX, minZ, sizeX: 0, sizeZ: 0 };
}

let jobs = [];
let tickScheduled = false;

function scheduleTick() {
  if (tickScheduled) return;
  tickScheduled = true;
  setTimeout(handleTick, 0);
}

function handleTick() {
  tickScheduled = false;
  var deadline = Date.now() + TICK_CONFIG.executionBudgetMs;
  while (jobs.length > 0 && Date.now() < deadline) {
    var job = jobs.shift();
    var done = false;
    try {
      done = job();
    } catch (err) {
      job.reject(err);
      continue;
    }
    if (done) {
      job.resolve(job.value);
    } else {
      jobs.push(job);
    }
  }
  if (jobs.length > 0) scheduleTick();
}

function createWorld(options?): World{
  const seed = options !== void 0 && options.seed !== void 0 ? options.seed : api.getLobbyName();
  const biomes = new BiomeField(seed);
  const terrain = new TerrainNoise(seed);
  const column = new ColumnField(biomes, terrain, new WaterField(seed, biomes, terrain));
  const blocks = new TerrainBlocks(seed, biomes, column);

  function enqueue(job) {
    return new Promise(function (resolve, reject) {
      job.resolve = resolve;
      job.reject = reject;
      jobs.push(job);
      scheduleTick();
    });
  }

  function makeMapJob(bounds, makeOut, fillRange) {
    return function job() {
      if (job.state === void 0) {
        var b = normalizeBounds(bounds);
        job.state = {
          minX: b.minX, minZ: b.minZ, sizeX: b.sizeX, sizeZ: b.sizeZ,
          x: b.minX,
          z: b.minZ,
          i: 0,
          out: makeOut(b.sizeX * b.sizeZ)
        };
      }
      var s = job.state;
      if (s.sizeX === 0 || s.sizeZ === 0) {
        job.value = s.out;
        return true;
      }
      const endZ = Math.min(
        s.z + TICK_CONFIG.heightMapCellsPerStep,
        s.minZ + s.sizeZ,
      );
      s.i = fillRange(s.x, s.z, endZ, s.i, s.out, s);
      s.z = endZ;
      if (s.z >= s.minZ + s.sizeZ) {
        s.x++;
        s.z = s.minZ;
      }
      if (s.x >= s.minX + s.sizeX) {
        job.value = s.out;
        return true;
      }
      return false;
    };
  }

  return {
    getBiome(x, z) {
      return BIOME_NAMES[biomes.biomeId(Math.floor(x), Math.floor(z))];
    },
    getBiomeMap(bounds) {
      const { minX, minZ, sizeX, sizeZ } = normalizeBounds(bounds);
      const out = new Array(sizeX * sizeZ);
      let i = 0;
      for (let x = minX; x < minX + sizeX; x++) {
        for (let z = minZ; z < minZ + sizeZ; z++) {
          out[i++] = BIOME_NAMES[biomes.biomeId(x, z)];
        }
      }
      return out;
    },
    getHeight(x, z) {
      column.load(Math.floor(x), Math.floor(z));
      return column.ground;
    },
    getHeightMap(bounds) {
      const { minX, minZ, sizeX, sizeZ } = normalizeBounds(bounds);
      const out = new Int32Array(sizeX * sizeZ);
      let i = 0;
      for (let x = minX; x < minX + sizeX; x++) {
        for (let z = minZ; z < minZ + sizeZ; z++) {
          column.compute(x, z);
          out[i++] = column.ground;
        }
      }
      return out;
    },
    getColumn(x, z) {
      return blocks.columnAt(Math.floor(x), Math.floor(z));
    },
    getBlockId(pos) {
      return blocks.blockAt(Math.floor(pos[0]), Math.floor(pos[1]), Math.floor(pos[2]));
    },
    terrainBlocks: blocks,
    async: {
      getBiome: function (x, z) {
        return enqueue(function job() {
          job.value = BIOME_NAMES[biomes.biomeId(Math.floor(x), Math.floor(z))];
          return true;
        });
      },
      getBiomeMap: function (bounds) {
        return enqueue(makeMapJob(bounds, function (n) { return new Array(n); },
          function (x, startZ, endZ, i, out) {
            for (var z = startZ; z < endZ; z++) {
              out[i++] = BIOME_NAMES[biomes.biomeId(x, z)];
            }
            return i;
          }));
      },
      getHeight: function (x, z) {
        return enqueue(function job() {
          column.load(Math.floor(x), Math.floor(z));
          job.value = column.ground;
          return true;
        });
      },
      getHeightMap: function (bounds) {
        return enqueue(makeMapJob(bounds, function (n) { return new Int32Array(n); },
          function (x, startZ, endZ, i, out) {
            for (var z = startZ; z < endZ; z++) {
              column.compute(x, z);
              out[i++] = column.ground;
            }
            return i;
          }));
      },
      getColumn: function (x, z) {
        return enqueue(function job() {
          job.value = blocks.columnAt(Math.floor(x), Math.floor(z));
          return true;
        });
      },
      getBlockId: function (pos) {
        return enqueue(function job() {
          job.value = blocks.blockAt(Math.floor(pos[0]), Math.floor(pos[1]), Math.floor(pos[2]));
          return true;
        });
      }
    }
  };
}

export {
  createWorld,
  TerrainBlocks
};

export const handlers = { 
  tick: handleTick,
}