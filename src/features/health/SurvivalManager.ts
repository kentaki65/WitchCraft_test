import type * as Types from "@bloxd";
import { PlayerStates } from "./PlayerStates";
import { HungerSystem } from "./subsystems/HungerSystem";
import { TemperatureSystem } from "./subsystems/TemperatureSystem";
import { ThirstSystem } from "./subsystems/ThirstSystem";
import { Parameters } from "src/core/types";
import { createTickInterval } from "src/utils/loop";

export interface ISurvivalManager {
  tick: () => void;
}

export class SurvivalManager {
  private readonly playerId: Types.PlayerId;
  private readonly playerState: PlayerStates;
  private readonly hungerSystem: HungerSystem;
  private readonly temperatureSystem: TemperatureSystem;
  private readonly thirstSystem: ThirstSystem;

  private readonly emptyLine_water: string;
  private readonly emptyLine_hunger: string;
  private readonly space_water: string;

  private readonly updateUI: () => void;

  private readonly snowBallIcons = [
    "Red Paintball",
    "Orange Paintball",
    "Yellow Paintball",
    "Snowball",
    "Light Blue Paintball",
    "Cyan Paintball",
    "Blue Paintball"
  ];

  constructor(playerId: Types.PlayerId) {
    this.playerId = playerId;
    this.playerState = new PlayerStates();
    this.hungerSystem = new HungerSystem(playerId, this.playerState);
    this.temperatureSystem = new TemperatureSystem(playerId, this.playerState);
    this.thirstSystem = new ThirstSystem(playerId, this.playerState);

    const pc_water = 18; const pc_hunger = 14;
    const mobile_water = 9; const mobile_hunger = 7;
    const space_pc = 18; const space_mobile = 9;

    const isMobile = api.isMobile(playerId);

    this.emptyLine_water = this.makeRepeatString("\n", isMobile ? mobile_water : pc_water);
    this.emptyLine_hunger = this.makeRepeatString("\n", isMobile ? mobile_hunger : pc_hunger)
    this.space_water = this.makeRepeatString("\u3000", isMobile ? space_mobile : space_pc);

    this.updateUI = createTickInterval(4, () => this._updateUI());
  }
  
  private makeIcons(
    count: number, max: number,
    fullIcon: Types.IngameIconName | Types.BlockName,
    emptyIcon: Types.IngameIconName | Types.BlockName
  ): Types.StyledIcon[] {
    return Array.from({ length: max }, (_, i) => ({
      icon: i < count ? fullIcon : emptyIcon,
      style: { fontSize: "40px" }
    } as Types.StyledIcon));
  }

  private makeRepeatString(str: string, amount: number) {
    return str.repeat(amount);
  }

  private _updateUI() {
    const waterIcons = this.makeIcons(this.playerState.get("thirst"), 8, "Water Bottle", "Empty Bottle");
    const foodIcons = this.makeIcons(this.playerState.get("hunger"), 8, "Steak", "Ball");

    api.sendFlyingMiddleMessage(this.playerId, [
      this.emptyLine_water,
      ...waterIcons,
      { str: "\n" },
      ...foodIcons,
      this.space_water,
    ], 0, 250);

    const temp = this.playerState.get("temp");
    const { min, max } = this.playerState.stateRange.temp;

    const idx = Math.round(
      (min - temp) /
      ((max - min) / (this.snowBallIcons.length - 1))
    );

    const iconName = this.snowBallIcons[
      Math.max(0, Math.min(idx, this.snowBallIcons.length - 1))
    ];

    api.sendFlyingMiddleMessage(this.playerId, [
      this.emptyLine_hunger,
      { str: "\u3000\u3000" + Math.trunc(temp) + "\u2103\n", style: { fontSize: "20px" } },
      { icon: iconName, style: { fontSize: "120px" } },
    ], 0, 250);
  }

  onPlayerFinishChargingItem(...args: Parameters<typeof onPlayerFinishChargingItem>) {
    this.hungerSystem.onPlayerFinishChargingItem(...args);
  }

  onPlayerAltAction(...args: Parameters<typeof onPlayerAltAction>) {
    this.thirstSystem.onPlayerAltAction();
  }

  onPlayerPotionEffect([, , effectName]: Parameters<typeof onPlayerPotionEffect>) {
    this.temperatureSystem.onPlayerPotionEffect(effectName);
  }

  tick() {
    this.updateUI();
    this.hungerSystem.tick();
    this.temperatureSystem.tick();
    this.thirstSystem.tick();
  }
}