import type * as Types from "@bloxd";
import { world } from "src/core/managers/worldGenerator";
import { DungeonEntrance } from "./dungeons/dungeonEntrance";
import { Dungeon } from "./Dungeon";
import { SeededRandom } from "src/core/worldgen/world";
import { DungeonGenerator } from "./dungeonGenerator";
import { getWorldData } from "src/core/api/dbHelper";

export class PointGenerator {
  private readonly dungeons: Dungeon[] = [
    new DungeonEntrance(),
  ];

  isGenerated(regionKey: string): boolean{
    const generatedChunks = getWorldData("generatedChunkKeys");
    if (!generatedChunks) return false;

    return generatedChunks.includes(regionKey);
  }

  onPlayerRequestChunk(playerId: Types.PlayerId, chunkX: number, chunkY: number, chunkZ: number, chunkId: string) {
    //512ごとに分割する
    const regionX = Math.floor(chunkX / 16);
    const regionZ = Math.floor(chunkZ / 16);
    const regionKey = `${regionX}|${regionZ}`;

    if(this.isGenerated(regionKey)) return;
    
    const rng = new SeededRandom(regionKey);
    const regionOriginX = regionX * 512;
    const regionOriginZ = regionZ * 512;

    const x = regionOriginX + Math.floor(rng.next() * 512);
    const z = regionOriginZ + Math.floor(rng.next() * 512);

    //バイオームチェック
    const biome = world.getBiome(x, z);
    const placeable = this.dungeons.filter(
      n => n.biomes.includes(biome)
    );

    const weightSum = placeable.reduce((prev, curr) => {
      return prev + curr.weight
    }, 0);

    if (weightSum === 0) {
      throw new Error("The weightSum must be non-zero");
    };

    let total = 0;
    let chosenDungeon: Dungeon | null = null;
    const random = Math.random() * weightSum;

    for (const dungeon of placeable) {
      const { weight } = dungeon;
      total += weight;

      if (random <= total) {
        chosenDungeon = dungeon;
        break;
      }
    }

    if (chosenDungeon) {
      const generator = new DungeonGenerator(chosenDungeon);
      generator.placeDungeon(regionKey, [x, chosenDungeon.y, z]);
    }
  }
}