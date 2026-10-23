import { divideVec, findNearest, subtractVec, dot, normalize, tickToMs } from "../../../utils/math";
import { MagicSystem, RodSettings } from "../magicSystem";
import { setInterval, clearInterval, setTimeout, TimeoutId, clearTimeout } from "@plugins/helpers";
import type * as Types from "@bloxd";

type Vec3 = [number, number, number];

export enum CursedRodSkillNames {
  WraithChain = "WraithChain", SoulHex = "SoulHex"
}

export class CursedRod extends MagicSystem<CursedRodSkillNames> {
  protected readonly itemName = "Cursed Rod";
  protected readonly chainInterval = 2;
  protected readonly segments = 5;
  protected readonly reachms = tickToMs(this.chainInterval * this.segments);

  protected readonly rodSettings: Record<CursedRodSkillNames, RodSettings> = {
    [CursedRodSkillNames.WraithChain]: {
      useThirdParsonView: true,
      needCharge: true,
      minCharge: 2000
    },
    [CursedRodSkillNames.SoulHex]: {
      useThirdParsonView: false,
      needCharge: false,
    }
  }

  protected readonly skills = [
    CursedRodSkillNames.WraithChain, CursedRodSkillNames.SoulHex
  ]

  protected markedMobs = new Set<Types.PlayerId | Types.MobId>();

  castSpell(mode: CursedRodSkillNames, chargeTime: number): void {
    switch (mode) {
      case CursedRodSkillNames.WraithChain:
        this.castFirstSpell(chargeTime);
        break;

      case CursedRodSkillNames.SoulHex:
        this.castSecondSpell(chargeTime);
        break;
    }
  }
  playChainEffect(targetId: Types.MobId, fromPos: Vec3) {
    let index = 0;
    const chainIntervalId = setInterval(() => {
      try {
        let targetPos = api.getPosition(targetId);
        const points: Vec3[] = divideVec(fromPos, targetPos, this.segments);

        if (!points) {
          clearInterval(chainIntervalId);
          api.log("playChainEffect: unable to create chain points");
          return;
        }

        if (index >= points.length) {
          const markedMultiplier = 5;
          const damage = this.markedMobs.has(targetId) ? 25 * index * markedMultiplier : 25 * index;
          api.attemptApplyDamage({
            eId: this.playerId,
            hitEId: targetId,
            attemptedDmgAmt: damage,
            withItem: this.itemName
          });

          clearInterval(chainIntervalId);
          return;
        }

        const pos: Vec3 = [
          points[index][0],
          points[index][1] + 1,
          points[index][2],
        ];

        const dir = subtractVec(targetPos, pos);

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
        index++;
      } catch (e: any) {
        clearInterval(chainIntervalId);
        //api.log("playChainEffect", e.message, e.stack)
      }
    }, 100);
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

    setTimeout(
      () => this.attackNearest(nearestPos, hitted.add(nearest), remaining - 1),
      this.reachms
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

    setInterval(() => {
      try {
        this.attackNearest(firstTargetPos, hitted, chain)
      } catch (e: any) { //api.log("castFirstSpell", e.message, e.stack) 

      }
    }, this.reachms);
  }

  getMobsInSight(
    playerPos: Vec3,
    dir: Vec3,
    maxDistance: number,
    maxRadius: number = 2
  ): Types.MobId[] {
    const entities = api.getEntitiesInRect(
      playerPos.map(n => n - maxDistance),
      playerPos.map(n => n + maxDistance)
    );

    return entities.filter(id => {
      if (id === this.playerId) return false;

      const mobPos = api.getPosition(id);
      const toMob = subtractVec(mobPos, playerPos);
      const forwardDist = dot(toMob, dir);

      if (forwardDist < 0 || forwardDist > maxDistance) return false;

      const projected = dir.map(n => n * forwardDist) as Vec3;
      const lateral = subtractVec(toMob, projected);
      const lateralDist = Math.sqrt(dot(lateral, lateral));

      return lateralDist <= maxRadius;
    });
  }

  castSecondSpell(chargeTime: number): void {
    const playerPos = api.getPosition(this.playerId);
    const dir = normalize(api.getPlayerFacingInfo(this.playerId).dir ?? [0, 0, 1]);

    const point = this.calcPoint(chargeTime);
    const mobs = this.getMobsInSight(playerPos, dir, 20).splice(0, point);

    let intervalId: TimeoutId | null = null;

    for (const id of mobs) {
      if (intervalId) clearTimeout(intervalId)
      this.markedMobs.add(id);

      api.broadcastSound("hauntedHorrorImpact", 1, 1, {
        playerIdOrPos: id,
        maxHearDist: 50
      })

      api.applyEffect(id, `Weakness`, 10000, {
        inbuiltLevel: 2
      })

      api.applyEffect(id, `Slowness`, 10000, {
        inbuiltLevel: 2
      })

      api.updateEntityNodeMeshAttachment(
        id,
        "HeadMesh",
        "ParticleEmitter",
        {
          dir1: [0.2, 1, 0.2],
          dir2: [-0.2, -1, -0.2],
          emitRate: 200,
          width: 1,
          height: 1,
          depth: 1.5,
          texture: "soul_0",
          minLifeTime: 0.1,
          maxLifeTime: 0.5,
          minEmitPower: 1,
          maxEmitPower: 3,
          minSize: 0.5,
          maxSize: 1,
          gravity: [0, 10, 0],
          colorGradients: [
            { timeFraction: 0, minColor: [0, 0, 0, 1], maxColor: [0, 0, 0, 1] },
            { timeFraction: 2, minColor: [200, 0, 0, 1], maxColor: [105, 0, 0, 1] }
          ],
          velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }],
          blendMode: 4
        },
        [0, -0.8, -0.5]
      );

      intervalId = setTimeout(() => {
        this.markedMobs.delete(id);
      }, 100000)
    }
  }
}