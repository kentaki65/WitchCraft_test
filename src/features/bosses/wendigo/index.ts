import { S } from "../../../core/scheduler";

const playerToMobMap = new Map();
const WendigoHearts = {};

function particleRegular(eId){
  try{
    api.updateEntityNodeMeshAttachment(
      eId,
      "HeadMesh",
      "ParticleEmitter",
      {
        dir1: [0.2, 1, 0.2],
        dir2: [-0.2, -1, -0.2],
        emitRate: 200,
        manualEmitCount: 200,
        width: 2,
        height: 2,
        depth: 2.5,
        texture: "drift",
        minLifeTime: 0.5,
        maxLifeTime: 1,
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
  }catch(e){
    api.log(e.message);
  }
};

function getMobByPlayer(playerId) {
  return playerToMobMap.get(playerId);
}

S.run(function loop(){
  for(const [pId, mId] of playerToMobMap.entries()){
    if(!api.getMobIds().includes(mId)){
      playerToMobMap.delete(pId);
      continue;
    }
    const baseTag = `wendigoAttack_${mId}_${pId}`;
    attack(mId, pId, baseTag);
  }
  S.run(loop, 100);
})

function attack(mobId, playerId, baseTag) {
  if (!api.getMobIds().includes(mobId)) return;
  try {
    const options = [1, 2, 3, 4];

    const pattern = options[Math.floor(Math.random() * options.length)];
    if (pattern === 1) {
      rushAttack(playerId, mobId, baseTag);
    } else if (pattern === 2) {
      blindnessAttack(playerId, mobId, baseTag);
    }
  } catch (e) {
    api.log(e.message);
  }
}

function morphAnimetion(playerId, mobId) {
  if (!api.getMobIds().includes(mobId)) return;
  try{
    particleRegular(mobId);
    api.setMobSetting(mobId, "metaInfo", "applied")
    api.playSound(playerId, "ZombieGrunt2", 1, 0.5);
    const morphTag = `morph_after_${mobId}_${playerId}`;
    S.run(() => {
      if (!api.getMobIds().includes(mobId)) return;
      const mobPos = api.getPosition(mobId);
      api.killLifeform(mobId);

      const newMobId = api.attemptSpawnMob("Draugr Reaver", ...mobPos);
      if (!newMobId) return;
      playerToMobMap.set(playerId, newMobId);

      api.setMobSetting(newMobId, "heldItemName", "Diamond Sword");
      api.setMobSetting(newMobId, "attackItemName", "Diamond Sword");
      api.setMobSetting(newMobId, "attackInterval", 2000);
      api.setMobSetting(newMobId, "attackSound", "sweep6");
      api.setMobSetting(newMobId, "attackRadius", 5);
      api.setMobSetting(newMobId, "attackDamage", 25);
      api.setHealth(newMobId, 200, undefined, true);
      api.setMobSetting(newMobId, "name", "WENDIGO");
      
      particleRegular(newMobId);
    }, 40, morphTag);
  }catch(e){api.log(e.message)}
}

function rushAttack(playerId, mobId, baseTag){
  if (!api.getMobIds().includes(mobId)) return;

  const pp = api.getPosition(playerId);
  const mp = api.getPosition(mobId);
  if(!pp || !mp)return;

  const [px, py, pz] = pp;
  const [mx, my, mz] = mp;

  let dist = Math.hypot(px - mx, py - my, pz - mz);
  if (!dist) dist = 0.0001;

  let dir = [(px - mx) / dist, (py - my) / dist, (pz - mz) / dist];
  let power = Math.min(dist * 5, 15);
  api.applyImpulse(mobId, ...dir.map(v => v * power));
  
  const hitTag = `${baseTag}_phase1_hit_${Date.now()}`;
  S.run(() => {
    if (!api.getMobIds().includes(mobId)) return;

    const pp2 = api.getPosition(playerId);
    const mp2 = api.getPosition(mobId);
    if(!pp2 || !mp2)return;

    const [px2, py2, pz2] = pp2;
    const [mx2, my2, mz2] = mp2;

    const dist2 = Math.hypot(px2 - mx2, py2 - my2, pz2 - mz2);

    if (dist2 <= 5) {
      api.removeEffect(mobId, "Invisible");
      api.applyImpulse(playerId, 0, 20, 0);

      const fallTag = `${baseTag}_phase1_fall_${Date.now()}`;
      S.run(()=> {
        api.setVelocity(playerId, 0, -30, 0);
      }, 10, fallTag);

    }
  }, 4, hitTag);
};

function blindnessAttack(playerId, mobId, baseTag){
  api.playSound(playerId, "glass1", 1, 0.5);
  api.applyEffect(playerId, "Blindness", 1000, {inbuiltLevel: 1}); 
  //エフェクトから
  api.applyEffect(playerId, "Slowness", 1000, {inbuiltLevel: 2});

  const tpTag = `${baseTag}_tp_${Date.now()}`;
  S.run(()=> {
    if (!api.getMobIds().includes(mobId)) return;
    const pos = api.getPosition(playerId);
    if(!pos)return;

    const dir = api.getPlayerFacingInfo(playerId).dir;
    const behind = [
      pos[0] - dir[0] * 2,
      pos[1],
      pos[2] - dir[2] * 2
    ];

    try{
      api.setMobSetting(mobId, "attackImpulse", 10);
      api.setPosition(mobId, behind);

      S.run(() => {
        if (!api.getMobIds().includes(mobId)) return;
        api.setMobSetting(mobId, "attackImpulse", 1), 4, `${baseTag}_tp_reset_${Date.now()}`
      });
    }catch(e){ api.log(e.message); }
  }, 20, tpTag);
}

onPlayerDamagingMob = (playerId, mobId, damageDealt, withItem) => {
  try{
    const type = api.getEntityType(mobId);
    const meta = api.getMobSetting(mobId, "metaInfo");
    if(type === "Cow" && !meta?.includes("applied")){
      progressChecker(playerId, "nightmare");
      morphAnimetion(playerId, mobId);
      api.setTargetedPlayerSettingForEveryone(mobId, "canAttack", false, true);
    }
  }catch(e){
    api.log(e.message)
  }
};

onPlayerKilledMob = (playerId, mobId, damageDealt, withItem) => {
  const ID = getMobByPlayer(playerId);
  const pos = api.getPosition(mobId);

  if (ID && ID === mobId && pos) {
    if (!Array.isArray(WendigoHearts[playerId])) WendigoHearts[playerId] = [];
    progressChecker(playerId, "beyond_the_nightmare");
    const [cx, cy, cz] = pos;
    const a = 2;
    const R = a / Math.sqrt(3);
    const A = [cx + R, cy, cz];
    const B = [cx - a / (2 * Math.sqrt(3)), cy, cz + a / 2];
    const C = [cx - a / (2 * Math.sqrt(3)), cy, cz - a / 2];

    const spawnPos = [A, B, C];

    for (let i = 0; i < spawnPos.length; i++) {
      const [x, y, z] = spawnPos[i];
      const id = api.attemptSpawnMob("Draugr Skeleton", x, y, z);
      if (id) {
        WendigoHearts[playerId].push(id);
        S.run(() => {
          try{
            api.setMobSetting(id, "name", "  ???の心臓  ");
            api.setMobSetting(id, "attackItemName", null);
            api.setHealth(id, 100, undefined, true);
            api.setTargetedPlayerSettingForEveryone(id, "meshScaling", {
              HeadMesh: [0, 0, 0],
              ArmLeftMesh: [0, 0, 0],
              ArmRightMesh: [0, 0, 0],
              LegLeftMesh: [5, 1, 5],
              LegRightMesh: [0, 0, 0],
              TorsoNode: [0, 0, 0]
            });
          }catch(e){ api.log(e.message); }
        }, 10, `wendigo_heart_init_${id}_${Date.now()}`);
        S.run(() => {
          try {
            if (api.getMobIds().includes(id)) {
              progressChecker(playerId, "nightmareIsNotOverYet");
              morphAnimetion(playerId, id);
            }
          }catch(e){ api.log(e.message); }
        }, 300, `wendigo_heart_morph_${id}_${Date.now()}`);
      }
    }
    return;
  }

  // ▼ 追加：心臓が壊されたとき
  const hearts = WendigoHearts[playerId];
  if (!Array.isArray(hearts)) return;

  const index = hearts.indexOf(mobId);
  if (index === -1) return;

  // ▼ 配列から削除
  hearts.splice(index, 1);

  api.createItemDrop(...pos, "Diamond", 3, false, {
    customDisplayName: "ウェンドライト",
    customDescription: "凍てつく意思が結晶化した、歪んだ鉱石",
    customAttributes: {
      isWendlite: true,
      enchantmentTier: "Tier 5",
    }
  }, 100000);

  api.createItemDrop(...pos, "Moonstone Fragment",  Math.floor(Math.random() * 5) + 1, false, {
    customDisplayName: "ウェンド フラグメント",
    customDescription: "砕かれた欠片の中でなお、飢えた気配が蠢いている",
    customAttributes: {
      isWendFragment: true,
      enchantmentTier: "Tier 5",
    }
  }, 100000);

  api.createItemDrop(...pos, "Golem Eye",  1, false, {
    customDisplayName: "ウェンド コア",
    customDescription: "触れた者の内側まで侵食する、ウェンディゴのコア",
    customAttributes: {
      isWendCore: true,
      enchantmentTier: "Tier 5",
    }
  }, 100000);
  return "preventDrop";
};


class Wendigo {
  constructor(){
    
  }
}