import { MagicSystem, RodSettings } from "../magicSystem";

export enum MythicRodSkillNames {
  Doom = "Doom",
  Singularity = "Singularity"
}

export class MythicRod extends MagicSystem<MythicRodSkillNames> {
  protected readonly itemName = "Mythic Rod";
  protected readonly rodSettings: Record<MythicRodSkillNames, RodSettings> = {
    [MythicRodSkillNames.Doom]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 2500
    },
    [MythicRodSkillNames.Singularity]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 2500
    }
  };
  protected readonly skills: readonly MythicRodSkillNames[] = [
    MythicRodSkillNames.Doom, MythicRodSkillNames.Singularity
  ];

  castSpell(mode: MythicRodSkillNames, chargeTime: number): void {
    switch (mode) {
      case MythicRodSkillNames.Doom:
        this.castFirstSpell(chargeTime);
        break;

      case MythicRodSkillNames.Singularity:
        this.castSecondSpell(chargeTime);
        break;
    }
  }

  castFirstSpell(chargeTime: number) {

  }

  castSecondSpell(chargeTime: number): void {

  }
}