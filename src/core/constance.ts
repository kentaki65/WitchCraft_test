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
] as const;

export const biomeJapaneseNames = [
  "ジャングル",
  "砂漠",
  "凍土の荒野平原",
  "サボテン砂漠",
  "赤砂漠",
  "平原",
  "メープル平原",
  "大草原",
  "雪原",
  "森林",
  "桜の森",
  "梨の森",
  "紅葉の森",
  "カボチャの森",
  "凍土の荒野森林",
  "松林",
  "雪の松林",
  "なだらかな丘陵",
  "雪山",
  "蒼き森林"
] as const;

export const biomeNameMap: Record<Biome, string> = {
  Jungle: "ジャングル",
  Desert: "砂漠",
  FrozenBadlandsPlains: "凍土の荒野平原",
  CactusDesert: "サボテン砂漠",
  RedDesert: "赤砂漠",
  Plains: "平原",
  MaplePlains: "メープル平原",
  TallGrassPlains: "大草原",
  SnowyPlains: "雪原",
  Forest: "森林",
  CherryForest: "桜の森",
  PearForest: "梨の森",
  AutumnForest: "紅葉の森",
  PumpkinForest: "カボチャの森",
  FrozenBadlandsForest: "凍土の荒野森林",
  PineForest: "松林",
  SnowyPineForest: "雪の松林",
  RollingHills: "なだらかな丘陵",
  SnowyMountains: "雪山",
  BlueForest: "蒼き森林",
};

export const TICK_CONFIG = {
  executionBudgetMs: 20,
  preparationItemsPerTick: 256,
  terrainBlocksPerTick: 256,
  terrainRectanglesPerTick: 256,
  heightMapCellsPerStep: 256,
} as const;