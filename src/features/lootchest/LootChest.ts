import { SeededRandom } from "src/core/worldgen/world";
import { Vec3 } from "src/core/types";
import { lootChestGenerators } from "./LootChestContents";
import { EnchantmentGenerator } from "./LootChestGenerator";
import { Rarity, Seed } from "./types";

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
