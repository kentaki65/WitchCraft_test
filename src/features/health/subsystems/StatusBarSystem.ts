import type * as Types from "@bloxd";
import { PlayerStates } from "../PlayerStates";
import { ITickable } from "../SurvivalManager";
import { createTickInterval } from "src/utils/loop";

export class StatusBarSystem implements ITickable {
  private readonly playerId: Types.PlayerId;
  private readonly playerState: PlayerStates;

  private readonly snowBallIcons = [
    "Red Paintball",
    "Orange Paintball",
    "Yellow Paintball",
    "Snowball",
    "Light Blue Paintball",
    "Cyan Paintball",
    "Blue Paintball"
  ];

  private readonly emptyLineWater: string;
  private readonly emptyLineHunger: string;
  private readonly spaceWater: string;
  private readonly updateUI: () => void;

  constructor(playerId: Types.PlayerId, playerState: PlayerStates) {
    this.playerId = playerId;
    this.playerState = playerState;

    const pc_water = 18; const pc_hunger = 14;
    const mobile_water = 9; const mobile_hunger = 7;
    const space_pc = 18; const space_mobile = 9;

    const isMobile = api.isMobile(playerId);

    this.emptyLineWater = this.makeRepeatString("\n", isMobile ? mobile_water : pc_water);
    this.emptyLineHunger = this.makeRepeatString("\n", isMobile ? mobile_hunger : pc_hunger)
    this.spaceWater = this.makeRepeatString("\u3000", isMobile ? space_mobile : space_pc);

    this.updateUI = createTickInterval(4, () => this._updateUI());

  }

  private makeRepeatString(str: string, amount: number) {
    return str.repeat(amount);
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

  private _updateUI() {
    const waterIcons = this.makeIcons(this.playerState.get("thirst"), 8, "Water Bottle", "Empty Bottle");
    const foodIcons = this.makeIcons(this.playerState.get("hunger"), 8, "Steak", "Ball");

    api.sendFlyingMiddleMessage(this.playerId, [
      this.emptyLineWater,
      ...waterIcons,
      { str: "\n" },
      ...foodIcons,
      this.spaceWater,
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
      this.emptyLineHunger,
      { str: "\u3000\u3000" + Math.trunc(temp) + "\u2103\n", style: { fontSize: "20px" } },
      { icon: iconName, style: { fontSize: "120px" } },
    ], 0, 250);
  }

  tick(){
    this.updateUI()
  };
}