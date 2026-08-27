import { MobDatas } from "src/core/types";
import type * as Types from "@bloxd";

export const mobDatas: Record<string, MobDatas> = {
  "1UP": {
    name: "1UP",
    description: "Revives once upon death."
  },
  "Berserk": {
    name: "Berserk",
    description: "Increases power when injured."
  },
  "Blastoff": {
    name: "Blastoff",
    description: "Launches into the air suddenly."
  },
  "Bulwark": {
    name: "Bulwark",
    description: "Greatly resists knockback."
  },
  "Ender": {
    name: "Ender",
    description: "Teleports to evade attacks."
  },
  "Exhaust": {
    name: "Exhaust",
    description: "Slows down enemies."
  },
  "Ghastly": {
    name: "Ghastly",
    description: "Shoots explosive fireballs.",
    mobSettings: {
      heldItemName: "Fireball",
      attackItemName: "Fireball",
      attackInterval: 10000
    },
  },
  "Lifesteal": {
    name: "Lifesteal",
    description: "Heals when dealing damage."
  },
  "Poisonous": {
    name: "Poisonous",
    description: "Applies poison on hit.",
    mobSettings: {
      attackEffectName: "Poisoned",
      attackEffectDuration: 10000
    },
  },
  "Quicksand": {
    name: "Quicksand",
    description: "Slows down nearby targets.",
    mobSettings: {
      attackEffectName: "Slowness",
      attackEffectDuration: 10000
    },
  },
  "Sprint": {
    name: "Sprint",
    description: "Briefly moves at high speed.",
    mobSettings: {
      baseRunningSpeed: 6.0
    },
  },
  "Sticky": {
    name: "Sticky",
    description: "Can disarm the target."
  },
  "Vengeance": {
    name: "Vengeance",
    description: "Reflects part of taken damage."
  },
  "Weakness": {
    name: "Weakness",
    description: "Reduces enemy attack power.",
    mobSettings: {
      attackEffectName: "Weakness",
      attackEffectDuration: 10000
    },
  },
  "Webber": {
    name: "Webber",
    description: "Traps foes in webs."
  },
  "Drain": {
    name: "Drain",
    description: "Replace 'good' with 'bad'"
  },
  "Gravity": {
    name: "Gravity",
    description: "increase gravity",
  },
}

export const baseSettings: Partial<Record<Types.MobSetting, unknown>> = {
  maxHealth: 500,
  initialHealth: 75,
  onDeathItemDrops: [{
    itemName: "Diamond",
    probabilityOfDrop: 1,
    dropMinAmount: 1,
    dropMaxAmount: 10
  },
  {
    itemName: "Moonstone",
    probabilityOfDrop: 1,
    dropMinAmount: 1,
    dropMaxAmount: 10
  },
  ],
  onDeathAura: 1000,
}