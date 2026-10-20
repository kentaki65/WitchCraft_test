import { divideVec, findNearest, subtractVec, dot, normalize } from "../../../utils/math";
import { MagicSystem, RodSettings } from "../magicSystem";

type Vec3 = [number, number, number];

enum SpeedRodSkillNames {
  Flashstep,
  Overdrive,
}

export class SpeedRod extends MagicSystem<SpeedRodSkillNames> {
  protected readonly itemName = "Speed Rod";

  protected readonly rodSettings: Record<SpeedRodSkillNames, RodSettings> = {
    [SpeedRodSkillNames.Flashstep]: {
      useThirdParsonView: true,
      needCharge: false,
    },
    [SpeedRodSkillNames.Overdrive]: {
      useThirdParsonView: false,
      needCharge: false,
    }
  };

  protected readonly skills = [
    SpeedRodSkillNames.Flashstep, SpeedRodSkillNames.Overdrive
  ];

  protected readonly MIN_CHARGE = [1, 0] as const;

  castFirstSpell(chargeTime: number): void {
    const dir: Vec3 = normalize(api.getPlayerFacingInfo(this.playerId).dir ?? [0, 0, 1]);
    const max = 75;
    const value = max * (1 - Math.exp(-chargeTime / 500));
    api.applyImpulse(this.playerId, ...dir.map(n => n * value) as Vec3)
  }

  castSecondSpell(chargeTime: number): void {
    api.applyEffect(this.playerId, "Speed", 5000, {
      inbuiltLevel: 10
    })
  };
}