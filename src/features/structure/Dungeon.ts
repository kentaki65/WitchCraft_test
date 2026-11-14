
import type { SchematicPath, Vec3 } from "../../core/types";
import type { Biome } from "../../core/worldgen/types";
import { type ItemAttributes } from "../lootchest/types";

interface DungeonConfig {
  source: DungeonSource,
  y: number;
  biomes: Biome[];
  weight: number;
  minDistance: number;
  onPlaced: (origin: Vec3) => void
}

type CustomAttributes = ItemAttributes & { [key: string]: unknown };

interface ChestCustomContents {
  //相対座標
  position: Vec3;

  //slot, itemname
  overrides: Record<number, {
    itemName: string,
    customDisplayName: string;
    customDescription: string;
    customAttributes: CustomAttributes;
  }>[];
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

  public chestPositions: ChestCustomContents[] | undefined;
  public spawnerPositions: Vec3[] | undefined;

  readonly onPlaced: (origin: Vec3) => void;

  constructor(config: DungeonConfig) {
    if (config.y % 32 !== 0) {
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