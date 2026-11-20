//バイオーム、危険度、レベル、解除した実績数、発見したダンジョン数、天気？

import type * as Types from "@bloxd";
import type { Biome } from "../core/worldgen/types";
import { DataManager } from "../core/managers/DataManager";
import { world } from "../core/helpers/worldGenerator";
import type { Vec2 } from "../core/types";
import { getPlayerData } from "../core/helpers/dbHelper";
import { createTickInterval } from "../utils/loop";
import { getDistance2D } from "../utils/math";
import type { SurvivalManager } from "./health/SurvivalManager";
import { biomeNameMap } from "../core/constance";

type RightTextContent = Partial<{
  biome: Biome;
  riskLevel: number;
  playerLevel: number;
  unlockedAchv: number;
  foundDungeons: number;
  hunger: number;
  thirst: number;
  temperature: number;
}>

class RightTextData extends DataManager<RightTextContent> { };

export class RightTextManager {
  private playerId: Types.PlayerId;
  private rightTextData: RightTextData;
  private survivalManager: SurvivalManager;

  private onTick: () => void;

  constructor(playerId: Types.PlayerId, survivalManager: SurvivalManager) {
    this.playerId = playerId;
    this.survivalManager = survivalManager;

    this.rightTextData = new RightTextData({}, (data) => {
      api.setClientOption(this.playerId, "RightInfoText", this._serialize())
    })

    this.onTick = createTickInterval(20, () => {
      const [x, y, z] = api.getPosition(this.playerId);

      const biome = world.getBiome(x, z);
      const riskLevel = this._calcRiskLevel([x, z]);
      const playerLevel = getPlayerData(this.playerId, "playerLevel") ?? 0;
      const unlockedAchv = getPlayerData(this.playerId, "achievement")?.unlockedAchievements?.length ?? 0;
      const foundDungeons = getPlayerData(this.playerId, "foundDungeons") ?? 0;

      const hunger = this.survivalManager.get("hunger");
      const thirst = this.survivalManager.get("thirst");
      const temperature = this.survivalManager.get("temp");

      this.rightTextData.update({
        biome,
        riskLevel,
        playerLevel,
        unlockedAchv,
        foundDungeons,
        hunger,
        thirst,
        temperature,
      })
    })
  }

  private _calcRiskLevel(pos: Vec2) {
    const origin: Vec2 = [0, 0];
    const distance = getDistance2D(origin, pos);

    const max = 100;
    const constantK = 100000;
    return Math.round(max * (1 - Math.exp(-distance / constantK)));
  }

  private makeIcons(
    count: number, max: number,
    fullIcon: Types.IngameIconName | Types.BlockName,
    emptyIcon: Types.IngameIconName | Types.BlockName
  ): Types.StyledIcon[] {
    return Array.from({ length: max }, (_, i) => ({
      icon: i < count ? fullIcon : emptyIcon,
      style: {}
    } as Types.StyledIcon));
  }

  private _serialize(): (Types.StyledText | Types.StyledIcon)[] {
    const {
      biome,
      riskLevel,
      playerLevel,
      unlockedAchv,
      foundDungeons,
      hunger,
      thirst,
      temperature,
    } = this.rightTextData.get();

    const result: (Types.StyledText | Types.StyledIcon)[] = [];

    const section = (name: string) => {
      result.push(
        { str: `${name}\n`, style: { fontSize: "16px", fontWeight: "bold", color: "#E5C878" } },
      );
    };

    const label = (name: string) => {
      result.push({
        str: `${name}\n`,
        style: { color: "#AAB3C2", fontSize: "12px" },
      });
    };

    const value = (content: unknown) => {
      result.push({
        str: `${content ?? "—"}\n`,
        style: { color: "#FFFFFF", fontWeight: "bold" },
      });
    };

    section("ENVIRONMENT");

    label("気温");
    value(`${Math.floor(temperature ?? 0) ?? "—"} °C`);

    label("バイオーム");
    value(biomeNameMap[biome ?? "Plains"]);

    label("危険度");
    value(`LEVEL ${riskLevel ?? "—"}`);

    section("VITALITY");

    label("空腹度");
    result.push(...this.makeIcons(hunger ?? 0, 8, "Steak", "Ball"));
    result.push({ str: "\n", style: {} });

    label("水分量");
    result.push(...this.makeIcons(thirst ?? 0, 8, "Water Bottle", "Empty Bottle"));
    result.push({ str: "\n", style: {} });

    section("ADVENTURE RECORD");

    label("冒険者レベル");
    value(`Lv. ${playerLevel ?? "—"}`);

    label("実績解除数");
    value(unlockedAchv);

    label("ダンジョン発見数");
    value(foundDungeons);

    return result;
  }

  tick() {
    this.onTick();
  }
}