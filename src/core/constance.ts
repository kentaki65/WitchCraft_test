import type { Biome } from "./worldgen/types";

export const biomeNames: Biome[] = [
  "Jungle",
  "Desert",
  "FrozenBadlandsPlains",
  "CactusDesert",
  "RedDesert",
  "Plains",
  "MaplePlains",
  "TallGrassPlains",
  "SnowyPlains",
  "Forest",
  "CherryForest",
  "PearForest",
  "AutumnForest",
  "PumpkinForest",
  "FrozenBadlandsForest",
  "PineForest",
  "SnowyPineForest",
  "RollingHills",
  "SnowyMountains",
  "BlueForest"
];

export const TICK_CONFIG = {
  executionBudgetMs: 20,
  preparationItemsPerTick: 256,
  terrainBlocksPerTick: 256,
  terrainRectanglesPerTick: 256,
  heightMapCellsPerStep: 256,
} as const;