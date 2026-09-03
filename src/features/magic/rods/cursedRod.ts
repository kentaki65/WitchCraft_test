import { divideVec, findNearest, subtractVec, getDistance, randomNumber, normalize } from "../../../utils/math";
import { MagicSystem } from "../magicSystem";
import { S } from "../../../core/scheduler";
import type * as Types from "@bloxd";

type Vec3 = [number, number, number];

export class cursedRod extends MagicSystem {
  protected readonly itemName = "Cursed Rod";
  protected readonly chainInterval = 2;
  protected readonly segments = 5;
  protected readonly reachTick = this.chainInterval * this.segments;
  protected override readonly MIN_CHARGE = [2000, 2000] as const;

  playChainEffect(targetId: Types.MobId, fromPos: Vec3) {
    const loop = (index: number): void => {
      let targetPos = api.getPosition(targetId);
      const points: Vec3[] = divideVec(fromPos, targetPos, this.segments);

      const pos: Vec3 = [
        points[index][0],
        points[index][1] + 1,
        points[index][2],
      ];

      if (!points) return;
      const dir = subtractVec(pos, targetPos);

      api.broadcastSound(`wraithHurt`, 1, 1, {
        playerIdOrPos: targetPos,
        maxHearDist: 50
      })

      api.playParticleEffect({
        dir1: dir,
        dir2: dir,
        pos1: pos.map(n => n - 0.1),
        pos2: pos.map(n => n + 0.1),
        texture: "soul_0",
        minLifeTime: 0.5,
        maxLifeTime: 1,
        minEmitPower: 0,
        maxEmitPower: 0,
        minSize: 0.5,
        maxSize: 1,
        manualEmitCount: 10,
        gravity: [0, 0, 0],
        colorGradients: [
          {
            timeFraction: 0,
            minColor: [70, 215, 230, 1],
            maxColor: [75, 225, 240, 1],
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

      if (index + 1 < points.length) {
        S.run(() => loop(index + 1), 2);
      } else {
        api.attemptApplyDamage({
          eId: this.playerId,
          hitEId: targetId,
          attemptedDmgAmt: 25 * index,
          withItem: this.itemName
        });
      }
    }

    loop(0);
  }

  attackNearest(fromPos: Vec3, hitted: Set<Types.MobId>, remaining: number) {
    if (remaining <= 0) return;

    const margin = 10;
    const targets = api.getEntitiesInRect(
      fromPos.map(n => n - margin),
      fromPos.map(n => n + margin)
    ).filter(n => !hitted.has(n)).filter(n => n !== this.playerId).filter(n => api.getEntityType(n) !== "Item");

    const nearest = findNearest(targets, fromPos);
    if (!nearest) return;

    const nearestPos = api.getPosition(nearest);

    this.playChainEffect(nearest, fromPos);

    S.run(
      () => this.attackNearest(nearestPos, hitted.add(nearest), remaining - 1),
      this.reachTick
    );
  }

  castFirstSpell(chargeTime: number): void {
    const playerPos = api.getPosition(this.playerId);
    const [x, y, z] = playerPos;
    const [dx, dy, dz] = api.getPlayerFacingInfo(this.playerId).dir ?? [0, 0, 1];
    const chain = this.calcPoint(chargeTime);
    const dist = 10;

    const fromPos: Vec3 = [
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
    const hitted = new Set<Types.MobId>([firstTarget]);

    this.playChainEffect(firstTarget, playerPos);
    S.run(() => this.attackNearest(firstTargetPos, hitted, chain), this.reachTick);
  }

  castSecondSpell(chargeTime: number): void {
    const [x, y, z] = api.getPosition(this.playerId);
    const dir: Vec3 = api.getPlayerFacingInfo(this.playerId).dir ?? [0, 0, 1];

    const [dx, dy, dz] = normalize(dir.map(n => -n));
    const min: Vec3 = [
      x + dx * 3 - 1,
      y + 3 - 1,
      z + dz * 3 - 1,
    ];

    const max: Vec3 = [
      x + dx * 3 + 1,
      y + 3 + 1,
      z + dz * 3 + 1,
    ];
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
      if (!this.crouching) this.castFirstSpell(chargeTime);
      else this.castSecondSpell(chargeTime);

      this.chargeStart = api.now();
      api.initiateMiddleScreenBar(this.playerId, 5000, true, 0)
      api.setClientOption(this.playerId, `runningSpeed`, 2);
      api.setClientOption(this.playerId, `walkingSpeed`, 2);
    }
  }
}