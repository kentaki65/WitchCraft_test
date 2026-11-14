import type { EnchantmentTier, FrequenciesItems, ItemAttributes } from "./types";
import { MobNameGenerator } from "./MobNameGenerator";
import type { SeededRandom } from "../../core/worldgen/world";

class RandomIntRange {
  constructor(private readonly min: number, private readonly max: number) {
    if (!Number.isInteger(min) || !Number.isInteger(max)) throw new Error("Min and Max must be integers, but Min=" + min + ", Max=" + max);
  }
  sample(random: SeededRandom): number { return Math.floor(this.min + random.next() * (this.max - this.min)); }
}

class Probability {
  constructor(private readonly probability: number) { }
  sample(random: SeededRandom): boolean { return random.next() < this.probability; }
}

class WeightedDistribution<T> {
  private readonly distribution: { cumulativeProbability: number; value: T }[];
  constructor(items: { weight: number; value: T }[]) {
    if (items.length === 0) throw new Error("Distribution must have at least one item");
    const values = new Set<T>();
    let totalWeight = 0;
    for (const item of items) {
      if (values.has(item.value)) throw new Error("Values in a weighted distribution must be unique");
      values.add(item.value);
      if (item.weight <= 0) throw new Error("Weights must be positive");
      totalWeight += item.weight;
    }
    let cumulativeProbability = 0;
    this.distribution = items.map(({ weight, value }) => {
      cumulativeProbability += weight / totalWeight;
      return { cumulativeProbability, value };
    });
  }
  sample(random: SeededRandom): T {
    const value = random.next();
    for (const item of this.distribution) if (value < item.cumulativeProbability) return item.value;
    return this.distribution[this.distribution.length - 1]!.value;
  }
}

const enchantableItemNames: Record<string, string[]> = {
  Sword: ["Damage", "Attack Speed", "Critical Damage"], Spear: ["Damage", "Attack Speed", "Critical Damage"],
  Dagger: ["Damage", "Attack Speed", "Critical Damage"], Mace: ["Damage", "Attack Speed", "Critical Damage"],
  Whip: ["Damage", "Attack Speed", "Critical Damage"], Helmet: ["Protection", "Health", "Health Regen"],
  Chestplate: ["Protection", "Health", "Health Regen"], Leggings: ["Protection", "Health", "Health Regen"],
  Boots: ["Protection", "Health", "Health Regen"], Gauntlets: ["Protection", "Health", "Health Regen"],
  Bow: ["Arrow Speed", "Arrow Damage", "Quick Charge"], Crossbow: ["Arrow Speed", "Arrow Damage", "Quick Charge"],
  Pickaxe: ["Break Speed", "Momentum", "Mining Yield", "Mining Aura"], Spade: ["Break Speed", "Momentum", "Digging Aura"],
  Axe: ["Break Speed", "Momentum", "Lumber Aura"], Hoe: ["Break Speed", "Momentum", "Farming Yield", "Farming Aura"],
  "Knight Sword": ["Damage", "Attack Speed", "Critical Damage", "Horizontal Knockback"],
  "Moonstone Pickaxe": ["Break Speed", "Momentum"], Stick: ["Horizontal Knockback", "Vertical Knockback", "Damage"],
  "Fur Chestplate": ["Protection", "Health", "Health Regen", "Knockback Resist"],
  "Spiked Boots": ["Protection", "Health", "Health Regen", "Stomp Damage"]
};

const tierLevel: Record<EnchantmentTier, number> = { "Tier 1": 1, "Tier 2": 2, "Tier 3": 3, "Tier 4": 4, "Tier 5": 5 };

export class EnchantmentGenerator {
  private readonly suffixMapping: Record<string, string>;
  constructor() {
    this.suffixMapping = new Proxy({}, {
      get(_, prop) {
        if (typeof prop !== "string") return undefined;

        const itemData = api.getInitialItemMetadata(prop);
        if (!itemData) return undefined;

        const itemName = itemData.name;

        if (itemName) {
          return enchantableItemNames[itemName]
            ? itemName
            : itemName.split(" ").at(-1)!;
        }

        return undefined;
      }
    });
  }

  getPossibleEnchantmentsForItem(itemId: string): string[] { return enchantableItemNames[this.suffixMapping[itemId]!] ?? []; }
  chooseRandomEnchantmentAttributes(random: SeededRandom, enchantmentTier: EnchantmentTier, enchantments: string[]) {
    const availableEnchantments = [...enchantments];
    const result: { enchantments: Record<string, number>; enchantmentTier: EnchantmentTier; id: string } = {
      enchantments: {}, enchantmentTier, id: generateRandomId()
    };
    for (let i = 0; i < tierLevel[enchantmentTier]; i++) {
      if (availableEnchantments.length === 0) break;
      const enchantment = availableEnchantments[Math.floor(random.next() * availableEnchantments.length)]!;
      result.enchantments[enchantment] = (result.enchantments[enchantment] ?? 0) + 1;
      if (result.enchantments[enchantment] >= 3) availableEnchantments.splice(availableEnchantments.indexOf(enchantment), 1);
    }
    return result;
  }
}

function generateRandomId(length = 21): string {
  return Array.from({ length }, () => {
    const value = Math.floor(Math.random() * 256) & 63;

    return value < 36
      ? value.toString(36)
      : value < 62
        ? (value - 26).toString(36).toUpperCase()
        : value > 62 ? "-" : "_";
  }).join("");
}

export class LootChestGenerator {
  private readonly itemCategoryDistributions: {
    numItemsDistribution: RandomIntRange;
    itemDistribution: WeightedDistribution<{ name: string; amountDistribution: RandomIntRange | null; attributesDistribution: MobNameGenerator | null }>;
  }[];
  private readonly shouldEnchantDistribution: Probability;
  private readonly enchantmentTier: EnchantmentTier;
  private enchantmentGenerator: EnchantmentGenerator | null = null;
  constructor(metadata: { itemCategories: { minItems: number; maxItems: number; items: FrequenciesItems[] }[]; enchantmentProbability: number; enchantmentTier: EnchantmentTier }) {
    this.itemCategoryDistributions = [];
    this.shouldEnchantDistribution = new Probability(metadata.enchantmentProbability);
    this.enchantmentTier = metadata.enchantmentTier;
    for (const category of metadata.itemCategories) {
      const numItemsDistribution = new RandomIntRange(category.minItems, category.maxItems + 1);
      const items = category.items.map(item => ({
        weight: item.frequency,
        value: {
          name: item.name,
          amountDistribution: item.amount ? new RandomIntRange(item.amount.min, item.amount.max + 1) : null,
          attributesDistribution: item.itemAttributesDistribution ?? null
        }
      }));
      this.itemCategoryDistributions.push({ numItemsDistribution, itemDistribution: new WeightedDistribution(items) });
    }
  }
  sample(random: SeededRandom, enchantmentGenerator: EnchantmentGenerator) {
    this.enchantmentGenerator = enchantmentGenerator;
    const items: (null | { name: string; amount: number | null; attributes: ItemAttributes })[] = Array(36).fill(null);
    let itemIndex = 0;
    for (const category of this.itemCategoryDistributions) {
      const numItems = category.numItemsDistribution.sample(random);
      for (let i = 0; i < numItems; i++, itemIndex++) {
        const item = category.itemDistribution.sample(random);
        const attributes = item.attributesDistribution?.sample(random) ?? {};
        const enchantmentAttributes = this.getEnchantmentAttributesForItem(random, item.name) ?? {};
        items[itemIndex] = {
          name: item.name,
          amount: item.amountDistribution?.sample(random) ?? null,
          attributes: { ...attributes, customAttributes: { ...(attributes.customAttributes ?? {}), ...enchantmentAttributes } }
        };
      }
    }
    for (let i = 0; i < items.length; i++) {
      const j = i + Math.floor(random.next() * (items.length - i));
      [items[i], items[j]] = [items[j]!, items[i]!];
    }
    return items;
  }
  private getEnchantmentAttributesForItem(random: SeededRandom, itemName: string) {
    if (!this.shouldEnchantDistribution.sample(random)) return null;
    const enchantments = this.enchantmentGenerator!.getPossibleEnchantmentsForItem(itemName);
    if (enchantments.length === 0) return null;
    return this.enchantmentGenerator!.chooseRandomEnchantmentAttributes(random, this.enchantmentTier, enchantments);
  }
}
