import type * as Types from "@bloxd";
import { setTimeout, setInterval, clearInterval } from "@plugins/helpers";
import { createTickInterval } from "../../../utils/loop";
import { divideVec, getOffsetPosition, normalize, subtractVec } from "../../../utils/math";
import { MagicSystem, type RodSettings } from "../magicSystem";
import { MobListener } from "../../../core/helpers/eventListener";
import type { Vec2, Vec3 } from "../../../core/types";
import { world } from "../../../core/helpers/worldGenerator";

export enum FrostRodSkillNames {
  iceAquarium = "アイス・アクアリウム",
  iceSwordBlizzard = "氷剣吹雪",
  iceRoad = "アイス・ロード",
  nightOfFallingIce = "氷塊の降る夜"
}

// ### 凍てつく吹雪の杖
// -アイス・アクアリウム　近くのエンティティ3体を氷で閉じ込める。内部を水で満たす。数秒経ったら消える。 ◯
// - 氷剣吹雪　氷の剣のような形をしたものを前方へ飛ばす 
// - アイス・ロード　自身の後ろに氷の道を形成し、素早く滑ることで後方へ脱出する。
// - 氷塊の降る夜　前方の広い範囲に大きな氷の塊を降らせる　落ちてくる速度はゆっくりだが、威力が大変高い。◯


//パッシブとして寒いところでもダメージを受けないなど

export class FrostRod extends MagicSystem<FrostRodSkillNames> {
  protected override itemName: string = "Frost Rod";
  protected override rodSettings: Record<FrostRodSkillNames, RodSettings> = {
    //押してるときに発動させる
    [FrostRodSkillNames.iceAquarium]: {
      useThirdParsonView: false,
      canCharge: true,
      minCharge: 500
    },
    [FrostRodSkillNames.iceSwordBlizzard]: {
      useThirdParsonView: false,
      canCharge: true,
      minCharge: 1000
    },
    [FrostRodSkillNames.iceRoad]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 1000
    },
    //押してるときに降らせる
    [FrostRodSkillNames.nightOfFallingIce]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 100
    },
  };

  protected override skills: readonly FrostRodSkillNames[] = [
    FrostRodSkillNames.iceAquarium,
    FrostRodSkillNames.iceSwordBlizzard,
    FrostRodSkillNames.iceRoad,
    FrostRodSkillNames.nightOfFallingIce
  ];

  protected override castSpell(mode: FrostRodSkillNames, chargeTime: number): void {
    switch (mode) {
      case FrostRodSkillNames.iceRoad: {
        this.castFirstSpell();
        break;
      }
      case FrostRodSkillNames.iceSwordBlizzard: {
        this.castSecondSpell()
        break;
      }
    }
  }

  private castFirstSpell() {
    const dir = normalize(api.getPlayerFacingInfo(this.playerId).dir);
    const minPos = api.getPosition(this.playerId);
    if (!dir) return;

    const reverseDir: Vec3 = [-dir[0], -dir[1], -dir[2]];
    const maxPos = getOffsetPosition(reverseDir, minPos, 10).map(Math.floor) as Vec3;

    const diff = subtractVec(maxPos, minPos);
    const distance = Math.ceil(Math.hypot(diff[0], diff[2]));

    if (distance === 0) return [];

    const direction: Vec3 = [diff[0] / distance, 0, diff[2] / distance];
    const perpendicular: Vec3 = [-direction[2], 0, direction[0]];

    const positions: Vec3[] = [];

    for (let i = 0; i <= distance; i++) {
      const centerX = minPos[0] + direction[0] * i;
      const centerZ = minPos[2] + direction[2] * i;

      for (let offset = -1; offset <= 1; offset++) {
        positions.push([
          Math.round(centerX + perpendicular[0] * offset),
          Math.round(minPos[1]),
          Math.round(centerZ + perpendicular[2] * offset)
        ]);
      }
    }

    const minX = Math.min(...positions.map(p => p[0]));
    const minZ = Math.min(...positions.map(p => p[2]));
    const maxX = Math.max(...positions.map(p => p[0]));
    const maxZ = Math.max(...positions.map(p => p[2]));

    const sizeZ = maxZ - minZ + 1;

    world.async.getHeightMap({
      min: [minX, minZ],
      max: [maxX, maxZ]
    }).then(height => {
      const roadPositions: Vec3[] = positions.map(([x, y, z]) => {
        const index = (x - minX) * sizeZ + (z - minZ);
        const groundY = height[index];

        if (groundY === undefined) {
          throw new Error(`HeightMap index out of bounds: ${index}, position: ${x}, ${z}, length: ${height.length}`);
        }

        return [x, groundY, z];
      });

      for (const pos of roadPositions) {
        api.setBlock(pos, "Melting Ice");
      }

      setTimeout(() => {
        for (const pos of roadPositions) {
          api.setBlock(pos, api.blockIdToBlockName(world.getBlockId(pos)));
        }
      }, 10000)

      const impulse = 30;
      api.setVelocity(
        this.playerId,
        reverseDir[0] * impulse,
        0,
        reverseDir[2] * impulse
      );

    }).catch((reason) => {
      if (reason instanceof Error) {
        api.log(reason.message, reason.stack)
      }
    });

    return;
  }

  private castSecondSpell() {
    const { dir, camPos } = api.getPlayerFacingInfo(this.playerId);

    const normalizedDir = normalize(dir);
    if (!normalizedDir) return;

    const id = api.attemptCreateMeshEntity("BloxdBlock", {
      blockName: "Diamond Spear",
      size: 0.5
    });
    if (!id) return;

    //TODO 槍の向きを視線方向と合わせる
    //api.setEntityRotation(id, 0, 0, 0);
    
    const targetPos = getOffsetPosition(normalizedDir, camPos, 100);
    const points = divideVec(camPos, targetPos, 20);
    if (!points) return;

    api.playSound(this.playerId, "bow", 1, 1);

    let count = 0;
    let velocityY = 0;
    let prevPos: Vec3 | undefined;

    const gravity = 0.08;

    const intervalId = setInterval(() => {
      if (points.length <= count) {
        api.deleteEntity(id);
        clearInterval(intervalId);
        return;
      }

      const basePos = points[count];
      if (!basePos) return;

      velocityY -= gravity;

      const pos: Vec3 = [
        basePos[0],
        basePos[1] + velocityY * count,
        basePos[2]
      ];

      api.setPosition(id, pos);

      if (prevPos) {
        const nearMobs = api.getEntitiesInRect(pos.map(val => val - 2), pos.map(val => val + 2));
        for (const mob of nearMobs) {
          const mobType = api.getEntityType(mob);
          if (mobType === "Mesh") continue;

          api.attemptApplyDamage({
            eId: this.playerId,
            hitEId: mob,
            attemptedDmgAmt: 40,
            withItem: this.itemName
          });

          api.deleteEntity(id);
          clearInterval(intervalId);
          return;
        }
      }

      prevPos = pos;
      count++;
    }, 1000, this.playerId);
  }

  private frozenMobs = new Set<Types.MobId>();
  private onIceAquariumCharging = createTickInterval(10, () => {
    const { dir, camPos } = api.getPlayerFacingInfo(this.playerId);

    const normalizedDir = normalize(dir);
    if (!normalizedDir) return;

    const offset = 1;
    const px = camPos[0] + normalizedDir[0] * offset;
    const py = camPos[1] + normalizedDir[1] * offset;
    const pz = camPos[2] + normalizedDir[2] * offset;

    const mobs = this.getMobsInSight(camPos, normalizedDir, 5);
    for (const mob of mobs) {
      if (this.frozenMobs.has(mob)) continue;
      this.frozenMobs.add(mob);

      const mobType = api.getEntityName(mob);
      const friendlyMobsName = new Set(["Cow", "Pig", "Sheep"]);

      const node = friendlyMobsName.has(mobType) ? "HeadMesh" : "TorsoNode";
      const offset: Vec3 = friendlyMobsName.has(mobType) ? [-1, 0, 0] : [0, 0, 0]

      api.applyEffect(mob, "Frozen", 10000, {});
      api.updateEntityNodeMeshAttachment(mob, node, "BloxdBlock", {
        blockName: "Melting Ice",
        size: [1, 2, 1]
      }, offset);

      const listener = new MobListener(mob);
      listener.addEventListener("mobWasDamagedByPlayer", e => {
        if (!api.checkValid(mob)) return;

        const mPos = api.getPosition(mob);
        api.broadcastSound(`glass1`, 1, 1, {
          playerIdOrPos: mob, maxHearDist: 20
        })
        api.attemptApplyDamage({ eId: this.playerId, hitEId: mob, attemptedDmgAmt: 500, withItem: this.itemName });
        api.playParticleEffect({
          dir1: [-1, -1, -1],
          dir2: [1, 1, 1],
          pos1: mPos,
          pos2: [mPos[0], mPos[1] - 2.5, mPos[2]],
          texture: "generic_2",
          minLifeTime: 0.2,
          maxLifeTime: 0.5,
          minEmitPower: 1.5,
          maxEmitPower: 8,
          minSize: 0.6,
          maxSize: 0.8,
          manualEmitCount: 25,
          gravity: [0, -25, 0],
          colorGradients: [
            {
              timeFraction: 0,
              minColor: [255, 255, 255, 1],
              maxColor: [227, 227, 227, 1],
            },
            {
              timeFraction: 0.4,
              minColor: [196, 48, 40, 1],
              maxColor: [155, 36, 33, 1],
            },
            {
              timeFraction: 1,
              minColor: [196, 48, 40, 1],
              maxColor: [155, 36, 33, 1],
            },
          ],
          velocityGradients: [
            {
              timeFraction: 0,
              factor: 2,
              factor2: 2,
            },
            {
              timeFraction: 1,
              factor: 0.5,
              factor2: 0.5,
            },
          ],
          blendMode: 1,
          hideDist: 120,
        });

        api.updateEntityNodeMeshAttachment(mob, "TorsoNode", null);
      }, { once: true });

      setTimeout(() => {
        this.frozenMobs.delete(mob);
        listener.destroy();

        if (api.checkValid(mob)) {
          api.updateEntityNodeMeshAttachment(mob, "TorsoNode", null);
          api.broadcastSound(`glass1`, 1, 1, {
            playerIdOrPos: mob, maxHearDist: 20
          })
        }
      }, 10000)
    }

    api.playParticleEffect({
      pos1: [px + 0.5, py + 0.5, pz + 0.5],
      pos2: [px - 0.5, py - 0.5, pz - 0.5],
      dir1: [dir[0] - 0.2, dir[1] - 0.2, dir[2] - 0.2],
      dir2: [dir[0] + 0.2, dir[1] + 0.2, dir[2] + 0.2],
      texture: "glint",
      minLifeTime: 0.4,
      maxLifeTime: 0.8,
      minEmitPower: 5,
      maxEmitPower: 10,
      minSize: 0.3,
      maxSize: 0.5,
      manualEmitCount: 25,
      gravity: [0, -6, 0],
      colorGradients: [
        { timeFraction: 0, minColor: [180, 220, 255, 1], maxColor: [255, 255, 255, 1] },
        { timeFraction: 1, minColor: [150, 200, 255, 0], maxColor: [200, 230, 255, 0] },
      ],
      velocityGradients: [
        { timeFraction: 0, factor: 0.8, factor2: 1.2 },
      ],
      blendMode: 1,
      hideDist: 100
    });
  })

  private onNightOfFallingIceCharging = createTickInterval(10, () => {
    const { dir, camPos: [cx, cy, cz] } = api.getPlayerFacingInfo(this.playerId);

    const vec = normalize(dir);
    if (!vec) return;

    const distance = 10;
    const radius = 10;

    const center: Vec3 = [
      cx + vec[0] * distance,
      cy + vec[1] * distance,
      cz + vec[2] * distance
    ];

    const xz: Vec2 = [center[0], center[2]];

    const minX = xz[0] - radius;
    const maxX = xz[0] + radius;
    const minZ = xz[1] - radius;
    const maxZ = xz[1] + radius;

    const x = minX + Math.random() * (maxX - minX);
    const z = minZ + Math.random() * (maxZ - minZ);
    const y = center[1] + radius;

    const meshId = api.attemptCreateMeshEntity("BloxdBlock", {
      blockName: "Melting Ice",
      size: [1, 2, 1]
    });

    const throwableId = api.attemptCreateThrowable(this.playerId, "Iceball", [x, y, z], [0, -1, 0]);

    if (meshId && throwableId) {
      api.addFollowingEntityToPlayer(throwableId, meshId, [0, -1, 0]);
    }
  })

  protected override onChargeTick(chargeTime: number): void {
    switch (this.currentMode) {
      case FrostRodSkillNames.iceAquarium:
        this.onIceAquariumCharging();
        break;
      case FrostRodSkillNames.nightOfFallingIce:
        this.onNightOfFallingIceCharging();
        break;
    }
  }
}