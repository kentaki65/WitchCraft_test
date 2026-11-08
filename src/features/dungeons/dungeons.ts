import { SchematicName, Vec3 } from "src/core/types";
import { Biome } from "src/core/worldgen/types";

interface DungeonConfig {
  source: DungeonSource,
  y: number;
  biomes: Biome[];
  weight: number;
  minDistance: number;
}

type DungeonSource =
  | {
      type: "schematic";
      path: string;
    }
  | {
      type: "copy";
      origin: Vec3;
    };

export class Dungeon {
  readonly source: DungeonSource;

  readonly y: number;
  readonly biomes: Biome[];
  readonly weight: number;
  readonly minDistance: number;

  constructor(config: DungeonConfig){
    if(config.y % 32 !== 0){
      throw new Error("Dungeon Y must be a multiple of 32")
    }
    this.source = config.source;
    this.y = config.y;
    this.biomes = config.biomes;
    this.weight = config.weight;
    this.minDistance = config.minDistance;
  }
}