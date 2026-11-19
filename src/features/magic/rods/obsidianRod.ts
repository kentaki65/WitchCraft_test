import { ParticleStudio, type Layer } from "../../../core/helpers/particleHelper";
import type { Vec3 } from "../../../core/types";
import { normalize, spreadVector3D } from "../../../utils/math";
import type { ParticleSystemBlendMode } from "@bloxd";

import {
  MagicSystem, type PassiveConstructor, type RodSettings
} from "../magicSystem";

import { setInterval, clearInterval } from "@plugins/helpers";
import { MobListener } from "../../../core/helpers/eventListener";
import { PassiveEffect } from "../PassiveEffect";

export enum ObisidianRodSkillNames {
  fireball = "火炎球",
  megumin = "エクスプロージョン!",
  selfDestruct = "自爆"
}

const LAYERS: Layer[] = [
  ["glint", [255, 77, 77], [255, 138, 61],
    { minSize: 2, maxSize: 2, blendMode: 1 }, 1000, [
      0, 809, 0, -846, 194, 0, -523, -801, 0, 523, -801, 0, 846, 194, 0, 0, 121, 0, 0, 971, 0, -1000, 244, 0,
      -618, -932, 0, 618, -932, 0, 1000, 244, 0, -200, 194, 0, 0, -421, 0, 200, 194, 0, -323, -186, 0, 323,
      -186, 0, -221, 780, 0, -428, 698, 0, -608, 567, 0, -750, 395, 0, 221, 780, 0, 428, 698, 0, 608, 567,
      0, 750, 395, 0, -67, 604, 0, -133, 399, 0, 67, 604, 0, 133, 399, 0, -887, -25, 0, -873, -247, 0, -804,
      -459, 0, -685, -647, 0, -631, 194, 0, -415, 194, 0, -672, 67, 0, -498, -59, 0, -327, -907, 0, -111,
      -963, 0, 111, -963, 0, 327, -907, 0, -349, -674, 0, -174, -547, 0, -456, -596, 0, -390, -391, 0,
      685, -647, 0, 804, -459, 0, 873, -247, 0, 887, -25, 0, 349, -674, 0, 174, -547, 0, 456, -596, 0, 390,
      -391, 0, 631, 194, 0, 415, 194, 0, 672, 67, 0, 498, -59, 0, -192, -18, 0, -119, -244, 0, 119, -244, 0,
      192, -18, 0,
    ], [
      [5.7, [10, 0, 0, 0, 0, 0, -10, 20, 0, -10, 0, 0], [-33, 0, 0, 0, 0, 0, 33, 0, 0, 33, 0, 0], [[0, 0],
      [.894719, 0], [.894736, 1]], [[0, 0], [.894736, 0], [.947368, 1], [1, 0]]], [5.1, [10, 0, 0, 0,
        0, 0, -10, 20, 0, -10, 0, 0], 0, [[0, 0], [.352921, 0], [.352941, 1]]], [1.8, [5, 0, 0, 0, 0, 0, -5,
          20, 0, -5, 0, 0], [11.1111, 0, 0, 0, 0, 0, -11.1111, 0, 0, -11.1111, 0, 0], [[0, 0], [.499944, 0],
          [.5, 1]], [[0, 0], [.5, 0], [.75, 1], [1, 0]]], [.9, [.1, 0, 0, 0, 0, 0, -.1, 20, 0, -.1, 0, 0],
        [16.3333, 0, 0, 0, 0, 0, -16.3333, 0, 0, -16.3333, 0, 0], [[0, 0], [.333222, 0], [.333333, 1]],
        [[0, 0], [.333333, 0], [.666666, 1], [1, 0]]],
    ]],
  ["glint", [255, 77, 77], [255, 138, 61],
    { minSize: 1.5, maxSize: 1.5, blendMode: 1 }, 265, [
      0, 214, 0, -224, 51, 0, -139, -212, 0, 139, -212, 0, 224, 51, 0, 0, 32, 0, 0, 257, 0, -265, 65, 0, -164,
      -247, 0, 164, -247, 0, 265, 65, 0, -53, 51, 0, 0, -111, 0, 53, 51, 0, -86, -49, 0, 86, -49, 0,
    ], [
      [5.7, [2.65, 0, 0, 0, 0, 0, -2.65, 16.426, 0, -2.65, 0, 0], [-8.5, 0, 0, 0, 0, 0, 8.5, 0, 0, 8.5, 0, 0],
        [[0, 0], [.894719, 0], [.894736, 1]], [[0, 0], [.894736, 0], [.947368, 1], [1, 0]]], [5.1,
        [2.65, 0, 0, 0, 0, 0, -2.65, 16.426, 0, -2.65, 0, 0], 0, [[0, 0], [.294098, 0], [.294117, 1]]],
      [1.5, [.1, 0, 0, 0, 0, 0, -.1, 16.426, 0, -.1, 0, 0], [5.6667, 0, 0, 0, 0, 0, -5.6667, 0, 0, -5.6667,
        0, 0], [[0, 0], [.399933, 0], [.4, 1]], [[0, 0], [.4, 0], [.7, 1], [1, 0]]],
    ]],
  ["glint", [255, 77, 77], [255, 138, 61],
    { minSize: 1.5, maxSize: 1.5, blendMode: 1 }, 450, [
      0, 364, 0, -381, 87, 0, -235, -360, 0, 235, -360, 0, 381, 87, 0, 0, 55, 0, 0, 437, 0, -450, 110, 0,
      -278, -419, 0, 278, -419, 0, 450, 110, 0, -90, 87, 0, 0, -189, 0, 90, 87, 0, -145, -84, 0, 145, -84, 0,
      -124, 344, 0, -235, 288, 0, -324, 199, 0, 124, 344, 0, 235, 288, 0, 324, 199, 0, -30, 272, 0, -60,
      180, 0, 30, 272, 0, 60, 180, 0, -400, -36, 0, -381, -160, 0, -324, -272, 0, -235, 87, 0, -263, 2, 0,
      -124, -417, 0, 0, -437, 0, 124, -417, 0, -157, -303, 0, -78, -246, 0, -190, -222, 0, 324, -272, 0,
      381, -160, 0, 400, -36, 0, 118, -275, 0, 190, -222, 0, 284, 87, 0, 187, 87, 0, 302, 30, 0, 224, -27, 0,
      -87, -8, 0, -53, -110, 0, 53, -110, 0, 87, -8, 0,
    ], [
      [5.7, [4.5, 0, 0, 0, 0, 0, -4.5, 13.489, 0, -4.5, 0, 0], [-14.6667, 0, 0, 0, 0, 0, 14.6667, 0, 0,
        14.6667, 0, 0], [[0, 0], [.894719, 0], [.894736, 1]], [[0, 0], [.894736, 0], [.947368, 1], [1,
          0]]], [5.1, [4.5, 0, 0, 0, 0, 0, -4.5, 13.489, 0, -4.5, 0, 0], 0, [[0, 0], [.411745, 0], [.411764,
            1]]], [2.1, [.1, 0, 0, 0, 0, 0, -.1, 13.489, 0, -.1, 0, 0], [7.3333, 0, 0, 0, 0, 0, -7.3333, 0, 0,
              -7.3333, 0, 0], [[0, 0], [.428523, 0], [.428571, 1]], [[0, 0], [.428571, 0], [.714285, 1], [1,
                0]]],
    ]],
  ["glint", [255, 77, 77], [255, 115, 0],
    { minSize: 1.8, maxSize: 1.8, blendMode: 1 }, 1000, [
      0, 809, 0, -846, 194, 0, -523, -801, 0, 523, -801, 0, 846, 194, 0, 0, 121, 0, 0, 971, 0, -1000, 244, 0,
      -618, -932, 0, 618, -932, 0, 1000, 244, 0, -200, 194, 0, 0, -421, 0, 200, 194, 0, -323, -186, 0, 323,
      -186, 0, -185, 789, 0, -362, 732, 0, -523, 639, 0, -661, 514, 0, -771, 364, 0, 185, 789, 0, 362, 732,
      0, 523, 639, 0, 661, 514, 0, 771, 364, 0, -50, 655, 0, -100, 501, 0, -150, 348, 0, 67, 604, 0, 133,
      399, 0, -885, 12, 0, -885, -174, 0, -846, -356, 0, -771, -526, 0, -661, -676, 0, -631, 194, 0, -415,
      194, 0, -672, 67, 0, -498, -59, 0, -362, -894, 0, -185, -951, 0, 0, -971, 0, 185, -951, 0, 362, -894,
      0, -349, -674, 0, -174, -547, 0, -456, -596, 0, -390, -391, 0, 661, -676, 0, 771, -526, 0, 846,
      -356, 0, 885, -174, 0, 885, 12, 0, 349, -674, 0, 174, -547, 0, 456, -596, 0, 390, -391, 0, 631, 194,
      0, 415, 194, 0, 672, 67, 0, 498, -59, 0, -261, 4, 0, -162, -303, 0, 162, -303, 0, 261, 4, 0, -158, 45,
      0, -197, -126, 0, 197, -126, 0, 158, 45, 0,
    ], [
      [5.7, [10, 0, 0, 0, 0, 0, -10, 10, 0, -10, 0, 0], [-33, 0, 0, 0, 0, 0, 33, 0, 0, 33, 0, 0], [[0, 0],
      [.894719, 0], [.894736, 1]], [[0, 0], [.894736, 0], [.947368, 1], [1, 0]]], [5.1, [10, 0, 0, 0,
        0, 0, -10, 10, 0, -10, 0, 0], 0, [[0, 0], [.541156, 0], [.541176, 1]]], [2.76, [.1, 0, 0, 0, 0, 0,
          -.1, 10, 0, -.1, 0, 0], [12.9412, 0, 0, 0, 0, 0, -12.9412, 0, 0, -12.9412, 0, 0], [[0, 0], [.445615,
            0], [.445652, 1]], [[0, 0], [.445652, 0], [.722826, 1], [1, 0]]],
    ]],
  ["glint", [255, 77, 77], [255, 138, 61],
    { minSize: 1.5, maxSize: 1.5, blendMode: 1 }, 445, [
      0, 360, 0, -377, 86, 0, -233, -356, 0, 233, -356, 0, 377, 86, 0, 0, 54, 0, 0, 432, 0, -445, 109, 0,
      -275, -415, 0, 275, -415, 0, 445, 109, 0, -89, 86, 0, 0, -187, 0, 89, 86, 0, -144, -83, 0, 144, -83, 0,
      -161, 326, 0, -294, 229, 0, 161, 326, 0, 294, 229, 0, -44, 223, 0, 44, 223, 0, -394, -77, 0, -343,
      -234, 0, -233, 86, 0, -260, 2, 0, -82, -423, 0, 82, -423, 0, -116, -272, 0, -188, -220, 0, 343, -234,
      0, 394, -77, 0, 116, -272, 0, 188, -220, 0, 233, 86, 0, 260, 2, 0, -78, -81, 0, 78, -81, 0,
    ], [
      [5.7, [4.45, 0, 0, 0, 0, 0, -4.45, 5, 0, -4.45, 0, 0], [-14.5, 0, 0, 0, 0, 0, 14.5, 0, 0, 14.5, 0, 0],
        [[0, 0], [.894719, 0], [.894736, 1]], [[0, 0], [.894736, 0], [.947368, 1], [1, 0]]], [5.1,
        [4.45, 0, 0, 0, 0, 0, -4.45, 5, 0, -4.45, 0, 0], 0, [[0, 0], [.623509, 0], [.623529, 1]]], [3.18,
        [.1, 0, 0, 0, 0, 0, -.1, 5, 0, -.1, 0, 0], [5.1786, 0, 0, 0, 0, 0, -5.1786, 0, 0, -5.1786, 0, 0], [[0,
          0], [.471666, 0], [.471698, 1]], [[0, 0], [.471698, 0], [.735849, 1], [1, 0]]],
    ]],
  ["square_particle", [255, 77, 77], [255, 77, 77],
    { minSize: 0.3, maxSize: 0.6, blendMode: 1 }, 1000, [
      -1000, 0, 0, -895, 0, 0, -789, 0, 0, -684, 0, 0, -579, 0, 0, -474, 0, 0, -368, 0, 0, -263, 0, 0, -158, 0,
      0, -53, 0, 0, 53, 0, 0, 158, 0, 0, 263, 0, 0, 368, 0, 0, 474, 0, 0, 579, 0, 0, 684, 0, 0, 789, 0, 0, 895, 0,
      0, 1000, 0, 0,
    ], [
      [5.1, [0, -10, 0, 0, 10, 0, 0, 10, 0, 0, -10, 0], 0, [[0, 0], [.052941, 0], [.058823, .294],
      [.064705, .324], [.07647, .382], [.111764, .559], [.182352, .912], [.2, 1], [.8, 1], [1,
        0]]], [.3, [0, -1, 0, 0, 1, 0, 0, 2.5, 0, 0, -1, 0], [0, -60, 0, 0, 60, 0, 0, 50, 0, 0, -60, 0], [[0, 0],
        [1, .294]], [[0, 0], [.5, 1], [1, 0]]],
    ]],
  ["glint", [77, 219, 106], [11, 61, 46],
    { minSize: 10, maxSize: 10, blendMode: 1 }, 100, [
      0, 0, 0,
    ], [
      [6.6, [1, 0, 0, .45, 0, 1, 0, 12.366, 0, 0, -1, .5], [0, 0, 0, 0, 0, 0, 0, -30, 0, 0, 0, 0], [[0, 0],
      [.90909, 0], [.927272, 1], [.981818, 1], [1, 0]], [[0, 0], [.909075, 0], [.90909, 1]], 0, 5],
    ]],
  ["glint", [255, 210, 74], [255, 0, 0],
    { minSize: 5, maxSize: 5, blendMode: 1 }, 100, [
      0, 0, 0,
    ], [
      [6.54, [1, 0, 0, 2.702, 0, 1, 0, 14.175, 0, 0, -1, .5], [0, 0, 0, 0, 0, 0, 0, -30.6, 0, 0, 0, 0], [[0, 0],
      [.935779, 0], [.948623, 1], [.987155, 1], [1, 0]], [[0, 0], [.935764, 0], [.935779, 1]], 0, 5],
    ]],
  ["glint", [71, 200, 255], [79, 141, 255],
    { minSize: 5, maxSize: 5, blendMode: 1 }, 100, [
      0, 0, 0,
    ], [
      [6.36, [1, 0, 0, -3.004, 0, 1, 0, 12.291, 0, 0, -1, .5], [0, 0, 0, 0, 0, 0, 0, -29.7, 0, 0, 0, 0], [[0,
        0], [.933962, 0], [.947169, 1], [.986792, 1], [1, 0]], [[0, 0], [.933946, 0], [.933962, 1]], 0,
        5],
    ]],
  ["glint", [255, 210, 74], [255, 138, 61],
    { minSize: 5, maxSize: 5, blendMode: 1 }, 100, [
      0, 0, 0,
    ], [
      [6.78, [1, 0, 0, .5, 0, 1, 0, 12.349, 0, 0, -1, 2.637], [0, 0, 0, 0, 0, 0, 0, -30.3, 0, 0, 0, 0], [[0, 0],
      [.893805, 0], [.915044, 1], [.978761, 1], [1, 0]], [[0, 0], [.89379, 0], [.893805, 1]], 0, 5],
    ]],
]

class FirePassive extends PassiveEffect {
  private id: string | undefined;

  override onActivate(): void {
    api.log("はつどう!")
    this.id = this.survival.temperature.addModifier({
      minTemperature: 40,
      ignoreHeatstroke: true
    })
  }

  protected override onDeactivate(): void {
    super.onDeactivate();

    if (this.id !== undefined) {
      this.survival.temperature.removeModifier(this.id);
      this.id = undefined;
    }
  }
}

class ThermalArmorPassive extends PassiveEffect {
  override onActivate(): void {
    //パッシブ:熱装甲　被ダメを-20%。武器などで殴られた場合、相手に一定ダメージ与える。
    this.subscribe("playerWasDamagedByMob", (e) => {
      e.damage = e.damageDealt * 0.8; //8割

      const damage = 20;
      api.attemptApplyDamage({
        eId: e.damagedPlayer,
        hitEId: e.attackingMob,
        attemptedDmgAmt: damage,
        withItem: e.withItem
      })
    })
  }
}

export class ObisidianRod extends MagicSystem<ObisidianRodSkillNames> {
  protected override itemName: string = "Obsidian Rod";
  protected override rodSettings: Record<ObisidianRodSkillNames, RodSettings> = {
    [ObisidianRodSkillNames.fireball]: {
      canCharge: false,
      useThirdParsonView: false,
    },
    [ObisidianRodSkillNames.megumin]: {
      canCharge: true,
      minCharge: 11000,
      useThirdParsonView: true
    },
    [ObisidianRodSkillNames.selfDestruct]: {
      canCharge: true,
      minCharge: 1000,
      useThirdParsonView: false
    }
  };

  protected override skills: readonly ObisidianRodSkillNames[] = [
    ObisidianRodSkillNames.fireball,
    ObisidianRodSkillNames.megumin,
    ObisidianRodSkillNames.selfDestruct
  ];

  protected override passiveClasses: readonly PassiveConstructor[] = [
    FirePassive,
    ThermalArmorPassive,
  ];

  protected particleStadio: ParticleStudio | null = null;
  protected isChargingExplosion = false;

  protected readonly needChargeTime = 20000;

  protected override castSpell(mode: ObisidianRodSkillNames, chargeTime: number): void {
    switch (mode) {
      case ObisidianRodSkillNames.fireball:
        this.castFirstSpell(chargeTime);
        break;

      case ObisidianRodSkillNames.selfDestruct:
        this.castThirdSpell();
        break;
    }
  }

  private castFirstSpell(chargeTime: number) {
    //火炎球　相手に火の玉を飛ばす。5連発で少し拡散あり。当たった場合ダメとやけど（あるのか？まあ効果は毒と同じやね）を与える
    const [x, y, z] = api.getPosition(this.playerId);
    const dir = normalize(api.getPlayerFacingInfo(this.playerId).dir);
    if (!dir) return;

    //TODO レベルに応じてダメージ倍率/拡散度合いを変える
    const multipleDamage = 5;
    const fireballAmount = 5;
    const spreadAngle = 15 * (Math.PI / 180);

    const maxDistance = 30;
    const maxDetectionRadius = maxDistance * Math.tan(spreadAngle);
    const mobs = this.getMobsInSight([x, y, z], dir, 30, maxDetectionRadius);

    for (const mob of mobs) {
      const mobListener = new MobListener(mob);
      mobListener.addEventListener("mobWasDamagedByPlayer", (e) => {
        const { mobId } = e;
        if (!api.checkValid(mobId)) return;

        api.applyEffect(mob, "Poisoned", 5000, {
          inbuiltLevel: 5
        });

        const mobPos = api.getPosition(mobId);
        api.playParticleEffect({
          dir1: [-1, -1, -1],
          dir2: [1, 1, 1],
          pos1: mobPos,
          pos2: [mobPos[0], mobPos[1], mobPos[2]],
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
      }, { once: true });
    }

    let i = 0;
    const intervalId = setInterval(() => {
      const spreadDir = spreadVector3D(dir, spreadAngle);

      api.attemptCreateThrowable(
        this.playerId,
        "Fireball",
        [x, y + 1.5, z],
        spreadDir,
        1,
        multipleDamage
      );

      i++;

      if (i >= fireballAmount) {
        clearInterval(intervalId);
      }
    }, 100);
  }

  //エクスプロージョン！　前方へ大きな爆発を起こす。詠唱時間が長いほど火力が上がる
  private castSecondSpell() {
    this.isChargingExplosion = true;

    const dir = normalize(api.getPlayerFacingInfo(this.playerId).dir);
    const [px, py, pz] = api.getPosition(this.playerId);
    if (!dir) {
      this.isChargingExplosion = false;
      return
    };

    const distance = 10;

    const dx = dir[0] * distance + px;
    const dy = dir[1] * distance + py;
    const dz = dir[2] * distance + pz;

    let origin: Vec3 = [dx, dy, dz];

    for (let i = 0; i < 5; i++) {
      const raycast = api.raycastForBlock(origin, [0, -1, 0]);
      if (raycast) {
        origin = raycast.position;
        break;
      }
      origin = [origin[0], origin[1] - 5, origin[2]];
    }

    if (!this.particleStadio) {
      this.particleStadio = new ParticleStudio(LAYERS, origin, {
        autoLoop: false,
        stepIntervalMs: 100,
        maxParticlesPerStep: 40,
        staged: {
          generateMs: 5000,   // 全層の生成にかける時間
          contractAtSec: 5.1, // 今のデータで収縮が始まる時刻(秒)
          // marginMs: 500,   // 生成が遅れたときの余裕
        },
        onContract: () => { },  // 収縮が始まる時刻に呼ばれる
        onFinish: () => { },
      });
    }

    this.particleStadio.origin = origin;
    this.particleStadio.play(1000);
  }

  protected bigExplosion(pos: Vec3) {
    const [x, y, z] = pos;

    const pos1 = [x, y, z]
    const pos2 = [x + 1, y + 1, z + 1]

    const base = {
      texture: "square_particle",
      blendMode: 1 as ParticleSystemBlendMode,
      dir1: [-1, -1, -1],
      dir2: [1, 1, 1],
    }

    api.playParticleEffect({
      ...base,
      pos1: [x + 0.3, y + 0.3, z + 0.3],
      pos2: [x + 0.7, y + 0.7, z + 0.7],
      minLifeTime: 0.1,
      maxLifeTime: 1,
      minEmitPower: 0,
      maxEmitPower: 2,
      minSize: 5,
      maxSize: 9,
      manualEmitCount: 100,
      gravity: [0, 0, 0],
      colorGradients: [{
        timeFraction: 0,
        minColor: [255, 255, 255, 1],
        maxColor: [255, 255, 180, 1],
      }],
      velocityGradients: [{
        timeFraction: 0,
        factor: 1,
        factor2: 1,
      }],
      hideDist: 100
    })

    api.playParticleEffect({
      ...base,
      pos1,
      pos2,
      minLifeTime: 0.2,
      maxLifeTime: 1.5,
      minEmitPower: 27.5,
      maxEmitPower: 40,
      minSize: 1.5,
      maxSize: 3,
      manualEmitCount: 400,
      gravity: [0, 10, 0],
      colorGradients: [
        {
          timeFraction: 0,
          minColor: [255, 255, 220, 1],
          maxColor: [255, 180, 30, 1],
        },
        {
          timeFraction: 0.5,
          minColor: [255, 70, 0, 1],
          maxColor: [255, 120, 0, 1],
        },
        {
          timeFraction: 1,
          minColor: [80, 30, 10, 0],
          maxColor: [120, 50, 10, 0],
        },
      ],
      velocityGradients: [{
        timeFraction: 0,
        factor: 1,
        factor2: 1,
      }],
      hideDist: 100
    })

    api.playParticleEffect({
      ...base,
      pos1,
      pos2,
      minLifeTime: 0.5,
      maxLifeTime: 3,
      minEmitPower: 15,
      maxEmitPower: 35,
      minSize: 0.5,
      maxSize: 1.5,
      manualEmitCount: 250,
      gravity: [0, -30, 0],
      colorGradients: [
        {
          timeFraction: 0,
          minColor: [255, 255, 180, 1],
          maxColor: [255, 220, 80, 1],
        },
        {
          timeFraction: 1,
          minColor: [255, 50, 0, 0],
          maxColor: [255, 130, 0, 0],
        },
      ],
      velocityGradients: [{
        timeFraction: 0,
        factor: 1,
        factor2: 1,
      }],
      hideDist: 100
    })

    api.playParticleEffect({
      ...base,
      pos1: [x - 1, y - 1, z - 1],
      pos2: [x + 2, y + 2, z + 2],
      minLifeTime: 0.8,
      maxLifeTime: 5,
      minEmitPower: 3,
      maxEmitPower: 12,
      minSize: 3,
      maxSize: 7,
      manualEmitCount: 180,
      gravity: [0, 5, 0],
      colorGradients: [
        {
          timeFraction: 0,
          minColor: [90, 65, 45, 0.9],
          maxColor: [130, 100, 70, 0.9],
        },
        {
          timeFraction: 1,
          minColor: [40, 40, 40, 0],
          maxColor: [90, 90, 90, 0],
        },
      ],
      velocityGradients: [{
        timeFraction: 0,
        factor: 1,
        factor2: 1,
      }],
      hideDist: 100
    })

    api.broadcastSound("cannonFire3", 1, 1, {
      playerIdOrPos: [x, y, z],
      maxHearDist: 100
    })

    const range = 10;
    const damage = 1000;

    const mobs = api.getEntitiesInRect(
      pos.map(n => n - range),
      pos.map(n => n + range)
    ).filter(n => n !== this.playerId);
    for (const mob of mobs) {
      try {
        api.attemptApplyDamage({
          eId: this.playerId,
          hitEId: mob,
          attemptedDmgAmt: damage,
          withItem: this.itemName,
        })
      } catch (e) { }
    }

  }

  protected castThirdSpell() {
    const pos = api.getPosition(this.playerId);
    api.setHealth(this.playerId, 1);
    this.bigExplosion(pos);
  }

  protected override startCharging(): void {
    if (this.currentMode === ObisidianRodSkillNames.megumin) {
      const rodSetting = this.rodSettings[this.currentMode];
      if (this.charging) return;

      this.charging = true;

      this.chargeStart = api.now();
      this.startChargingAnimation(rodSetting.useThirdParsonView);

      api.initiateMiddleScreenBar(this.playerId, this.needChargeTime, true, 0);
      api.setClientOption(this.playerId, "runningSpeed", 0.5);
      api.setClientOption(this.playerId, "walkingSpeed", 0.5);

      if (!this.isChargingExplosion) {
        this.castSecondSpell();
        this.isChargingExplosion = true;
      }
    } else {
      super.startCharging();
    }
  }

  override onPlayerClickUp(): void {
    if (this.currentMode === ObisidianRodSkillNames.megumin && this.isChargingExplosion) {
      this.particleStadio?.cancel();

      this.stopCharging();
      this.isChargingExplosion = false;

    } else {
      super.onPlayerClickUp();
    }
  }

  override tick(): void {
    this.particleStadio?.step();
    if (!this.charging) return;

    if (this.currentMode === ObisidianRodSkillNames.megumin) {
      if (!this.charging) return;

      const chargeTime = this.diffCharging();
      const color = this.getChargeColor(chargeTime);

      api.shakePlayerCamera(this.playerId, chargeTime / 1e5, 50);
      api.sendFlyingMiddleMessage(this.playerId, [
        { icon: `fa-solid fa-crosshairs`, style: { color, opacity: 0.3 } },
        { str: `\n`.repeat(3) }
      ], 0, 100)

      if (chargeTime > this.needChargeTime) {
        this.castSpell(this.currentMode, chargeTime);

        this.chargeStart = api.now();

        api.setClientOption(this.playerId, `runningSpeed`, 2);
        api.setClientOption(this.playerId, `walkingSpeed`, 2);
        this.stopCharging();
        this.bigExplosion(this.particleStadio?.origin as Vec3);

        api.applyEffect(this.playerId, "Slowness", 900000, { inbuiltLevel: 2 });
        api.applyEffect(this.playerId, "Weakness", 900000, { inbuiltLevel: 2 });
      }
    } else {
      super.tick()
    }
  }
}
