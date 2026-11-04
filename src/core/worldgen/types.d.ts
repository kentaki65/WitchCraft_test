
export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export type Bounds2D = {
  min: Vec2;
  max: Vec2;
};

export type Biome =
  | "Jungle"
  | "Desert"
  | "FrozenBadlandsPlains"
  | "CactusDesert"
  | "RedDesert"
  | "Plains"
  | "MaplePlains"
  | "TallGrassPlains"
  | "SnowyPlains"
  | "Forest"
  | "CherryForest"
  | "PearForest"
  | "AutumnForest"
  | "PumpkinForest"
  | "FrozenBadlandsForest"
  | "PineForest"
  | "SnowyPineForest"
  | "RollingHills"
  | "SnowyMountains"
  | "BlueForest";

export interface World {
  /**
   * 指定位置のブロック ID を返します
   * 洞窟・鉱石・植生・構造物・装飾は生成対象外です
   * @param pos ブロック座標 [x, y, z]
   * @returns ブロック ID
   */
  getBlockId(pos: Vec3): number;

  /**
   * 指定位置の地表の高さを返します（水面を除く）
   * @param x X 座標
   * @param z Z 座標
   * @returns 地表の Y 座標
   */
  getHeight(x: number, z: number): number;

  /**
   * 指定位置のバイオーム名を返します
   * @param x X 座標
   * @param z Z 座標
   * @returns バイオーム名
   */
  getBiome(x: number, z: number): Biome;

  /**
   * 矩形範囲の地表の高さを一括取得します
   * @param bounds [x, z] の最小・最大座標（両端を含む）
   * @returns 高さの配列 index = (x - minX) * sizeZ + (z - minZ)
   */
  getHeightMap(bounds: Bounds2D): Int32Array;

  /**
   * 矩形範囲のバイオームを一括取得します
   * 範囲・並び順は getHeightMap と同じです
   * @param bounds [x, z] の最小・最大座標（両端を含む）
   * @returns バイオーム名の配列
   */
  getBiomeMap(bounds: Bounds2D): Biome[];
}

/**
 * 指定シードのワールドを作成します
 * @param options.seed ワールドのシード。省略時は api.getLobbyName() を使用します
 * @returns 独立した状態を持つ World インスタンス
 */
export declare function createWorld(options?: { seed?: string }): World;