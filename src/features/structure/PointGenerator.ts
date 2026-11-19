
import type * as Types from "@bloxd";
import { DungeonEntrance } from "./dungeons/dungeonEntrance";
import { Dungeon } from "./Dungeon";
import { world } from "../../core/helpers/worldGenerator";
import { getWorldData } from "../../core/helpers/dbHelper";
import { SeededRandom } from "../../core/worldgen/world";
import { biomeNames } from "../../core/constance";
import { DungeonGenerator } from "./dungeonGenerator";
import type { Vec3 } from "../../core/types";

const DUNGEON_REGEN_INTERVAL = 7 * 24 * 60 * 60 * 1000;

export class PointGenerator {
  private readonly dungeons: Dungeon[] = [
    new DungeonEntrance(),
  ];

  private generating = false;

  private _toWorldXY(num: number): number {
    return Math.floor(num / 32) * 32;
  }

  private _findSuitablePoint(
    x: number,
    z: number,
    targetY: number
  ): Vec3 | null {
    const point: Vec3 = [
      this._toWorldXY(x),
      targetY,
      this._toWorldXY(z)
    ];

    const height = world.getHeight(point[0], point[2]);

    return Math.abs(height - targetY) <= 10 ? point : null;
  }

  private _generate(
    regionKey: string,
    dungeon: Dungeon,
    position: Vec3
  ): void {
    if (this.generating) return;

    this.generating = true;

    const generator = new DungeonGenerator(dungeon);

    generator.placeDungeon(regionKey, position)
      .then(() => {
        api.log(`Dungeon generated: ${dungeon.id} (${regionKey})`);
      })
      .catch((error: unknown) => {
        api.log(
          "aiueo", error instanceof Error ? error.message : String(error)
        );
      })
      .then(() => {
        this.generating = false;
      });
  }

  private _tryRegenerate(regionKey: string): boolean {
    const generatedChunks = getWorldData("generatedChunkKeys");
    const generated = generatedChunks?.[regionKey];

    if (!generated) return false;

    const elapsed = Date.now() - generated.timestamp;

    // 期限内なら何もしない
    if (elapsed < DUNGEON_REGEN_INTERVAL) return true;

    // 保存されたIDから同じDungeonを取得
    const dungeon = this.dungeons.find(
      d => d.id === generated.dungeonId
    );

    if (!dungeon) {
      api.log(`Unknown dungeon ID: ${generated.dungeonId}`);
      return true;
    }

    // 保存された座標に同じDungeonを再配置
    this._generate(regionKey, dungeon, generated.position);

    return true;
  }

  private _generateNew(regionKey: string): void {
    const rng = new SeededRandom(regionKey);

    const [regionX, regionZ] = regionKey.split("|").map(Number);
    if(regionX === undefined || regionZ === undefined) return;

    const regionOriginX = regionX * 512;
    const regionOriginZ = regionZ * 512;

    const x = regionOriginX + Math.floor(rng.next() * 512);
    const z = regionOriginZ + Math.floor(rng.next() * 512);

    // バイオームチェック
    const biome = world.getBiome(x, z);

    const placeable = this.dungeons.filter(
      dungeon =>
        (dungeon.biomes.length === 0
          ? biomeNames
          : dungeon.biomes
        ).includes(biome)
    );

    const weightSum = placeable.reduce(
      (sum, dungeon) => sum + dungeon.weight,
      0
    );

    if (weightSum <= 0) return;

    // 重み付き抽選
    let total = 0;
    const random = Math.random() * weightSum;

    let chosenDungeon: Dungeon | undefined;

    for (const dungeon of placeable) {
      total += dungeon.weight;

      if (random < total) {
        chosenDungeon = dungeon;
        break;
      }
    }

    if (!chosenDungeon) return;

    const point = this._findSuitablePoint(
      x,
      z,
      chosenDungeon.y
    );

    if (!point) return;

    this._generate(regionKey, chosenDungeon, point);
  }

  onPlayerRequestChunk(
    playerId: Types.PlayerId,
    chunkX: number,
    chunkY: number,
    chunkZ: number,
    chunkId: string
  ): void {
    const regionX = Math.floor(chunkX / 16);
    const regionZ = Math.floor(chunkZ / 16);

    const regionKey = `${regionX}|${regionZ}`;

    // 既存データがあれば再生成判定
    if (this._tryRegenerate(regionKey)) return;

    // 初回生成
    this._generateNew(regionKey);
  }
}
