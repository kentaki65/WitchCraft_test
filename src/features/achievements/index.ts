import { getPlayerData, setPlayerData } from "../../core/api/dbHelper";
import { achievementData } from "./data";
import type { AchievementKeys, AchievementSlot, ReachedBiomes, Vec3 } from "../../core/types";
import type * as Types from "@bloxd";
import { progressChecker } from "./achv";
import { getDistance } from "../../utils/math";
import { world } from "../../core/api/worldGenerator";
import type { Biome } from "../../core/worldgen/types";


const prevPlayerMovedMap = new Map<Types.PlayerId, Vec3>();

function isAchievementKey(key: string): key is AchievementKeys {
  return key in achievementData;
}

function onPlayerJoin(playerId: Types.PlayerId) {
  const data = getPlayerData(playerId, "achievement");
  if (data === undefined) {
    const initialData: AchievementSlot = {
      unlockedAchievements: [],
      claimedAchievements: [],
    }
    const initialReachedBiome: ReachedBiomes = [];
    setPlayerData(playerId, "achievement", initialData);
    setPlayerData(playerId, "reachedBiomes", initialReachedBiome);
  }
  progressChecker(playerId, "Hello_Bloxd");
}

function onBlockStandStart(playerId: Types.PlayerId, x: number, y: number, z: number, blockName: string) {
  const threshold = 10;

  const pos = api.getPosition(playerId);
  const prevPos = prevPlayerMovedMap.get(playerId);

  if (prevPos === undefined) {
    prevPlayerMovedMap.set(playerId, pos);
    return;
  }

  const distance = getDistance(pos, prevPos);

  if (distance > threshold) {
    const reachedBiomes = getPlayerData(playerId, "reachedBiomes");
    const biome = world.getBiome(pos[0], pos[2]) as Biome;

    if (!reachedBiomes?.includes(biome)) {
      setPlayerData(playerId, "reachedBiomes", [...reachedBiomes ?? [], biome]);
      prevPlayerMovedMap.set(playerId, pos);
      return
    };

    //命名規則として Biome + "_achv"でいこう
    progressChecker(playerId, `${biome}_achv`);
    prevPlayerMovedMap.set(playerId, pos);
  }
}

function onPlayerBoughtShopItem(playerId: Types.PlayerId, categoryKey: Types.ShopCategoryKey, itemKey: Types.ShopItemKey) {
  if (!isAchievementKey(itemKey)) return;

  const data = getPlayerData(playerId, "achievement");
  if (!data) return;

  const slot = data.claimedAchievements;
  if (slot.includes(itemKey)) return;

  slot.push(itemKey);
  setPlayerData(playerId, "achievement", data);

  api.updateShopItemForPlayer(playerId, categoryKey, itemKey, {
    buyButtonText: "受け取り済み",
    canBuy: false,
  });
};

export const handlers = {
  onPlayerJoin,
  onBlockStandStart,
  onPlayerBoughtShopItem
}