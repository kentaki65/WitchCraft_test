import type * as Types from "@bloxd";
import { S } from "../../core/scheduler";
const MS_PER_TICK = 50;

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

  protected calcPoint(chargeTime: number): number {
    const point = Math.min(20, Math.floor(chargeTime / 250));
    return point;
  }

  protected calcDamage(chargeTime: number): number {
    const damage = Math.min(100, 10 + Math.floor(chargeTime / 1000) * 5);
    return damage;
  }

  protected spawnProjectile({ x, y, z, dx, dy, dz, dist, damage }) {
    let px = x + dx * dist;
    let py = y + dy * dist;
    let pz = z + dz * dist;

    api.broadcastSound(`firecracker1`, 1, 1, {
      playerIdOrPos: [px, py, pz],
      maxHearDist: 10
    });

    api.playParticleEffect({
      pos1: [px, py, pz].map(n => n - 2),
      pos2: [px, py, pz].map(n => n + 2),
      presetId: `redFirecrackerLarge`
    });

    const targets = api.getEntitiesInRect([px, py, pz].map(n => n - 4), [px, py, pz].map(n => n + 4));

    for (const targetId of targets) {
      if (targetId === this.playerId) continue;
      api.attemptApplyDamage({
        eId: this.playerId,
        hitEId: targetId,
        attemptedDmgAmt: Math.max(1, damage - dist),
        withItem: `Fireball Block`
      })
    }
  }

  protected castChargedSpell(chargeTime: number): void {
    api.log(`chargetime: ${chargeTime}`);
    const [x, y, z] = api.getPosition(this.playerId);
    const [dx, dy, dz] = api.getPlayerFacingInfo(this.playerId)?.dir ?? [0, 0, 1];

    const points = this.calcPoint(chargeTime);
    const damage = this.calcDamage(chargeTime);

    for (let offset = 0; offset < points; offset += 2) {
      const dist = offset + 4;
      S.run(() => {
        this.spawnProjectile({
          x, y, z, dx, dy, dz, dist, damage
        });
      }, Math.round((dist * 100) / MS_PER_TICK), this.schedulerTag);
    }
  }

  protected getChargeColor(chargeTime: number): string {
    const level = Math.min(8, Math.floor(chargeTime / 500));
    return ["white", "white", "lime", "lime", "yellow", "yellow", "orange", "orange", "red"][level];
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