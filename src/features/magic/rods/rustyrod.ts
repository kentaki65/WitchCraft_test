import { MobListener } from "../../../core/api/eventListener";
import type { Vec3 } from "../../../core/types";
import { normalize, spreadVector3D } from "../../../utils/math";
import { MagicSystem, type PassiveConstructor, type RodSettings } from "../magicSystem";

export enum RustyRodSkillNames {
  magicAbsorption = "魔力吸収",
  woodenThornOfGrudge = "私怨の木の棘",
}

export class RustyRod extends MagicSystem<RustyRodSkillNames> {
  protected override itemName: string = "Rusty Rod";
  protected override rodSettings: Record<RustyRodSkillNames, RodSettings> = {
    [RustyRodSkillNames.magicAbsorption]: {
      canCharge: false,
      useThirdParsonView: false,
    },
    [RustyRodSkillNames.woodenThornOfGrudge]: {
      canCharge: true,
      minCharge: 1000,
      useThirdParsonView: true
    }
  };

  protected override skills: readonly RustyRodSkillNames[] = [
    RustyRodSkillNames.magicAbsorption,
    RustyRodSkillNames.woodenThornOfGrudge
  ];

  protected override passiveClasses: readonly PassiveConstructor[] = [];
  
  private lastFireTime = 0;

  private readonly fireInterval = 500;
  private readonly arrowsPerBurst = 3;

  protected override castSpell(mode: RustyRodSkillNames, chargeTime: number): void {
    switch (mode) {
      case RustyRodSkillNames.magicAbsorption:
        this.castFirstSpell(chargeTime);
        break;
    }
  }

  private castFirstSpell(chargeTime: number) {
    //TODO レベルに応じて動的に変える

    const healAmount = 30;
    const duration = 10000;
    const level = 2;

    try { api.applyHealthChange(this.playerId, healAmount); } catch (e: any) { }
    api.applyEffect(this.playerId, "Speed", duration, { inbuiltLevel: level });
    api.applyEffect(this.playerId, "Damage", duration, { inbuiltLevel: level });
  };

  //私怨の木の棘　木の棘を前に打ち出す　当たりにくいが攻撃力は高め(序盤基準)
  private castSecondSpell(arrowAmount: number) {
    const [x, y, z] = api.getPosition(this.playerId);
    const dir = normalize(api.getPlayerFacingInfo(this.playerId).dir);
    if (!dir) return;

    //TODO レベルに応じてダメージ倍率/拡散度合いを変える
    const multipleDamage = 5;
    const spreadAngle = 15 * (Math.PI / 180);

    const maxDistance = 30;
    const maxDetectionRadius = maxDistance * Math.tan(spreadAngle);
    const mobs = this.getMobsInSight([x, y, z], dir, 30, maxDetectionRadius);

    for (const mob of mobs) {
      const mobListener = new MobListener(mob);
      mobListener.addEventListener("mobWasDamagedByPlayer", (e) => {
        const { mobId } = e;
        if (!api.checkValid(mobId)) return;

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

    for (let i = 0; i < arrowAmount; i++) {
      const spreadDir = spreadVector3D(dir, spreadAngle);

      api.attemptCreateThrowable(
        this.playerId,
        "Arrow",
        [x, y + 1.5, z],
        spreadDir,
        1,
        multipleDamage
      );
    }
  };

  public override tick(): void {
    super.tick();

    if (!this.charging || this.currentMode !== RustyRodSkillNames.woodenThornOfGrudge) return;

    const now = api.now();
    const chargeTime = this.diffCharging();

    if (chargeTime < (this.rodSettings[this.currentMode].minCharge ?? 0)) return;
    if (now - this.lastFireTime < this.fireInterval) return;

    this.lastFireTime = now;
    this.castSecondSpell(this.arrowsPerBurst);
  }

  public override onPlayerClick(wasAltClick: boolean): void {
    if (this.currentMode === RustyRodSkillNames.woodenThornOfGrudge) {
      this.lastFireTime = api.now();
    }

    this.startCharging();
  }

  public override onPlayerClickUp(): void {
    const chargeTime = this.stopCharging();

    if (this.currentMode === RustyRodSkillNames.woodenThornOfGrudge) return;
    if (chargeTime === undefined || chargeTime < (this.rodSettings[this.currentMode]?.minCharge || 0)) return;

    this.castSpell(this.currentMode, chargeTime);
  }
}