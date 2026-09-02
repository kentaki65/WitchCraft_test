import { findNearest, subtractVec } from "../../../utils/math";
import { MagicSystem } from "../magicSystem";
import { S } from "../../../core/scheduler";
import type * as Types from "@bloxd";

export class cursedRod extends MagicSystem {
  protected readonly itemName = "Cursed Rod";
  protected readonly chainInterval = 20;

  chainAttack(targetId: Types.MobId, vec: Types.Vec3, fromPos: Types.Vec3) {
    api.playParticleEffect({
      dir1: vec,
      dir2: vec,
      pos1: fromPos,
      pos2: fromPos.map(n => n + 1),
      texture: "soul_0",
      minLifeTime: 0.4,
      maxLifeTime: 0.6,
      minEmitPower: 5,
      maxEmitPower: 10,
      minSize: 1,
      maxSize: 2,
      manualEmitCount: 10,
      gravity: [0, 0, 0],
      colorGradients: [
        {
          timeFraction: 0,
          minColor: [60, 60, 150, 1],
          maxColor: [128, 0, 128, 1],
        },
      ],
      velocityGradients: [
        {
          timeFraction: 0,
          factor: 1,
          factor2: 1,
        },
      ],
      blendMode: 1,
      hideDist: 500,
    });
    //攻撃など
  }

  attackNearest(fromPos: Types.Vec3, hitted: Set<Types.MobId>, remaining: number) {
    if(remaining === 0) return;

    const targets = api.getEntitiesInRect(
      fromPos.map(n => n - 10), 
      fromPos.map(n => n + 10)
    ).filter(n => !hitted.has(n)).filter(n => n !== this.playerId);;

    api.log(targets);
    const nearest = findNearest(targets, fromPos);
    if (!nearest) return;

    const nearestPos = api.getPosition(nearest);
    const vec = subtractVec(fromPos, nearestPos);

    this.chainAttack(nearest, vec, fromPos);
    S.run(() => this.attackNearest(nearestPos, hitted.add(nearest), remaining - 1), this.chainInterval)
  }

  castFirstSpell(chargeTime: number): void {
    const playerPos = api.getPosition(this.playerId);
    const [x, y, z] = playerPos;
    const [dx, dy, dz] = api.getPlayerFacingInfo(this.playerId).dir ?? [0, 0, 1];
    const chain = this.calcPoint(chargeTime);
    const dist = 10;

    const fromPos: Types.Vec3 = [
      x + dx * dist,
      y + dy * dist,
      z + dz * dist,
    ];

    const targets = api.getEntitiesInRect(
      fromPos.map(n => n - 10),
      fromPos.map(n => n + 10),
    ).filter(n => n !== this.playerId);

    const firstTarget = findNearest(targets, fromPos);
    if (!firstTarget) return;

    const firstTargetPos = api.getPosition(firstTarget);
    const vecPlayerMob = subtractVec(playerPos, firstTargetPos);
    const hitted = new Set<Types.MobId>([firstTarget]);

    this.chainAttack(firstTarget, vecPlayerMob, playerPos);
    S.run(() => this.attackNearest(firstTargetPos, hitted, chain), this.chainInterval);
  }

  castSecondSpell(chargeTime: number): void {

  }

  onPlayerClick = (): void => {
    this.startCharging();
  }

  onPlayerClickUp = (): void => {
    const chargeTime = this.stopCharging();
    if (chargeTime === undefined || chargeTime < this.MIN_CHARGE[this.currentMode]) return;

    if (!this.crouching) this.castFirstSpell(chargeTime);
    else this.castSecondSpell(chargeTime);
  }

  onPlayerAltAction = (): void => {
    this.startCharging();
  }

  onTouchscreenActionButton = (playerId: Types.PlayerId, touchDown: boolean): void => {
    if (touchDown) {
      this.startCharging();
    } else {
      const chargeTime = this.stopCharging();
      if (chargeTime === undefined || chargeTime < this.MIN_CHARGE[this.currentMode]) return;

      if (!this.crouching) this.castFirstSpell(chargeTime);
      else this.castSecondSpell(chargeTime);
    }
  }

  tick = (): void => {
    this.updateCrouching();
    if (!this.charging) return;

    const chargeTime = this.diffCharging();
    const color = this.getChargeColor(chargeTime);

    api.shakePlayerCamera(this.playerId, chargeTime / 1e5, 50);
    api.sendFlyingMiddleMessage(this.playerId, [
      { icon: `fa-solid fa-crosshairs`, style: { color, opacity: 0.3 } },
      { str: `\n`.repeat(3) }
    ], 0, 100)

    if (chargeTime > 5000) {
      if (this.crouching) this.castFirstSpell(chargeTime);
      else this.castSecondSpell(chargeTime);

      this.chargeStart = api.now();
      api.initiateMiddleScreenBar(this.playerId, 5000, true, 0)
      api.setClientOption(this.playerId, `runningSpeed`, 2);
      api.setClientOption(this.playerId, `walkingSpeed`, 2);
    }
  }
}