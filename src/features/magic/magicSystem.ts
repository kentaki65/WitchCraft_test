import type * as Types from "@bloxd";
import { S } from "../../core/scheduler";

//子が絶対持ってるものは abstractで
//持ってるやつと持ってないやつがあるのは空実装にしてoverrideする

export abstract class MagicSystem {
  protected playerId: Types.PlayerId;
  protected abstract readonly itemName: string;
  public readonly schedulerTag: string;

  protected slot = 0;
  protected charging = false;
  protected chargeStart = 0;
  protected cooldown = 0;
  protected currentMode: 0 | 1 = 0;
  protected crouching = false;

  constructor(playerId: Types.PlayerId) {
    this.playerId = playerId;
    this.schedulerTag = `magic:${this.playerId}`;
  }

  public deactivate(): void {
    api.log("Cancelが呼ばれた")
    this.cancelCharging();
    S.stop(this.schedulerTag);
  }
  
  protected switchMode(): void {
    this.currentMode = this.currentMode === 0 ? 1 : 0;
  }

  protected isCrouching(): boolean {
    return api.isPlayerCrouching(this.playerId);
  }

  protected updateCrouching(): void {
    const crouching = this.isCrouching();
    if(crouching && !this.crouching){
      this.switchMode();
    }

    this.crouching = crouching;
  }

  protected startCharging(): void {
    if (this.charging) return;

    this.charging = true;
    this.chargeStart = api.now();
    api.initiateMiddleScreenBar(this.playerId, 5000, true, 0);
    api.setClientOption(this.playerId, `runningSpeed`, 2);
    api.setClientOption(this.playerId, `walkingSpeed`, 2)
  }

  protected resetMovement(): void {
    api.setClientOption(this.playerId, "runningSpeed", 7);
    api.setClientOption(this.playerId, "walkingSpeed", 4);
  }

  protected diffCharging(): number {
    return api.now() - this.chargeStart;
  }

  protected stopCharging(): number | undefined {
    if (!this.charging) return undefined;

    this.charging = false;
    this.resetMovement();
    return this.diffCharging();
  }

  public cancelCharging(): void {
    if (!this.charging) return;

    this.charging = false;
    api.removeMiddleScreenBar(this.playerId);
    this.resetMovement();
  }

  public onEquip(): void {
    api.setClientOption(
      this.playerId,
      "touchscreenActionButton",
      [{ icon: this.itemName }]
    );
  }

  public onPlayerDeath(): void {
    this.cancelCharging();
    S.stop(this.schedulerTag);
    this.cooldown = api.now();
  }

  abstract tick: (...args: any[]) => void;
  abstract onPlayerAltAction: (...args: any[]) => void;
  abstract onPlayerClick: (...args: any[]) => void;
  abstract onPlayerClickUp: (...args: any[]) => void;
  abstract onTouchscreenActionButton: (...args: any[]) => void;
}