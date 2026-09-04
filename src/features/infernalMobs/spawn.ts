import { randomNumber, randomPicks } from "../../utils/math";
import { mobDatas, baseSettings } from "./data";
import type * as Types from "@bloxd";

const EXCLUDE_NAMES = ["Pig", "Cow", "Sheep", "Wildcat", "Bear", "Wolf", "Deer", "Stag", "Gorilla", "Horse"];
let prevSpawnedId: Types.MobHerdId | null = null;

function applyMobsettings(mobId: Types.MobId, settings: [Types.MobSetting, any][]): void{
  for(const [key, value] of settings){
    try{
      api.setMobSetting(mobId, key, value);
    }catch(e: unknown){
      api.log(`couldn't set ${key}`);
    }
  } 
}

export function handleSpawning(mobId: Types.MobId, mobType: Types.MobType, x: number, y: number, z: number, mobHerdId: Types.MobHerdId){
  if (EXCLUDE_NAMES.includes(mobType)) return;
  if(prevSpawnedId && mobHerdId === prevSpawnedId) return;
  prevSpawnedId = mobHerdId;

  const base = Object.entries(baseSettings) as [Types.MobSetting, any][];
  const keys = Object.keys(mobDatas);

  const abilityList = randomPicks(keys, randomNumber(1, 5));

  let meta = api.getMobSetting(mobId, "metaInfo") || "";

  for (const ab of abilityList) {
    if (!meta.includes(ab)) meta += "/" + ab
  };

  api.setMobSetting(mobId, "metaInfo", meta);
  applyMobsettings(mobId, base);

  for (const ab of abilityList) {
    const abSettings = mobDatas[ab].mobSettings 
      ? Object.entries(mobDatas[ab].mobSettings) as [Types.MobSetting, any][]
      : [];

    applyMobsettings(mobId, abSettings);
  }

  if (!meta.includes("initHealth")) {
    try {
      api.setHealth(mobId, 500, undefined, true);
      api.setMobSetting(mobId, "attackDamage", 24);
      api.setMobSetting(mobId, "metaInfo", meta + "/initHealth");
    } catch (e) { api.log("initHealth failed:" + e.message); }
  }

  const abilityText = abilityList.join(", ");
  const abilityDisplay = `[${abilityText}]`;

  api.setMobSetting(mobId, "name", mobType);
  api.setTargetedPlayerSettingForEveryone(mobId, "nameTagInfo", {
    content: [
      { str: abilityDisplay, style: { color: "#15779eff", fontWeight: "bold", fontSize: "40px" } },
      { str: mobType }
    ],
    subtitle: [
      { str: mobDatas[abilityList[0]]?.description || "" }
    ],
    backgroundColor: "transparent",
  });
};