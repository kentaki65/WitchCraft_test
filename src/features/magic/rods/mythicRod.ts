import { MagicSystem, RodSettings } from "../magicSystem";

enum MythicRodSkillNames {
  Doom, Singularity
}

export class MythicRod extends MagicSystem<MythicRodSkillNames> {
  protected readonly itemName = "Mythic Rod";
  protected readonly rodSettings: Record<MythicRodSkillNames, RodSettings> = {
    [MythicRodSkillNames.Doom]: {
      useThirdParsonView: true,
      needCharge: true,
      minCharge: 2500
    },
    [MythicRodSkillNames.Singularity]: {
      useThirdParsonView: true,
      needCharge: true,
      minCharge: 2500
    }
  };
  protected readonly skills: readonly MythicRodSkillNames[] = [
    MythicRodSkillNames.Doom, MythicRodSkillNames.Singularity
  ];

  castFirstSpell(chargeTime: number){

  }
  
  castSecondSpell(chargeTime: number): void {
    
  }
}