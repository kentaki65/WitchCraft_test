import { MagicSystem, RodSettings } from "../magicSystem";

enum BlackIceSkillNames {
  bloodNeedle, aThousandNeedles, 
}

export class BlackIceRod extends MagicSystem<BlackIceSkillNames> {
  protected readonly itemName: string = "Black Ice Rod";
  protected readonly rodSettings: Record<BlackIceSkillNames, RodSettings> = {
    [BlackIceSkillNames.bloodNeedle]: {
      needCharge: false,
      useThirdParsonView: false,
    },
    [BlackIceSkillNames.aThousandNeedles]: {
      needCharge: false,
      useThirdParsonView: false
    },
  };
  protected readonly skills: BlackIceSkillNames[] = [
    BlackIceSkillNames.aThousandNeedles, BlackIceSkillNames.bloodNeedle
  ];

  castSpell(mode: BlackIceSkillNames, chargeTime: number): void {
    switch (mode) {
      case 0:
        this.castFirstSpell(chargeTime);
        break;

      case 1:
        this.castSecondSpell(chargeTime);
        break;
    }
  }

  castFirstSpell(chargeTime: number): void {
    
  }

  castSecondSpell(chargeTime: number): void {
    
  }
}