import { randomOnePick } from "../../utils/math";
import { S } from "../../core/scheduler";
import type * as Types from "@bloxd";

const engagingMob = new Map<Types.PlayerId, Types.MobId>();

S.run(function loop() {
  for (const [pId, mId] of engagingMob.entries()) {
    if (!api.getMobIds().includes(mId)) {
      engagingMob.delete(pId);
      continue;
    }
    const mobType = api.getEntityType(mId);
    const meta = api.getMobSetting(mId, "metaInfo") || "";
    if (meta === "igniath") return;

    const metaParts = meta.split("/");

    const [mx, my, mz] = api.getPosition(pId);
    const [px, py, pz] = api.getPosition(mId);

    const dx = px - mx;
    const dy = py - my;
    const dz = pz - mz;

    const distanceSquared = dx * dx + dy * dy + dz * dz;

    if (mobType.includes("Skeleton")) {
      if (distanceSquared <= 25) {
        api.setMobSetting(mId, "attackItemName", "Iron Axe");
        api.setMobSetting(mId, "heldItemName", "Iron Axe");
        api.setMobSetting(mId, "attackRadius", 5);
      } else {
        api.setMobSetting(mId, "attackItemName", "Arrow");
        api.setMobSetting(mId, "heldItemName", "Stone Bow");
        api.setMobSetting(mId, "attackRadius", 20);
      }
    };

    //if(metaParts.includes(""))
  }
  S.run(loop, 5);
})

export function handlePlayerAttackingMob(playerId: Types.PlayerId, mobId: Types.MobId, damageDealt: number, withItem: Types.ItemName){
  const meta = api.getMobSetting(mobId, "metaInfo") || "";
  const metaParts = meta.split("/");
  const [x, y, z] = api.getPosition(mobId);

  engagingMob.set(playerId, mobId);
  S.stop("engaging" + playerId);
  S.run(() => {
    engagingMob.delete(playerId);
  }, 300, "engaging" + playerId);

  if (metaParts.includes("1UP") && !metaParts.includes("1UP_USED") && api.getHealth(mobId) <= 100) {
    api.setHealth(mobId, 1000, undefined, true);
    api.setMobSetting(mobId, "metaInfo", meta + "/1UP_USED");
  }

  if (metaParts.includes("Vengeance")) {
    //@ts-ignore
    const reflect = Math.floor(damageDealt * 0.1);
    api.applyHealthChange(playerId, -reflect);
  }

  if (metaParts.includes("Bulwark")) {
    return damageDealt / 2;
  }

  if (metaParts.includes("Webber")) {
    const pos = api.getPosition(playerId);
    api.setBlock(pos[0], pos[1], pos[2], "Cobweb");
  }

  if (metaParts.includes("Sticky")) {
    //@ts-ignore
    const randomSlot = Math.floor(Math.random() * 9);
    api.setSelectedInventorySlotI(playerId, randomSlot);
  }

  if (metaParts.includes("Ender")) {
    const playerPos = api.getPosition(playerId);
    const facing = api.getPlayerFacingInfo(playerId);
    const dir = facing.dir;
    const targetX = playerPos[0] - dir[0] * 1.5;
    const targetY = playerPos[1];
    const targetZ = playerPos[2] - dir[2] * 1.5;
    api.playSound(playerId, "glass2", 1, 1);
    api.setPosition(mobId, [targetX, targetY, targetZ]);
  }

  api.playParticleEffect({
    dir1: [-1, -1, -1],
    dir2: [1, 1, 1],
    pos1: [x + 0.5, y + 1.5, z + 0.5],
    pos2: [x - 0.5, y + 2.5, z - 0.5],
    texture: "heart",
    minLifeTime: 0.2,
    maxLifeTime: 0.6,
    minEmitPower: 1,
    maxEmitPower: 1,
    minSize: 0.25,
    maxSize: 0.35,
    manualEmitCount: damageDealt,
    gravity: [0, 0, 0],
    colorGradients: [
      {
        timeFraction: 0,
        minColor: [220, 60, 20, 1],
        maxColor: [255, 0, 0, 1],
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
    hideDist: 100
  })
};

export function handleMobAttackingPlayer(attackingMob: Types.MobId, damagedPlayer: Types.PlayerId, damageDealt: number, withItem: Types.ItemName){
  const meta = api.getMobSetting(attackingMob, "metaInfo") || "";
  const metaParts = meta.split("/");
  const itemname = api.getHeldItem(damagedPlayer)?.name;
  const weapon = api.getMobSetting(attackingMob, "attackItemName");
  const mobType = api.getEntityType(attackingMob);

  if (!metaParts || !mobType || !weapon) return;

  if (metaParts.includes("Berserk")) {
    api.applyHealthChange(attackingMob, -10);
    //@ts-ignore
    return Math.floor(damageDealt * 2);
  }

  if (metaParts.includes("Lifesteal")) {
    //@ts-ignore
    const heal = Math.floor(damageDealt * 0.5);
    api.applyHealthChange(attackingMob, heal);
  }

  if (metaParts.includes("Blastoff")) {
    api.applyImpulse(damagedPlayer, 0, 10, 0);
  }

  if (metaParts.includes("Gravity")) {
    api.setClientOption(damagedPlayer, "jumpAmount", 4);
    S.stop("gravity" + damagedPlayer);
    S.run(() => {
      api.setClientOption(damagedPlayer, "jumpAmount", 8);
    }, 200, "gravity" + damagedPlayer);
  }

  if (metaParts.includes("Drain")) {
    const effects = api.getEffects(damagedPlayer);
    const badEffects = ["Poisoned", "Slowness", "Weakness", "Brain Rot"];

    const randomEffect = randomOnePick(badEffects);

    if (!effects || effects.length === 0) {
      api.applyEffect(damagedPlayer, randomEffect, 5000, { inbuiltLevel: 1 })
    } else {
      let replaced = false;

      effects.forEach(effect => {
        if (!badEffects.includes(effect)) {
          api.removeEffect(damagedPlayer, effect);
          replaced = true;
        }
      });

      if (replaced) {
        api.applyEffect(damagedPlayer, randomEffect, 5000, { inbuiltLevel: 1 })
      }
    }
  }
}
