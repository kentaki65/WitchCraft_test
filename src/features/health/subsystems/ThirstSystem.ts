import type * as Types from "@bloxd";
import { PlayerStates } from "../PlayerStates";
import type { ITickable } from "../SurvivalManager";
import { createTickInterval } from "../../../utils/loop";
import { normalize } from "../../../utils/math";

export class ThirstSystem implements ITickable {
  private readonly playerId: Types.PlayerId;
  private readonly playerState: PlayerStates;

  private readonly reach = 10;
  private readonly decreaseThirstHot: () => void;
  private readonly decreaseThirst: ()=> void;

  constructor(playerId: Types.PlayerId, playerState: PlayerStates) {
    this.playerId = playerId;
    this.playerState = playerState;

    this.decreaseThirst = createTickInterval(1200, () => this._decreaseThirst());
    this.decreaseThirstHot = createTickInterval(100, () => this._decreaseThirstHot());
  }

  private _decreaseThirst(){
    if(Math.random() < 0.5){
      this.playerState.update("thirst", -1);
    }
  }

  private _decreaseThirstHot(){
    //喉が早く渇き始める温度
    if(this.playerState.get("temp") > 42 && Math.random() < 0.5){
      this.playerState.update("thirst", -1);
    }
  }

  onPlayerAltAction() {
    const thirst = this.playerState.get("thirst");
    if (thirst >= 8) return;

    const { camPos, dir } = api.getPlayerFacingInfo(this.playerId);
    const lookDir = normalize(dir);
    if (!lookDir) return;

    for (let i = 1; i <= this.reach; i++) {
      const pos = [
        Math.floor(camPos[0] + lookDir[0] * i),
        Math.floor(camPos[1] + lookDir[1] * i),
        Math.floor(camPos[2] + lookDir[2] * i)
      ];

      const blockName = api.getBlock(pos);

      if (blockName === "Water" && !api.getBlockSolidity(pos)) {
        this.playerState.update("thirst", 1);
        api.playSound(this.playerId, "bucketFill3", 1, 1);
        break;
      }
    }
  }

  tick() {
    this.decreaseThirst();
    this.decreaseThirstHot();
  }
}