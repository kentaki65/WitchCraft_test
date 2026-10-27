import { Vec3 } from "src/core/types";
import type * as Types from "@bloxd";
import { MagicSystem, RodSettings } from "../magicSystem";
import { setTimeout } from "@plugins/helpers";
import { normalize } from "src/utils/math";

enum BlackIceSkillNames {
  bloodNeedle, aThousandNeedles,
}

export class BlackIceRod extends MagicSystem<BlackIceSkillNames> {
  protected readonly itemName: string = "Black Ice Rod";
  protected readonly rodSettings: Record<BlackIceSkillNames, RodSettings> = {
    [BlackIceSkillNames.bloodNeedle]: {
      canCharge: false,
      useThirdParsonView: false,
    },
    [BlackIceSkillNames.aThousandNeedles]: {
      canCharge: false,
      useThirdParsonView: false
    },
  };
  protected readonly skills: BlackIceSkillNames[] = [
    BlackIceSkillNames.aThousandNeedles, BlackIceSkillNames.bloodNeedle
  ];

  castSpell(mode: BlackIceSkillNames, chargeTime: number): void {
    switch (mode) {
      case BlackIceSkillNames.bloodNeedle:
        this.castFirstSpell(chargeTime);
        break;

      case BlackIceSkillNames.aThousandNeedles:
        this.castSecondSpell(chargeTime);
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
    api.attemptApplyDamage({eId: mobId, hitEId: this.playerId, attemptedDmgAmt: 20, withItem: "Dirt"})
  }

  castFirstSpell(chargeTime: number): void {
    const playerPos = api.getPosition(this.playerId);
    const dir = normalize(api.getPlayerFacingInfo(this.playerId).dir ?? [0, 0, 1]);

    const mobs = this.getMobsInSight(playerPos, dir, 20);

    for (const mob of mobs) {
      const [x, y, z] = api.getPosition(mob);
      this.playEffect(mob, [x, y + 2.5, z]);
    }
  }

  castSecondSpell(chargeTime: number): void {

  }
}