import type * as Types from "@bloxd";
//子が絶対持ってるものは abstractで
//持ってるやつと持ってないやつがあるのは空実装にしてoverrideする

export abstract class MagicSystem {
  protected playerId: Types.PlayerId;

  protected slot = 0;
  protected charging = false;
  protected chargeStart = 0;
  protected cooldown = 0;
  protected currentMode = 0;

  constructor(playerId: Types.PlayerId) {
    this.playerId = playerId;
  }

  reset(): void {
    this.charging = false;
    this.chargeStart = 0;
    this.cooldown = 0;
  }

  updateSlot(newSlot: number): void {
    this.slot = newSlot;
  }

  protected startCharging(): void {
    this.charging = true;
    this.chargeStart = api.now();
  }

  protected stopCharging(): void {
    this.charging = false;
  }

  abstract tick(...args: any[]): void;
  abstract onPlayerAltAction(...args: any[]): void;
  abstract onPlayerClick(...args: any[]): void;
  abstract onPlayerClickUp(...args: any[]): void;
  abstract onPlayerSwapInvenSlots(...args: any[]): void;
  abstract onPlayerDropItem(...args: any[]): void;
  abstract onTouchscreenActionButton(...args: any[]): void;
  abstract onPlayerPickedUpItem(...args: any[]): void;
  abstract onAttemptKillPlayer(...args: any[]): void;
}