import { randomNumber, randomPicks } from "../../utils/math";
import { mobDatas, baseSettings } from "./data";
import type * as Types from "@bloxd";

const EXCLUDE_NAMES = ["Pig", "Cow", "Sheep", "Wildcat", "Bear", "Wolf", "Deer", "Stag", "Gorilla", "Horse"];
let prevSpawnedId: Types.MobHerdId | null = null;

function applyMobsettings(mobId: Types.MobId, settings: [Types.MobSetting, any][]): void {
  for (const [key, value] of settings) {
    try {
      api.setMobSetting(mobId, key, value);
    } catch (e: unknown) {
      api.log(`couldn't set ${key}`);
    }
  }
}


export function handleSpawning(
  mobId: Types.MobId,
  mobType: Types.MobType,
  x: number,
  y: number,
  z: number,
  mobHerdId: Types.MobHerdId
): void {
  if (EXCLUDE_NAMES.includes(mobType)) return;

  if (prevSpawnedId !== undefined && mobHerdId === prevSpawnedId) return;
  prevSpawnedId = mobHerdId;

  const base = Object.entries(baseSettings) as [
    Types.MobSetting,
    (typeof baseSettings)[keyof typeof baseSettings]
  ][];

  const keys = Object.keys(mobDatas);
  const abilityList = randomPicks(keys, randomNumber(1, 5));

  let meta = api.getMobSetting(mobId, "metaInfo") || "";

  for (const ability of abilityList) {
    if (!meta.includes(ability)) {
      meta += "/" + ability;
    }
  }

  api.setMobSetting(mobId, "metaInfo", meta);
  applyMobsettings(mobId, base);

  for (const ability of abilityList) {
    const abilityData = mobDatas[ability];
    if (!abilityData) continue;

    const abilitySettings = abilityData.mobSettings
      ? Object.entries(abilityData.mobSettings) as [
        Types.MobSetting,
        (typeof abilityData.mobSettings)[keyof typeof abilityData.mobSettings]
      ][]
      : [];

    applyMobsettings(mobId, abilitySettings);
  }

  if (!meta.includes("initHealth")) {
    try {
      api.setHealth(mobId, 500, undefined, true);
      api.setMobSetting(mobId, "attackDamage", 24);
      meta += "/initHealth";
      api.setMobSetting(mobId, "metaInfo", meta);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      api.log("initHealth failed:" + message);
    }
  }

  const abilityText = abilityList.join(", ");
  const firstAbility = abilityList[0];
  const firstAbilityData = firstAbility !== undefined
    ? mobDatas[firstAbility]
    : undefined;

  api.setMobSetting(mobId, "name", mobType);
  api.setTargetedPlayerSettingForEveryone(mobId, "nameTagInfo", {
    content: [
      {
        str: `[${abilityText}]`,
        style: {
          color: "#15779eff",
          fontWeight: "bold",
          fontSize: "40px"
        }
      },
      { str: mobType }
    ],
    subtitle: [
      { str: firstAbilityData?.description ?? "" }
    ],
    backgroundColor: "transparent"
  });
}
