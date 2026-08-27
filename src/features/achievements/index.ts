import { getData, setData } from "src/core/api/dbHelper";
import { achievementData } from "./data";
import { Achievement, AchievementKeys, AchievementSlot } from "src/core/types";
import type * as Types from "@bloxd";
import { updateAchievement } from "./updateShop";

onPlayerJoin = (playerId) => {
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