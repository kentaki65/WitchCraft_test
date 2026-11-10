import { MobNameGenerator } from "./MobNameGenerator";

export type Seed = number | string;
export type Rarity = 0 | 1 | 2 | 3 | 4;
export type EnchantmentTier = "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4" | "Tier 5";

export interface ItemAttributes {
  customDisplayName?: string;
  customAttributes?: {
    mobSettings?: {
      name: string
    };
    [key: string]: unknown
  }
};

export const Rarity = { 
  COMMON: 0, 
  UNCOMMON: 1, 
  RARE: 2, 
  EPIC: 3, 
  LEGENDARY: 4 
} as const;

export const MaterialTier = { 
  WOOD: "Wood", 
  STONE: "Stone", 
  IRON: "Iron", 
  GOLD: "Gold", 
  DIAMOND: "Diamond" 
} as const;

export interface FrequenciesItems {
  name: string;
  frequency: number;
  amount?: {
    min: number;
    max: number
  } | null;
  itemAttributesDistribution?: MobNameGenerator
};

export type MaterialTier = typeof MaterialTier[keyof typeof MaterialTier];