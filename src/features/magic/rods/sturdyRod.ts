import { MagicSystem, type PassiveConstructor, type RodSettings } from "../magicSystem";

export enum SturdyRodSkillNames {
  crisisAndRest = "危機と休息",
  pastAndOblivion = "過去と忘却",
  resignationAndResistance = "諦観と抵抗"
}

// ### 老樹の杖
// - 危機と休息　HP回復速度上昇と耐久が付く。
// - 過去と忘却　前方に拡散する木の葉を発射する。
// - 諦観と抵抗　前方の対象を束縛し、自身と対象の上下左右から木の棘を対象に向け打ち出す。

export class SturdyRod extends MagicSystem<SturdyRodSkillNames> {
  protected override itemName: string = "Strudy Rod";
  protected override rodSettings: Record<SturdyRodSkillNames, RodSettings> = {
    [SturdyRodSkillNames.crisisAndRest]: {
      useThirdParsonView: false,
      canCharge: false,
    },
    [SturdyRodSkillNames.pastAndOblivion]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 500
    },
    [SturdyRodSkillNames.resignationAndResistance]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 1000
    }
  };

  protected override skills: readonly SturdyRodSkillNames[] = [
    SturdyRodSkillNames.crisisAndRest,
    SturdyRodSkillNames.pastAndOblivion,
    SturdyRodSkillNames.resignationAndResistance
  ];

  protected override passiveClasses: readonly PassiveConstructor[] = [

  ];
  
  protected override castSpell(mode: SturdyRodSkillNames, chargeTime: number): void {
    
  }
}