import { MagicSystem } from "../magicSystem";
import { S } from "../../../core/scheduler";
import type * as Types from "@bloxd";

export class DraugrRod extends MagicSystem {
  protected readonly itemName: string = "Draugr Rod";

  protected spawnProjectile({ x, y, z, dx, dy, dz, dist, damage, chargeTime }) {
    let px = x + dx * dist;
    let py = y + dy * dist;
    let pz = z + dz * dist;

    api.broadcastSound(`croneHurt1`, 1, 1, {
      playerIdOrPos: [px, py, pz],
      maxHearDist: 10
    });
    const targets = api.getEntitiesInRect([px - 1.5, py - 2, pz - 1.5], [px + 1.5, py + 2, pz + 1.5]);
    for (const targetId of targets) {
      if (targetId === this.playerId) continue;
      try {
        api.applyEffect(targetId, `Frozen`, chargeTime, {
          displayName: `Iced`,
          initiatorId: this.playerId
        })
      } catch (e) { }
      api.attemptApplyDamage({
        eId: this.playerId,
        hitEId: targetId,
        attemptedDmgAmt: Math.max(1, damage - dist),
        withItem: `Iceball`
      })
    }
  }

  castFirstSpell(chargeTime: number): void {
    let [x, y, z] = api.getPosition(this.playerId); y += 1.5;
    const [dx, dy, dz] = api.getPlayerFacingInfo(this.playerId)?.dir ?? [0, 0, 1];

    const points = this.calcPoint(chargeTime);
    const damage = this.calcDamage(chargeTime);

    api.playParticleEffect({
      pos1: [x + dx - 0.2, y + dy - 0.2, z + dz - 0.2],
      pos2: [x + dx + 0.2, y + dy + 0.2, z + dz + 0.2],
      dir1: [dx * 10, dy * 10, dz * 10],
      dir2: [dx * 12, dy * 12, dz * 12],
      texture: `glint`,
      manualEmitCount: Math.min(20, 3 + Math.floor(chargeTime / 500) * 2),
      minEmitPower: 1,
      maxEmitPower: 2,
      minLifeTime: chargeTime * 0.0003,
      maxLifeTime: chargeTime * 0.0003,
      minSize: 0.4,
      maxSize: 0.5,
      gravity: [0, 0, 0],
      blendMode: 1,
      colorGradients: [{
        timeFraction: 0,
        minColor: [100, 100, 255, 1],
        maxColor: [100, 100, 255, 1]
      }, {
        timeFraction: 1,
        minColor: [255, 255, 255, 0],
        maxColor: [255, 255, 255, 0]
      }],
      velocityGradients: [{
        timeFraction: 0,
        factor: 1,
        factor2: 1
      }, {
        timeFraction: 1,
        factor: 1,
        factor2: 1
      }],
      hideDist: 50,
    });

    for (let dist = 1; dist <= points; dist++) {
      S.run(() => {
        this.spawnProjectile(
          { x, y, z, dx, dy, dz, dist, damage, chargeTime }
        )
      }, Math.round((dist * 100) / 50), this.schedulerTag)
    }
  }

  castSecondSpell(chargeTime: number): void {
    let [x, y, z] = api.getPosition(this.playerId); y += 1.2;
    const dir = api.getPlayerFacingInfo(this.playerId)?.dir;
    const [dx, dy, dz] = dir;
    const power = this.calcPoint(chargeTime);

    x += dx * 0.5;
    y += dy * 0.5;
    z += dz * 0.5;

    api.broadcastSound(`metalDoorKnock`, 1, 1, {
      playerIdOrPos: [x, y, z],
      maxHearDist: 10
    })
    api.playParticleEffect({
      pos1: [x - 10.5, y - 10, z - 10.5],
      pos2: [x + 10.5, y + 10, z + 10.5],
      dir1: [dx * 40 - 1, dy * 40 - 1, dz * 40 - 1],
      dir2: [dx * 50 + 1, dy * 50 + 1, dz * 50 + 1],
      texture: `glint`,
      manualEmitCount: 80,
      minEmitPower: 1,
      maxEmitPower: 1.2,
      minLifeTime: 0.3,
      maxLifeTime: 0.5,
      minSize: 2,
      maxSize: 5,
      gravity: [0, 0, 0],
      blendMode: 1,
      colorGradients: [{
        timeFraction: 0,
        minColor: [255, 255, 255, 1],
        maxColor: [220, 245, 255, 1]
      }, {
        timeFraction: 0.5,
        minColor: [100, 200, 255, 1],
        maxColor: [150, 230, 255, 1]
      }, {
        timeFraction: 1,
        minColor: [0, 100, 255, 0],
        maxColor: [50, 150, 255, 0]
      }],
      velocityGradients: [{
        timeFraction: 0,
        factor: 1,
        factor2: 1
      }, {
        timeFraction: 1,
        factor: 0.8,
        factor2: 0.8
      }],
      hideDist: 50,
    })
    api.playParticleEffect({
      pos1: [x - 2.5, y - 1, z - 2.5],
      pos2: [x + 2.5, y + 2, z + 2.5],
      dir1: [dx * 15 - 3, dy * 15 - 3, dz * 15 - 3],
      dir2: [dx * 25 + 3, dy * 25 + 3, dz * 25 + 3],
      texture: `square_particle`,
      manualEmitCount: 100,
      minEmitPower: 1,
      maxEmitPower: 1.5,
      minLifeTime: 0.4,
      maxLifeTime: 0.8,
      minSize: 0.5,
      maxSize: 1.5,
      gravity: [0, -2, 0],
      blendMode: 1,
      colorGradients: [{
        timeFraction: 0,
        minColor: [255, 255, 255, 1],
        maxColor: [200, 245, 255, 1]
      }, {
        timeFraction: 1,
        minColor: [0, 150, 255, 0],
        maxColor: [100, 200, 255, 0]
      }],
      velocityGradients: [{
        timeFraction: 0,
        factor: 1,
        factor2: 1
      }, {
        timeFraction: 1,
        factor: 0.2,
        factor2: 0.2
      }],
      hideDist: 50
    })

    const hited = new Set();
    for (let i = 1; i <= 10; i++) {
      const tx = x + dir[0] * i;
      const ty = y + dir[1] * i;
      const tz = z + dir[2] * i;
      const targets = api.getEntitiesInRect([tx, ty, tz].map(n => n - 4), [tx, ty, tz].map(n => n + 4));
      for (const targetId of targets) {
        if (targetId === this.playerId || hited.has(targetId)) continue;
        hited.add(targetId);

        try {
          api.applyEffect(targetId, `Frozen`, power * 250, {
            inbuiltLevel: 2
          })
          api.applyEffect(targetId, `Slowness`, power * 250 * 2, {
            inbuiltLevel: 2
          })
        } catch (e) { }
      }
    }
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
