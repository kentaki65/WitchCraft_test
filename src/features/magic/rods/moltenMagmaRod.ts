import { MagicSystem } from "../magicSystem";
import { S } from "../../../core/scheduler";
import { RodTypes } from "../../../core/types";
import type * as Types from "@bloxd";

export class MoltenMagmaRod extends MagicSystem {
  protected readonly itemName: RodTypes = "Molten Magma Rod";

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
  
  castFirstSpell(chargeTime: number): void {
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
      }, Math.round((dist * 100) / 50), this.schedulerTag);
    }
  }

  castSecondSpell(chargeTime: number) {
    const [px, py, pz] = api.getPosition(this.playerId);
    const [dx, dy, dz] = api.getPlayerFacingInfo(this.playerId)?.dir ?? [0, 0, 1];
    const x = px + dx * 0.5;
    const y = py + 1.2 + dy * 0.5;
    const z = pz + dz * 0.5;

    api.broadcastSound(`cannonFire3`, 1, 1, { playerIdOrPos: [x, y, z], maxHearDist: 10 });
    api.playParticleEffect({
      pos1: [x - 0.2, y - 0.2, z - 0.2],
      pos2: [x + 0.2, y + 0.2, z + 0.2],
      dir1: [dx * 18 - 1, dy * 18 - 1, dz * 18 - 1],
      dir2: [dx * 24 + 1, dy * 24 + 1, dz * 24 + 1],
      texture: `generic_2`,
      manualEmitCount: 40,
      minEmitPower: 0, maxEmitPower: 1.5,
      minLifeTime: 0.5, maxLifeTime: 0.9,
      minSize: 1.5, maxSize: 3.5,
      gravity: [0, 1, 0],
      blendMode: 1,
      colorGradients: [
        { timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [255, 220, 100, 1] },
        { timeFraction: 0.2, minColor: [255, 120, 0, 1], maxColor: [255, 150, 0, 1] },
        { timeFraction: 0.6, minColor: [255, 40, 0, 0.8], maxColor: [255, 0, 0, 1] },
        { timeFraction: 1, minColor: [150, 0, 0, 0], maxColor: [100, 0, 0, 0] }
      ],
      velocityGradients: [
        { timeFraction: 0, factor: 1, factor2: 1 },
        { timeFraction: 1, factor: 0.6, factor2: 0.6 }
      ],
      hideDist: 50
    });

    const dir = [dx, dy, dz];
    const hit = new Set<Types.EntityId>();
    const power = Math.min(20, chargeTime / 250);

    for (let i = 1; i <= 10; i++) {
      const tx = x + dir[0] * i;
      const ty = y + dir[1] * i;
      const tz = z + dir[2] * i;

      for (const e of api.getEntitiesInRect([tx - 2, ty - 2, tz - 2], [tx + 2, ty + 2, tz + 2])) {
        if (e === this.playerId || hit.has(e)) continue;
        hit.add(e);
        api.applyImpulse(e, ...dir.map(v => v * power * 2) as [number, number, number]);
      }
      api.applyImpulse(this.playerId, ...dir.map(v => v * power * 0.3) as [number, number, number]);
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
      if(!this.crouching) this.castFirstSpell(chargeTime);
      else this.castSecondSpell(chargeTime);

      this.chargeStart = api.now();
      api.initiateMiddleScreenBar(this.playerId, 5000, true, 0)
      api.setClientOption(this.playerId, `runningSpeed`, 2);
      api.setClientOption(this.playerId, `walkingSpeed`, 2);
    }
  }
}