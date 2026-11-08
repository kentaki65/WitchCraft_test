import { SchematicPath, Vec3 } from "src/core/types";
import { Biome } from "src/core/worldgen/types";

interface DungeonConfig {
  source: DungeonSource,
  y: number;
  biomes: Biome[];
  weight: number;
  minDistance: number;
  onPlaced: (origin: Vec3) => void
}

export type DungeonSource =
  | {
      type: "schematic";
      path: SchematicPath;
    }
  | {
      type: "copy";
      size: Vec3;
      origin: Vec3;
    };

export class Dungeon {
  readonly source: DungeonSource;

  readonly y: number;
  readonly biomes: Biome[];
  readonly weight: number;
  readonly minDistance: number;

  public chestPositions: Vec3[] | undefined;
  public spawnerPositions: Vec3[] | undefined;

  readonly onPlaced: (origin: Vec3) => void;
  
  constructor(config: DungeonConfig){
    if(config.y % 32 !== 0){
      throw new Error("Dungeon Y must be a multiple of 32")
    }
    this.source = config.source;
    this.y = config.y;
    this.biomes = config.biomes;
    this.weight = config.weight;
    this.minDistance = config.minDistance;
    this.onPlaced = config.onPlaced;
  }
}