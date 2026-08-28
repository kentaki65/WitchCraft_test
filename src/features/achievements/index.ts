import { getData, setData } from "../../core/api/dbHelper";
import { achievementData } from "./data";
import { AchievementKeys, AchievementSlot } from "../../core/types";
import type * as Types from "@bloxd";
import { progressChecker } from "./achv";

function isAchievementKey(key: string): key is AchievementKeys {
  return key in achievementData;
}

export function onPlayerJoin(playerId: Types.PlayerId){
  const data = getData(playerId, "achievement");
  const achievementKeys = Object.keys(achievementData) as AchievementKeys[];
  if(data === undefined){
    const initialData: AchievementSlot = {
      unlockedAchievements: achievementKeys,
      claimedAchievements: [],
    }
    setData(playerId, "achievement", initialData);
  }
  progressChecker(playerId, "Hello_Bloxd");
}

export function onPlayerBoughtShopItem(playerId: Types.PlayerId, categoryKey: Types.ShopCategoryKey, itemKey: Types.ShopItemKey) {
  if (!isAchievementKey(itemKey)) return;

  const data = getData(playerId, "achievement");

  if (data.claimedAchievements.includes(itemKey)) return;
  data.claimedAchievements.push(itemKey);

  setData(playerId, "achievement", data);

  api.updateShopItemForPlayer(playerId, categoryKey, itemKey, {
    buyButtonText: "受け取り済み",
    canBuy: false,
  });
};