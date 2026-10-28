import { Vec3 } from "src/core/types";
import type * as Types from "@bloxd";
import { MagicSystem, RodSettings } from "../magicSystem";
import { setTimeout } from "@plugins/helpers";
import { normalize } from "src/utils/math";
import { asyncAnimate } from "src/core/api/animateHelper";

export enum BlackIceSkillNames {
  bloodNeedle = "bloodNeedle", sacrifice = "sacrifice", markTarget = "markTarget"
}

const useMagicButtonIds = {
  spawn: "spawn",
} as const;

export class BlackIceRod extends MagicSystem<BlackIceSkillNames> {
  protected readonly itemName: string = "Black Ice Rod";
  protected readonly rodSettings: Record<BlackIceSkillNames, RodSettings> = {
    [BlackIceSkillNames.bloodNeedle]: {
      canCharge: false,
      useThirdParsonView: false,
    },
    [BlackIceSkillNames.sacrifice]: {
      canCharge: false,
      useThirdParsonView: false
    },
    [BlackIceSkillNames.markTarget]: {
      canCharge: true,
      minCharge: 500,
      useThirdParsonView: false
    }
  };

  protected readonly skills: BlackIceSkillNames[] = [
    BlackIceSkillNames.sacrifice, BlackIceSkillNames.bloodNeedle, BlackIceSkillNames.markTarget
  ];

  castSpell(mode: BlackIceSkillNames, chargeTime: number): void {
    switch (mode) {
      case BlackIceSkillNames.markTarget:
        this.castSecondSpell(chargeTime);
        break;

      case BlackIceSkillNames.bloodNeedle:
        this.castFirstSpell(chargeTime);
        break;
    }
  }

  playEffect(mob: Types.MobId, center: Vec3) {
    const count = 25;
    const radius = 3;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random();

      const horizontalRadius =
        radius * Math.sqrt(1 - elevation * elevation);

      const offset = [
        Math.cos(angle) * horizontalRadius,
        radius * elevation,
        Math.sin(angle) * horizontalRadius,
      ];

      const pos = [
        center[0] + offset[0],
        center[1] + offset[1],
        center[2] + offset[2],
      ];

      const dir = [
        -offset[0],
        -offset[1] - 5,
        -offset[2],
      ];

      const length = Math.hypot(...dir);
      const normalizedDir = dir.map(v => v / length);

      api.playParticleEffect({
        texture: "drift",
        pos1: pos,
        pos2: pos,
        dir1: normalizedDir,
        dir2: normalizedDir,

        minLifeTime: 0.15,
        maxLifeTime: 0.22,

        minEmitPower: 20,
        maxEmitPower: 26,

        minSize: 0.06,
        maxSize: 0.18,

        gravity: [0, -12, 0],

        velocityGradients: [
          { timeFraction: 0, factor: 1, factor2: 1 },
          { timeFraction: 1, factor: 2, factor2: 2 },
        ],

        colorGradients: [
          {
            timeFraction: 0,
            minColor: [180, 0, 0, 0.8],
            maxColor: [255, 20, 30, 1],
          },
        ],

        blendMode: 3,
        manualEmitCount: 15,
        hideDist: 500
      });
    }

    setTimeout(() => {
      api.playParticleEffect({
        dir1: [-1, -1, -1],
        dir2: [1, 1, 1],
        pos1: center,
        pos2: [center[0], center[1] - 2.5, center[2]],
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
      api.playSound(this.playerId, "reaverAttack1", 1, 1);
      this.applyDamage(mob);
    }, 300);
  }

  applyDamage(mobId: Types.MobId) {
    try {
      api.attemptApplyDamage({ eId: this.playerId, hitEId: mobId, attemptedDmgAmt: 20, withItem: this.itemName })
    } catch (e: any) { }
  }

  castFirstSpell(chargeTime: number): void {
    const playerPos = api.getPosition(this.playerId);
    const dir = normalize(api.getPlayerFacingInfo(this.playerId).dir ?? [0, 0, 1]);

    const [mob] = this.getMobsInSight(playerPos, dir, 20);

    const [x, y, z] = api.getPosition(mob);
    this.playEffect(mob, [x, y + 2.5, z]);
  }

  //右クリで召喚
  //左クリックで殺して周囲にダメージを与える
  //onClick***らへんをオーバーライドする

  //召喚やね
  //
  override onPlayerClick(wasAltClick: boolean): void {
    super.onPlayerClick(wasAltClick);

    if (this.currentMode === BlackIceSkillNames.sacrifice) {
      if (wasAltClick) {
        const { position } = api.getPlayerTargetInfo(this.playerId);
        const summonedMob = api.attemptSpawnMob(
          "Draugr Zombie", ...position,
          { name: `${api.getEntityName(this.playerId)}'s summoned minion` }
        );

        if (summonedMob) {
          api.setMobAiState(summonedMob, "disabled", null);

          asyncAnimate(summonedMob, {
            loop: false,
            animationDurationMs: 3200,
            nodeAnimations: {
              HeadMesh: {
                timeline: [
                  {
                    timeFraction: 0,
                    rotation: [0.8, 0, 0]
                  },
                  {
                    timeFraction: 0.2,
                    rotation: [-0.4, 0, 0]
                  },
                  {
                    timeFraction: 0.45,
                    rotation: [-0.7, 0, 0]
                  },
                  {
                    timeFraction: 0.7,
                    rotation: [-0.2, 0, 0]
                  },
                  {
                    timeFraction: 1,
                    rotation: [0.2, 0, 0]
                  }
                ]
              },

              // 2. 右手を前に伸ばして地面につく
              ArmRightMesh: {
                timeline: [
                  {
                    timeFraction: 0,
                    rotation: [0.3, 0, -0.2]
                  },
                  {
                    timeFraction: 0.2,
                    rotation: [-0.4, 0, -0.5]
                  },
                  {
                    timeFraction: 0.4,
                    rotation: [-1.6, 0.1, -0.4]
                  },
                  {
                    timeFraction: 0.65,
                    rotation: [-1.9, 0.1, -0.2]
                  },
                  {
                    timeFraction: 0.85,
                    rotation: [-1.4, 0, -0.2]
                  },
                  {
                    timeFraction: 1,
                    rotation: [-1.2, 0, -0.2]
                  }
                ]
              },

              // 3. 左手は少し遅れて地面につく
              ArmLeftMesh: {
                timeline: [
                  {
                    timeFraction: 0,
                    rotation: [0.3, 0, 0.2]
                  },
                  {
                    timeFraction: 0.3,
                    rotation: [-0.4, 0, 0.5]
                  },
                  {
                    timeFraction: 0.5,
                    rotation: [-1.6, -0.1, 0.4]
                  },
                  {
                    timeFraction: 0.7,
                    rotation: [-1.9, -0.1, 0.2]
                  },
                  {
                    timeFraction: 0.9,
                    rotation: [-1.4, 0, 0.2]
                  },
                  {
                    timeFraction: 1,
                    rotation: [-1.2, 0, 0.2]
                  }
                ]
              },

              // 4. 両腕で支えながら上半身を起こす
              TorsoNode: {
                timeline: [
                  {
                    // ① 頭を出す：胴体は動かさない
                    timeFraction: 0,
                    rotation: [1.3, 0, 0],
                  },
                  {
                    // ② 両手を地面につく：まだ上昇しない
                    timeFraction: 0.4,
                    rotation: [1.2, 0, 0],
                  },
                  {
                    // ③ 腕で支え始め、上半身を持ち上げる
                    timeFraction: 0.6,
                    rotation: [0.8, 0, 0],
                  },
                  {
                    // ④ さらに体を地上へ出す
                    timeFraction: 0.8,
                    rotation: [0.35, 0, 0],
                  },
                  {
                    // ⑤ 上半身が出きって止まる
                    timeFraction: 1,
                    rotation: [0.2, 0, 0],
                  }
                ]
              }
            }
          }).then(() => {
            if (!api.checkValid(summonedMob)) return;

            const [x, y, z] = position;
            api.setPosition(summonedMob, x, y + 1, z);

            this.summonedMobs.add(summonedMob);
          })
        }
      } else {
        const playerPos = api.getPosition(this.playerId);
        const dir = normalize(api.getPlayerFacingInfo(this.playerId).dir ?? [0, 0, 1]);

        const [mob] = this.getMobsInSight(playerPos, dir, 20, 5, null);
        const mobPos = api.getPosition(mob);

        if (this.summonedMobs.has(mob)) {
          api.attemptCreateThrowable(mob, "Fireball", mobPos, [0, -1, 0], 200, 50);
        };
      }
    }
  }

  //marktarget
  //これで攻撃モブを指定する
  castSecondSpell(chargeTime: number): void {
    const playerPos = api.getPosition(this.playerId);
    const dir = normalize(api.getPlayerFacingInfo(this.playerId).dir ?? [0, 0, 1]);
    const [mob] = this.getMobsInSight(playerPos, dir, 20, 5);

    api.updateEntityNodeMeshAttachment(
      mob,
      "HeadMesh",
      "ParticleEmitter",
      {
        dir1: [0.2, 1, 0.2],
        dir2: [-0.2, -1, -0.2],
        emitRate: 200,
        width: 0.1,
        height: 0.1,
        depth: 0.1,
        texture: "glint",
        minLifeTime: 0.1,
        maxLifeTime: 0.5,
        minEmitPower: 1,
        maxEmitPower: 3,
        minSize: 0.5,
        maxSize: 1,
        gravity: [0, 10, 0],
        colorGradients: [
          {
            timeFraction: 0,
            minColor: [255, 0, 0, 1],
            maxColor: [0, 0, 255, 1],
          },
        ],
        velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }],
        blendMode: 1
      },
      [0, -0.8, -0.5]
    );

    this.summonedMobs.forEach(id => {
      api.setMobAiState(id, "idle", null);
      api.attemptApplyDamage({
        eId: mob,
        hitEId: id,
        withItem: "Dirt",
        attemptedDmgAmt: 1
      });
    })
  }
}