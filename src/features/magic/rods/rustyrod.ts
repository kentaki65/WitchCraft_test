import { normalize, spreadVector3D } from "../../../utils/math";
import { MagicSystem, type RodSettings } from "../magicSystem";

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

  //魔力吸収　HPが微回復。自身のスピード、攻撃力にバフ
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

    //TODO レベルに応じてダメージ倍率を変える
    const multipleDamage = 5;
    const spreadAngle = 15 * (Math.PI / 180);

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