export const biomeNames = [
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
  preparationItemsPerTick: 512,
  terrainBlocksPerTick: 1024,
  terrainRectanglesPerTick: 64,
  heightMapCellsPerStep: 256,
} as const;