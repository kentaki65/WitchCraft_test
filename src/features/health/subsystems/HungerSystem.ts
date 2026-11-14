import type * as Types from "@bloxd";
import { PlayerStates } from "../PlayerStates";
import type { ITickable } from "../SurvivalManager";
import type { Vec3 } from "../../../core/types";
import { createTickInterval } from "../../../utils/loop";
import { getDistance } from "../../../utils/math";

type ItemMetadata =
  | Partial<Types._TypeOf["BlockMetadataItem"]>
  | Partial<Types._TypeOf["NonBlockMetadataItem"]>;

function isNonBlockMetadata(
  meta: ItemMetadata
): meta is Partial<Types._TypeOf["NonBlockMetadataItem"]> {
  return "eatable" in meta;
}

export class HungerSystem implements ITickable {
  private readonly hungerDistance = 250;

  private readonly playerId: Types.PlayerId;
  private readonly playerState: PlayerStates;

  private prevPos: Vec3;
  private updateDistance: () => void;

  private traveledDistance = 0;

  constructor(playerId: Types.PlayerId, playerState: PlayerStates) {
    this.playerId = playerId;
    this.playerState = playerState;
    this.prevPos = api.getPosition(playerId);

    this.updateDistance = createTickInterval(2, () => this.checkDistance());
  }

  checkDistance(): void {
    const pos = api.getPosition(this.playerId);
    this.traveledDistance += getDistance(pos, this.prevPos);
    this.prevPos = pos;

    while (this.traveledDistance >= this.hungerDistance) {
      this.playerState.update("hunger", -1);
      this.traveledDistance -= this.hungerDistance;
    }
  }

  tick() {
    if (this.playerState.get("hunger") === 8) api.setClientOption(this.playerId, "healthRegenStartAfter", 0);
    else  api.setClientOption(this.playerId, "healthRegenStartAfter", Number.MAX_SAFE_INTEGER);
    
    this.updateDistance();
  }

  onPlayerFinishChargingItem(...args: Parameters<typeof onPlayerFinishChargingItem>) {
    const [_, used, itemName] = args;
    if (!used) return;

    const meta = api.getInitialItemMetadata(itemName);
    if (!isNonBlockMetadata(meta)) return;

    const { eatHealAmt } = meta;

    if (eatHealAmt !== undefined) {
      const health = api.getHealth(this.playerId);
      if (health !== 100) api.applyHealthChange(this.playerId, -eatHealAmt);
      this.playerState.update("hunger", 1);
    }
  }
}