import { getData, setData } from "../../core/api/dbHelper";
import { achievementData } from "./data";
import { Achievement, AchievementKeys, AchievementSlot } from "../../core/types";
import type * as Types from "@bloxd";

const createdItems = new Set<string>();
const prevStateCache = new Map <string, Types.ShopItem>();

function showAchieve(playerId: Types.PlayerId, achievement: Achievement) {
  const { description, isSecret, isGoal, icon } = achievement;

  const t = isSecret ? "挑戦完了！" : isGoal ? "目標達成！" : "実績達成！";
  const h = isSecret ? "挑戦" : isGoal ? "目標" : "実績";
  const l = isSecret ? "を完了した" : isGoal ? "を達成した" : "を達成した";
  const c = isSecret ? "#AA00AA" : "#DFD000";

  api.sendTopRightHelper(playerId, icon, `${t}[${description}]`, {
    duration: 8, width: 300, height: 90, color: c, iconSizeMult: 4, fontSize: "20px"
  });

  api.broadcastMessage([
    { str: api.getEntityName(playerId) + "は" + h, style: { color: "white", fontWeight: "lighter" } },
    { str: `[${description}]`, style: { color: isSecret ? "#AA00AA" : "lightgreen", fontWeight: "lighter" } },
    { str: l, style: { color: "white", fontWeight: "lighter" } }
  ]);
}

export function progressChecker(playerId: Types.PlayerId, achievementId: AchievementKeys) {
  const achievement = achievementData[achievementId];
  if (!achievement) return false;

  const parentId = achievement.parent;
  const data = getData(playerId, "achievement");
  if (data.unlockedAchievements.includes(achievementId)) return false;

  if (parentId) {
    const data = getData(playerId, "achievement");

    if (!data.unlockedAchievements.includes(parentId)) {
      return false;
    }
  }

  data.unlockedAchievements.push(achievementId);
  setData(playerId, "achievement", data);
  updateAchievement(playerId);
  showAchieve(playerId, achievement);  
  return true;
}

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