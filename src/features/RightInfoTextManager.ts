//バイオーム、危険度、レベル、解除した実績数、発見したダンジョン数、天気？

import type * as Types from "@bloxd";
import type { Biome } from "../core/worldgen/types";
import { DataManager } from "../core/managers/DataManager";
import { world } from "../core/api/worldGenerator";
import type { Vec2 } from "../core/types";
import { getPlayerData } from "../core/api/dbHelper";
import { createTickInterval } from "../utils/loop";
import { getDistance2D } from "../utils/math";
import type { WeatherManager, WeatherType } from "./worldEvents/WeatherManager";

type RightTextContent = Partial<{
  biome: Biome;
  riskLevel: number;
  playerLevel: number;
  unlockedAchv: number;
  foundDungeons: number;
  weather: WeatherType;
}>

class RightTextData extends DataManager<RightTextContent> { };

export class RightTextManager {
  private playerId: Types.PlayerId;
  private rightTextData: RightTextData;
  private weather: WeatherManager;
  private onTick: () => void;

  constructor(playerId: Types.PlayerId, weather: WeatherManager) {
    this.playerId = playerId;
    this.weather = weather;
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
      const weather = this.weather.getCurrentWeather();

      this.rightTextData.update({
        biome,
        riskLevel,
        playerLevel,
        unlockedAchv,
        foundDungeons,
        weather
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

  private _serialize(): Types.StyledText[] {
    const { biome, riskLevel, playerLevel, unlockedAchv, foundDungeons, weather } = this.rightTextData.get();

    const toStyledText = (
      text: RightTextContent[keyof RightTextContent]
    ): Types.StyledText => {
      return { str: text == null ? "" : String(text) + "\n", style: {} };
    };

    return [
      { str: "バイオーム: ", style: {} },
      toStyledText(biome),
      { str: "危険度: ", style: {}},
      toStyledText(riskLevel),
      { str: "プレイヤーレベル: ", style: {}},
      toStyledText(playerLevel),
      { str: "解除した実績数: ", style: {}},
      toStyledText(unlockedAchv),
      { str: "発見したダンジョン数: ", style: {}},
      toStyledText(foundDungeons),
      { str: "天気: ", style: {}},
      toStyledText(weather),
    ]
  }

  tick() {
    this.onTick();
  }
}