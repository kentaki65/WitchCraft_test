S={t:{},g:{},c:0,o:0,a:0,d:{get 1(){let t=S.t[S.c],e=t[S.a],c=S.g[e[1]];[e[0],S=>S][+(e[2]<c)](),S.d[+(++S.a<t.length)]}},run(t,e,c){let d=S.c-~e-1,g=[t,["_def_",c][+!!c],S.o++],l=S.t[d]=[[],S.t[d]][+!!S.t[d]];l[l.length]=g},stop(t){S.g[t]=S.o++}}
tick = ()=>{S.d[+!!S.t[S.c]],delete S.t[S.c++],S.a=0};
const Igniaths = new Map();

class Igniath {
  constructor(playerId, pos){
    if(Igniaths.has(playerId)){
      throw new Error("召喚済み");
    }

    this.ownerId = playerId;
    this.mobId = null;

    const mobId = api.attemptSpawnMob("Frost Skeleton", ...pos, { name: "Igniath" });
    if(mobId){
      api.setMobSetting(mobId, "metaInfo", "igniath");
      this.mobId = mobId;
    }else{
      throw new Error("[Log] スポーン出来ませんでした");
    }

    this.enchanmentments = ["Damage", "Quick", "Protection"];
    this.initHealth = 2000;
    this.state = {
      destroyed: false,
      phase: 1,
      count: 0,
      busy: false,
      mode: "idle",
      globalCooldown: 0,
      globalInterval: 20,
      cooldowns: {
        dash: 0,
        fireball: 0,
        bind: 0,
        multiDash: 0 // ←追加
      },
      flags: {
        givenProtection: false,
        comboCounter: false,
        frozenFlag: false,
        chargeMiddleAttack: false,
      }
    }

    this.registerLoop();
    S.run(() => this.onSpawn(), 5);
    Igniaths.set(this.ownerId, this);
  }
  
  setScale(scale){
    api.setTargetedPlayerSettingForEveryone(this.mobId, "meshScaling", scale);
  }

  setAttachItem(name){
    api.setMobSetting(this.mobId, "heldItemName", name);
    api.setMobSetting(this.mobId, "attackItemName", name);
  }

  setShield(clear = false, isInvisible = false){
    if(clear){
      api.updateEntityNodeMeshAttachment(this.mobId, "ArmLeftMesh", null);
      api.setTargetedPlayerSettingForEveryone(this.mobId, "canAttack", true);
      return;
    }
    api.updateEntityNodeMeshAttachment(
      this.mobId, "ArmLeftMesh", "BloxdBlock", 
      { blockName: "Pear Door", size: 0.75, meshOffset: [0, 0, 0] }, 
      [0.15, -0.75, 0.15], [0,0,0]
    );
    if(isInvisible)api.setTargetedPlayerSettingForEveryone(this.mobId, "canAttack", false);
  }

  sendBuffMessage(name, text){
    api.sendMessage(this.ownerId, [
      { str: "Igniath", style: { color: "#65BBE9", fontStyle: "italic" }},
      { str: "は自分自身で", style: { fontStyle: "italic" }},
      { str: name, style: { color: "red", fontStyle: "italic" }},
      { str: `を付与し、${text}`, style: { fontStyle: "italic" }}
    ]);
  }

  applyChangePhase(toPhase){
    api.setTargetedPlayerSettingForEveryone(this.mobId, "canAttack", false);
    api.setHealth(this.mobId, this.initHealth, undefined, true);

    this.state.phase = toPhase;
    
    S.run(() => {
      if(!this.checkValid(this.mobId)) return;
      const [x, y, z] = api.getPosition(this.mobId);
      api.applyEffect(this.mobId, "Frozen", 3000, {});
      api.animateEntity(this.mobId, {
        loop: false,
        animationDurationMs: 3000,
        nodeAnimations: {
          ArmRightMesh: {
            timeline: [
              {
                timeFraction: 0,
                rotation: {
                  lerpMode: "catmull-rom-spline",
                  point: [0, 0, 0]
                }
              },
              {
                timeFraction: 0.2,
                rotation: {
                  lerpMode: "catmull-rom-spline",
                  // 胸に手-を当てる
                  point: [-0.6, 0.8, -0.4]
                }
              },
              {
                timeFraction: 0.4,
                rotation: {
                  lerpMode: "catmull-rom-spline",
                  // 溜め
                  point: [-0.7, 0.9, -0.3]
                }
              },
              {
                timeFraction: 0.6,
                rotation: {
                  lerpMode: "catmull-rom-spline",
                  // 前（胸側）に振り上げる ←ここが重要
                  point: [-2.2, 0.2, -0.6]
                }
              },
              {
                timeFraction: 1,
                rotation: {
                  lerpMode: "catmull-rom-spline",
                  point: [-2.0, 0.1, -0.5]
                }
              }
            ]
          }
        }
      });
      api.playParticleEffect({
        dir1: [1, 1, 1],
        dir2: [-1, -1, -1],
        pos1: [x, y + 1, z],
        pos2: [x, y + 1, z],
        texture: "critical_hit",
        minLifeTime: 2.5,
        maxLifeTime: 2.5,
        minEmitPower: 2,
        maxEmitPower: 2,
        minSize: 0.25,
        maxSize: 0.35,
        manualEmitCount: 200,
        gravity: [0, 0, 0],
        colorGradients: [
          {
            timeFraction: 0,
            minColor: [0, 0, 255, 1], //rgba
            maxColor: [0, 0, 255, 1],
          },
          {
            timeFraction: 1,
            minColor: [225, 0, 0, 1],
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
      })
      api.updateEntityNodeMeshAttachment(
        this.mobId,
        "HeadMesh",
        "ParticleEmitter",
        {
          dir1: [-0.3, 0.2, -0.3],
          dir2: [0.3, 0.8, 0.3],

          emitRate: 120,
          width: 5,
          height: 5,
          depth: 5,
          texture: "soul_0",
          minLifeTime: 0.4,
          maxLifeTime: 0.8,
          minEmitPower: 0.2,
          maxEmitPower: 0.6,
          minSize: 0.2,
          maxSize: 0.5,
          gravity: [0, 1.5, 0],
          colorGradients: [
            {
              timeFraction: 0,
              minColor: [120, 200, 255, 1], // 明るいシアン寄り
              maxColor: [180, 240, 255, 1],
            },
            {
              timeFraction: 0.4,
              minColor: [80, 120, 255, 0.8], // 青のコア
              maxColor: [120, 160, 255, 0.8],
            },
            {
              timeFraction: 1,
              minColor: [0, 0, 255, 0], // 消え際
              maxColor: [0, 0, 255, 0],
            }
          ],
          velocityGradients: [
            { timeFraction: 0, factor: 0.3, factor2: 0.5 }
          ],
          blendMode: 1
        },
        [0, 0, 0]
      );
      S.run(() => {
        api.setTargetedPlayerSettingForEveryone(this.mobId, "canAttack", true);
      }, 80);
    }, 20);
  }

  applyBuffLoop(){
    const loop = () => {
      if (!this.checkValid(this.mobId)) return;

      if (this.state.phase < 2) {
        S.run(loop, 20);
        return;
      }

      if (Math.random() < 0.15) {
        this.applyRandomBuff();
      }

      S.run(loop, 40);
    };

    loop();
  }

  applyRandomBuff(){
    const effect = this.enchanmentments[
      Math.floor(Math.random() * this.enchanmentments.length)
    ];

    const meta = api.getMobSetting(this.mobId, "metaInfo") || "";

    if (meta.includes(effect)) return; // 重複防止
    api.setMobSetting(this.mobId, "metaInfo", `${meta}/${effect}`);

    const level = 2 * this.state.phase;

    switch(effect){
      case "Damage":
        api.applyEffect(this.mobId, "Damage", null, { inbuiltLevel: level });
        this.sendBuffMessage(`Damage ${this.state.phase === 2 ? "II" : "III"}`, "攻撃力が上昇した！");
        break;

      case "Quick":
        api.applyEffect(this.mobId, "Speed", null, { inbuiltLevel: level });
        api.setMobSetting(this.mobId, "attackInterval", 1000);

        this.sendBuffMessage(`Quick ${this.state.phase === 2 ? "II" : "III"}`, "攻撃速度と移動速度が上昇した！");
        break;

      case "Protection":
        this.givenProtection = true;
        api.applyEffect(this.mobId, "Damage Reduction", null, { inbuiltLevel: 1 });
        this.sendBuffMessage("Protection", "防御力が上昇した！");
        break;
    }
  }

  checkValid(id){
    return api.getMobIds().includes(id);
  }

  stanEffect(id) {
    api.applyEffect(id, "Frozen", 2000, {
      icon: "Weakness",
      displayName: "Fainting",
      inbuiltLevel: 10
    })
  }

  getNearest(range) {
    if(!this.checkValid(this.mobId))return;

    const entityPos = api.getPosition(this.mobId);

    let nearestPlayerId = null;
    let dir = [];
    let minDistanceSq = range * range;

    for (const playerId of api.getPlayerIds()) {
      const playerPos = api.getPosition(playerId);
      if (!playerPos) continue;

      const dx = playerPos[0] - entityPos[0];
      const dy = playerPos[1] - entityPos[1];
      const dz = playerPos[2] - entityPos[2];
      const distanceSq = dx*dx + dy*dy + dz*dz;

      if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        dir = [dx, dy, dz];
        nearestPlayerId = playerId;
      }
    }

    if (nearestPlayerId === null) return null;

    return {
      playerId: nearestPlayerId,
      dir,
      distance: Math.sqrt(minDistanceSq),
    };
  }

  dashTowardTarget(cb = () => {}) {
    if(!this.checkValid(this.mobId)) return;

    api.animateEntity(this.mobId, {
      loop: false,
      animationDurationMs: 2500,
      nodeAnimations: {
        TorsoNode: {
          timeline: [
            {
              timeFraction: 0,
              rotation: { lerpMode: "catmull-rom-spline", point: [-0.2, 0, 0] } // 溜め（後ろ）
            },
            {
              timeFraction: 0.2,
              rotation: { lerpMode: "catmull-rom-spline", point: [0.8, 0, 0] } // 一気に前傾
            }
          ]
        },
        HeadMesh: {
          timeline: [
            {
              timeFraction: 0,
              rotation: { lerpMode: "catmull-rom-spline", point: [0.1, 0, 0] }
            },
            {
              timeFraction: 0.2,
              rotation: { lerpMode: "catmull-rom-spline", point: [-0.5, 0, 0] } // 前に突っ込む
            }
          ]
        },
      ArmRightMesh: {
        timeline: [
          {
            timeFraction: 0,
            rotation: {
              lerpMode: "catmull-rom-spline",
              point: [-1.2, -0.8, -0.4] // 少し外に開く（Y,Z追加）
            }
          },
          {
            timeFraction: 0.2,
            rotation: {
              lerpMode: "catmull-rom-spline",
              point: [1.5, 0.6, -0.2] // 振り抜き
            }
          }
        ]
      },
      ArmLeftMesh: {
        timeline: [
          {
            timeFraction: 0,
            rotation: {
              lerpMode: "catmull-rom-spline",
              point: [0.8, -0.3, -0.5] // 後ろに引く
            }
          },
          {
            timeFraction: 0.2,
            rotation: {
              lerpMode: "catmull-rom-spline",
              point: [-0.6, 0.2, 0.2] // 少し戻す
            }
          }
        ]
      }}
    });

    const FINISH_TIME = 30 + 15; 

    S.run(() => {
      const nearest = this.getNearest(30);
      if(!nearest) {
        cb();
        return;
      }

      const { playerId } = nearest;
      const dist = nearest.distance;

      const [dx, , dz] = nearest.dir;
      const flatLen = Math.sqrt(dx*dx + dz*dz);

      const nx = flatLen > 0 ? dx / flatLen : 0;
      const nz = flatLen > 0 ? dz / flatLen : 0;

      if (dist <= 15) {
        api.applyImpulse(this.mobId, nx * 12, 0, nz * 12);

        S.run(() => {
          cb();
        }, 15);
      }

      else {
        api.applyImpulse(this.mobId, nx * 15, 20, nz * 15);

        this.checkUnder(playerId, () => {
          api.applyImpulse(playerId, 0, 20, 0);

          S.run(()=> {
            api.setVelocity(playerId, 0, -30, 0);
            this.stanEffect(playerId);

            cb();
          }, 10); 
        });
      }

    }, 30);
  }

  checkUnder(playerId, cb = () => {}) {
    let wasAir = false;

    const loop = () => {
      if (!this.checkValid(this.mobId)) return;

      const [mx, my, mz] = api.getPosition(this.mobId);
      const block = api.getBlock(mx, my - 1, mz);

      if (block === "Air") {
        wasAir = true;
      }

      if (wasAir && block !== "Air") {
        cb();
        return;
      }

      S.run(loop, 5);
    };

    loop();
  }

  shotBall(){
    if(!this.checkValid(this.mobId))return;

    const heldItem = this.state.phase === 1 ? "Fireball" : "Iceball";

    api.animateEntity(this.mobId, {
      "loop": false,
      "animationDurationMs": 3500,
      "nodeAnimations": {
        "ArmRightMesh": {
          "timeline": [
            {
              "timeFraction": 0,
              "rotation": {
                "lerpMode": "catmull-rom-spline",
                "point": [
                  0,
                  0,
                  0
                ]
              }
            },
            {
              "timeFraction": 0.1,
              "rotation": {
                "lerpMode": "catmull-rom-spline",
                "point": [
                  -2.33,
                  -0.7,
                  0.18
                ]
              }
            }
          ]
        }
      }
    });
    S.run(() => {
      if(!this.checkValid(this.mobId))return;

      const [, ry] = api.getEntityRotation(this.mobId);
      const dx = Math.sin(ry);
      const dz = Math.cos(ry);

      const lx = -dz, lz = dx;
      const rx = dz, rz = -dx;

      const offset = 2;

      let [x, y, z] = api.getPosition(this.mobId);
      y += 3;

      const center = [x, y + 2, z];
      const leftPos = [x + lx*offset, y + 2, z + lz*offset];
      const rightPos = [x + rx*offset, y + 2, z + rz*offset];

      const moreLeftPos = [x + lx*offset + 2, y + 2, z + lz*offset + 2];
      const moreRightPos = [x + rx*offset + 2, y + 2, z + rz*offset + 2];

      const nearest = this.getNearest(30);
      if (!nearest) return;

      let [px, py, pz] = api.getPosition(nearest.playerId);
      py--;

      const normalize = ([vx, vy, vz]) => {
        const len = Math.sqrt(vx*vx + vy*vy + vz*vz);
        return len > 0 ? [vx/len, vy/len, vz/len] : [0,0,0];
      };

      const spawnAndShoot = (pos, delay) => {
        S.run(() => {
          if(!this.checkValid(this.mobId))return;

          const nearest = this.getNearest(30);
          if (!nearest) return;

          let [px, py, pz] = api.getPosition(nearest.playerId);

          const dir = normalize([
            px - pos[0],
            py - pos[1],
            pz - pos[2]
          ]);

          const throwableId = api.attemptCreateThrowable(
            this.ownerId,
            heldItem,
            pos,
            dir,
            0,
            1.5
          );

          if (!throwableId) return;

          S.run(() => {
            const speed = 0.8;

            api.applyImpulse(
              throwableId,
              dir[0] * speed,
              dir[1] * speed,
              dir[2] * speed
            );
          }, 5);

        }, delay);
      };
      spawnAndShoot(center, 0);
      spawnAndShoot(leftPos, 10);
      spawnAndShoot(rightPos, 20);
      if(this.state.phase === 3){
        spawnAndShoot(moreLeftPos, 10);
        spawnAndShoot(moreRightPos, 20);
      }
    }, 20);
  }

  multiDashAttack(done = () => {}){
    if(!this.checkValid(this.mobId)) return;

    this.state.mode = "attacking";
    this.state.flags.chargeMiddleAttack = true;

    const dashCount = 3;

    const performDash = (remaining) => {
      if (remaining <= 0) {
        this.state.flags.chargeMiddleAttack = false;
        this.state.mode = "idle";
        this.state.globalCooldown = this.state.globalInterval;

        done(); 
        return;
      }

      this.dashTowardTarget(() => {
        const n = this.getNearest(5);
        if(n){
          api.attemptApplyDamage({
            eId: this.mobId,
            hitEId: n.playerId,
            attemptedDmgAmt: 3,
            withItem: "Diamond Sword",
            showCritParticles: true
          });
        }

        // ★完全に終わってから次へ
        performDash(remaining - 1);
      });
    };

    performDash(dashCount);
  }

  onSpawn(){
    this.setScale({
      TorsoNode: [2, 2, 3],
			HeadMesh: [0.7, 0.7, 0.7],
			ArmLeftMesh: [0.5, 0.5, 0.5],
			ArmRightMesh: [1.7, 1, 0.8],
			LegRightMesh: [0.1, 0.1, 0.1],
			LegLeftMesh: [0.1, 0.1, 0.1],
		});
    this.setAttachItem("Diamond Sword");
    this.setShield();
    
    api.setHealth(this.mobId, this.initHealth, undefined, true);

    api.setMobSetting(this.mobId, "attackRadius", 3);
    api.setMobSetting(this.mobId, "attackInterval", 500);
    api.setMobSetting(this.mobId, "attackSound", "sweep6");
    api.setMobSetting(this.mobId, "swingArmOnAttack", true);
    api.setMobSetting(this.mobId, "metaInfo", "igniath");
    api.setMobSetting(this.mobId, "name", "Igniath");

    api.setMobAiState(this.mobId, "chasing", { targetId: this.ownerId});

    api.updateEntityNodeMeshAttachment(
      this.mobId, "LegRightMesh", "BloxdBlock",
      { blockName: "Granite Bricks Slab", size: 10, meshOffset: [0, 0, 0] },
      [1, 0, -2.5], [200, 0, 0]
    );
    api.updateEntityNodeMeshAttachment(
      this.mobId,
      "HeadMesh",
      "ParticleEmitter",
      {
        dir1: [-0.3, 0.2, -0.3],
        dir2: [0.3, 0.8, 0.3],

        emitRate: 120,
        width: 5,
        height: 5,
        depth: 5,
        texture: "soul_0",
        minLifeTime: 0.4,
        maxLifeTime: 0.8,
        minEmitPower: 0.2,
        maxEmitPower: 0.6,
        minSize: 0.2,
        maxSize: 0.5,
        gravity: [0, 1.5, 0],
        colorGradients: [
          {
            timeFraction: 0,
            minColor: [255, 180, 0, 1],
            maxColor: [255, 220, 50, 1],
          },
          {
            timeFraction: 1,
            minColor: [255, 50, 0, 0],
            maxColor: [255, 0, 0, 0],
          }
        ],
        velocityGradients: [
          { timeFraction: 0, factor: 0.3, factor2: 0.5 }
        ],
        blendMode: 1
      },
      [0, 0, 0]
    );

    progressChecker(this.ownerId, "frozenInquisitor");
  }

  onDamaged(){
    const health = api.getHealth(this.mobId);

    if(health <= 1000){
      if(this.state.phase === 1){
        this.applyChangePhase(2);
        this.applyBuffLoop();        
      }else if(this.state.phase === 2){
        this.applyChangePhase(3);
      }
    };

    if(this.state.phase === 3 && health < 100){
      api.setTargetedPlayerSettingForEveryone(this.mobId, "overlayColour", "#FF0000");
      api.setTargetedPlayerSettingForEveryone(this.mobId, "canAttack", false);
      this.state.destroyed = true;
      this.onDeath();
    }
  }

  destroy(){
    if (!this.checkValid(this.mobId)) return;

    api.killLifeform(this.mobId);
    Igniaths.delete(this.ownerId);
  }

  onDeath(){
    api.animateEntity(this.mobId, {
      loop: false,
      animationDurationMs: 5000,
      nodeAnimations: {
        ArmRightMesh: {
          timeline: [
            {
              timeFraction: 0,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [0, 0, 0]
              }
            },
            {
              timeFraction: 0.16,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [-2.24, 0.19, -0.77]
              }
            },
            {
              timeFraction: 0.66,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [-2.24, 0.19, -0.77]
              }
            },
            {
              timeFraction: 0.83,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [-0.67, 0.19, -0.77]
              }
            },
            {
              timeFraction: 1,
              rotation: {
                lerpMode: "catmull-rom-spline",
                point: [0, 0, 0]
              }
            }
          ]
        }
      }
    });
    S.run(() => {
      if(!this.checkValid(this.mobId))return;

      const pos = api.getPosition(this.mobId);
      api.createItemDrop(...pos, "Gold Bar", 2, false, {
        customDisplayName: "イグナティウム",
        customDescription: "Igniathの力が結晶化した物質。熱をわずかに帯び続ける",
        customAttributes: {
          isIgnatium: true,
          enchantmentTier: "Tier 5",
        }
      }, 100000);
      api.createItemDrop(...pos, "Diamond Fragment",  Math.floor(Math.random() * 8) + 1, false, {
        customDisplayName: "イグナティ フラグメント",
        customDescription: "Igniathのエネルギーが崩壊して生まれた欠片。不安定に揺らぐ",
        customAttributes: {
          isIgnithFragment: true,
          enchantmentTier: "Tier 5",
        }
      }, 100000);
      api.createItemDrop(...pos, "Blinding Pebble",  1, false, {
        customDisplayName: "イグナティ コア",
        customDescription: "内部に膨大なエネルギーを秘めたコア",
        customAttributes: {
          isIgnithCore: true,
          enchantmentTier: "Tier 5",
        }
      }, 100000)

      progressChecker(this.ownerId, "melting");
      this.destroy();
    }, 100);
  }

  registerLoop(){
    const loop = () => {
      if (!this.checkValid(this.mobId)) return;
      if (this.state.busy) {
        S.run(loop, 10, `igniathLoop:${this.mobId}`);
        return;
      }
      if(this.state.destroyed)return;

      const nearest = this.getNearest(30);
      if (this.state.busy) {
        S.run(loop, 10, `igniathLoop:${this.mobId}`);
        return;
      }
      // ▼ スキルCD減少
      for (const k in this.state.cooldowns) {
        if (this.state.cooldowns[k] > 0) this.state.cooldowns[k]--;
      }

      // ▼ フェーズ別グローバル制御
      const phase = this.state.phase;

      const globalLock =
        phase === 1 ? this.state.globalCooldown > 0 :
        phase === 2 ? this.state.globalCooldown > 0 :
        false; // phase3は完全フリー

      if (globalLock) {
        this.state.globalCooldown--;
        S.run(loop, 10, `igniathLoop:${this.mobId}`);
        return;
      }

      const attacks = [
        {
          name: "dash",
          weight: nearest && nearest.distance > 15 ? 8 : 5,
          interval: 15,
          canUse: () => this.state.cooldowns.dash <= 0 && nearest,
          run: () => {
            if(!this.checkValid(this.mobId))return;

            this.dashTowardTarget(() => {
              this.state.busy = false;
            });
            this.state.cooldowns.dash = 30;
          }
        },
        {
          name: "fireball",
          weight: 5,
          interval: 25,
          canUse: () => this.state.cooldowns.fireball <= 0 && nearest,
          run: () => {
            if(!this.checkValid(this.mobId))return;

            this.shotBall();
            S.run(() => {
              this.state.busy = false;
            }, 40);
            this.state.cooldowns.fireball = 25;
          }
        },
        {
          name: "bind",
          weight: 2,
          interval: 35,
          canUse: () => this.state.cooldowns.bind <= 0 && nearest && nearest.distance <= 15,
          run: () => {
            if(!this.checkValid(this.mobId))return;

            const n = this.getNearest(15);
            if(!n) return;
            
            const p = n.playerId;

            this.dashTowardTarget(() => {
              api.setClientOption(p, "speedMultiplier", 0);
              api.setClientOption(p, "jumpAmount", 0);

              api.setMobSetting(this.mobId, "baseWalkingSpeed", 0);
              api.setMobSetting(this.mobId, "baseRunningSpeed", 0);

              api.sendFlyingMiddleMessage(p, ["\n\n\n\n\n\n\n\n逃げられない"], 0, 2500);
              api.setMobSetting(this.mobId, "heldItemName", "Air");

              api.updateEntityNodeMeshAttachment(
                this.mobId, "ArmRightMesh", "BloxdBlock",
                { blockName: "Diamond Sword", size: 0.25, meshOffset: [0, 0, 0] },
                [0, -0.8, 0], [Math.PI, Math.PI / 2, -Math.PI / 4]
              );

              const duration = 2500;
              const start = Date.now();

              api.animateEntity(this.mobId, {
                loop: false,
                animationDurationMs: duration,

                nodeAnimations: {
                  ArmRightMesh: {
                    timeline: [
                      {
                        timeFraction: 0,
                        rotation: { lerpMode: "catmull-rom-spline", point: [-0.7, 0.4, -0.3] }
                      },
                      {
                        timeFraction: 1,
                        rotation: { lerpMode: "catmull-rom-spline", point: [-1.3, 0.5, -0.4] }
                      }
                    ]
                  }
                }
              });

              const [mx, my, mz] = api.getPosition(this.mobId);
              const [, ry] = api.getEntityRotation(this.mobId);

              const dx = Math.sin(ry);
              const dz = Math.cos(ry);

              const targetX = mx + dx * 2;
              const targetY = my + 1;
              const targetZ = mz + dz * 2;

              api.setPosition(p, targetX, targetY, targetZ);
              api.applyEffect(p, "Air Walk" , 2500, {});

              let isDamaging = true;
              const loop = () => {
                if(isDamaging){
                  api.attemptApplyDamage({
                    eId: this.mobId,
                    hitEId: p,
                    attemptedDmgAmt: 5,
                    withItem: "Diamond Sword",
                  });
                  S.run(loop, 10);
                }
              }
              loop();

              S.run(() => {
                isDamaging = false;

                api.setMobSetting(this.mobId, "baseWalkingSpeed", 3.5);
                api.setMobSetting(this.mobId, "baseRunningSpeed", 4.55 * 0.85);

                api.setClientOption(p, "speedMultiplier", 1);
                api.setClientOption(p, "jumpAmount", 8);

                api.updateEntityNodeMeshAttachment(this.mobId, "ArmRightMesh", null);
                this.setAttachItem("Diamond Sword");
                this.state.busy = false;
              }, 50);
              this.state.cooldowns.bind = 60;
            })
          }
        },
        {
          name: "multiDash",
          weight: nearest && nearest.distance >= 10 ? 2 : 0,
          interval: 45,
          canUse: () => this.state.cooldowns.multiDash <= 0 && nearest,
          run: () => {
            if(!this.checkValid(this.mobId))return;
            this.multiDashAttack(() => {
              this.state.busy = false;
            });
            this.state.cooldowns.multiDash = 50;
          }
        }
      ];

      const usable = attacks.filter(a => a.canUse());

      let selected = null;

      if (usable.length > 0) {
        const total = usable.reduce((s, a) => s + a.weight, 0);
        let r = Math.random() * total;

        for (const a of usable) {
          r -= a.weight;
          if (r <= 0) {
            selected = a;
            break;
          }
        }
      }

      if (selected) {
        this.state.busy = true;
        
        selected.run();
        this.state.lastAttack = selected.name;

        if (phase === 1) {
          this.state.globalCooldown = selected.interval + Math.random() * 5;
        } 
        else if (phase === 2) {
          this.state.globalCooldown = 20;
        } 
        else {
          this.state.globalCooldown = 0;
        }

      } else {
        if (nearest && Math.random() < 0.4) {
          this.dashTowardTarget();
        }

        if (phase === 1) this.state.globalCooldown = 10;
        else if (phase === 2) this.state.globalCooldown = 100;
        else this.state.globalCooldown = 0;
      }

      S.run(loop, 10, `igniathLoop:${this.mobId}`);
    };

    loop();
  }
}

onPlayerDamagingMob = (playerId, mobId, damageDealt, withItem) => {
  Igniaths.forEach((instance) => {
    if(instance.mobId === mobId){
      return instance.onDamaged();
    }
  });
}

onPlayerKilledMob = (playerId, mobId, damageDealt, withItem) => {
  Igniaths.forEach((instance) => {
    if(instance.mobId === mobId){
      Igniaths.delete(instance.ownerId);
    }
  })
}

onWorldChangeBlock = (x, y, z, fromBlock, toBlock, initiatorDbId, extraInfo) => {
  if(extraInfo?.cause === "Explosion"){
    return "PreventChange"
  }
}

onPlayerAltAction = (playerId, x, y, z, block, targetEId) => {
  if(!block)return;
  if([x, y, z].some(v => v === undefined))return;

  const under = api.getBlock(x, y - 1, z);
  if(block === "Beacon" && under === "Obby Death Block"){
    try{ new Igniath(playerId, [x, y, z]) }catch(e){
      api.sendMessage(playerId, "イグニアスは呼びかけに応じなかった...");
    }
  }
};

onPlayerChangeBlock = (playerId, x, y, z, fromBlock, toBlock, droppedItem, fromBlockInfo, toBlockInfo) => {
  if(fromBlock === "Beacon" || fromBlock === "Obby Death Block"){
    return "preventDrop";
  }
};