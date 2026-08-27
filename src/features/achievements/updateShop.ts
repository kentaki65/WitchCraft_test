import { AchievementKeys } from "src/core/types";
import { achievementData } from "./data";
import type * as Types from "@bloxd";
import { getData, setData } from "src/core/api/dbHelper";

const createdItems = new Set<string>();
const prevStateCache = new Map <string, Types.ShopItem>();

export function updateAchievement(playerId: Types.PlayerId) {
  const names = Object.keys(achievementData) as AchievementKeys[];
  const data = getData(playerId, "achievement");

  const unlocked = new Set(data.unlockedAchievements);
  const claimed = new Set(data.claimedAchievements);

  const visible = names.filter(name => {
    const achievement = achievementData[name];

    return !achievement.parent || unlocked.has(achievement.parent);
  });

  visible.forEach((name, index) => {
    const achievement = achievementData[name];

    const isUnlocked = unlocked.has(name);
    const isClaimed = claimed.has(name);

    const canBuy = isUnlocked && !isClaimed;

    const buttonText =
      isClaimed
        ? "受け取り済み"
        : canBuy
          ? "報酬を受け取る"
          : "未解除";

    const hidden =
      achievement.isSecret && !isUnlocked;

    const key = `${playerId}:${name}`;

    const state = {
      image: achievement.icon,
      canBuy,
      buyButtonText: buttonText,
      customTitle: achievement.description,
      description: achievement.explanation,
      redDot: canBuy,
      hidden,
      sell: false,
      sortPriority: visible.length - index
    };

    if (!createdItems.has(key)) {
      api.createShopItemForPlayer(playerId, "実績", name, state);

      createdItems.add(key);
      prevStateCache.set(key, state);
      return;
    }

    const previous = prevStateCache.get(key);

    if (!previous) {
      prevStateCache.set(key, state);
      return;
    }

    const changes = {};

    for (const property in state) {
      if (previous[property] !== state[property]) {
        changes[property] = state[property];
      }
    }

    if (Object.keys(changes).length > 0) {
      api.updateShopItemForPlayer(playerId, "実績", name, changes);
      prevStateCache.set(key, state);
    }
  });
}

function isAchievementKey(key: string): key is AchievementKeys {
  return key in achievementData;
}

onPlayerBoughtShopItem = (playerId, categoryKey, itemKey) => {
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