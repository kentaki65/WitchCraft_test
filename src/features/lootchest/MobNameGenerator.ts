import type { SeededRandom } from "../../core/worldgen/world";
import type { ItemAttributes } from "./types";

const mobNamePrefixes = ["Powerful", "Legendary", "Majestic", "Fearless", "Celestial", "Mythic", "Epic", "Ethereal", "Omniscient", "Omnipotent", "Arcane", "Enigmatic", "Formidable", "Indomitable", "Luminous", "Ferocious", "Astral", "Unyielding", "Celestine", "Ascendant", "Otherworldly", "Runic", "Fabled", "Primordial", "Cosmic", "Enkindled"];

export class MobNameGenerator {
  constructor(private readonly mobType: string) { }
  sample(random: SeededRandom): ItemAttributes {
    const name = mobNamePrefixes[Math.floor(random.next() * mobNamePrefixes.length)] + " " + this.mobType;
    return { customDisplayName: name, customAttributes: { mobSettings: { name } } };
  }
}