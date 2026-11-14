
import type { Vec3 } from "../../core/types";
import { SeededRandom } from "../../core/worldgen/world";
import { lootChestGenerators } from "./LootChestContents";
import { EnchantmentGenerator } from "./LootChestGenerator";
import { Rarity, type Seed } from "./types";

export interface LootChestGenerationOptions {
  seed?: Seed;
  pos: Vec3;
  quality: Rarity;
}

export function getLootChestContents({ seed = api.getLobbyName(), pos, quality }: LootChestGenerationOptions) {
  const [x, y, z] = pos;
  const generator = lootChestGenerators[quality];
  if (!generator) throw new RangeError("Unknown loot chest quality: " + quality);
  const enchantmentGenerator = new EnchantmentGenerator();
  const random = new SeededRandom(String(seed) + "|" + x + "|" + y + "|" + z + "|lootChest");
  return generator.sample(random, enchantmentGenerator);
}
