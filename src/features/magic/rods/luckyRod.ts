import { MagicSystem, type PassiveConstructor, type RodSettings } from "../magicSystem";
import { setTimeout, clearTimeout } from "@plugins/helpers";

export enum LuckyRodSkillNames {
  magicOverload = "魔力微暴走",
  plantOfResentment = "怨嗟の植物",
  byMyOwnHand = "自らの手で"
}

export class LuckyRod extends MagicSystem<LuckyRodSkillNames> {
  protected override itemName: string = "Lucky Rod";

  protected override rodSettings: Record<LuckyRodSkillNames, RodSettings> = {
    [LuckyRodSkillNames.magicOverload]: {
      useThirdParsonView: false,
      canCharge: false,
    },
    [LuckyRodSkillNames.plantOfResentment]: {
      useThirdParsonView: true,
      canCharge: true, minCharge: 1000
    },
    [LuckyRodSkillNames.byMyOwnHand]: {
      canCharge: false,
      useThirdParsonView: false,
    }
  };

  protected override skills: readonly LuckyRodSkillNames[] = [
    LuckyRodSkillNames.magicOverload,
    LuckyRodSkillNames.plantOfResentment,
    LuckyRodSkillNames.byMyOwnHand
  ];

  protected override passiveClasses: readonly PassiveConstructor[] = [];
  protected override castSpell(mode: LuckyRodSkillNames, chargeTime: number): void {
    switch (mode) {
      case LuckyRodSkillNames.magicOverload:
        //this.castFirstSpell(chargeTime);
        break;
      case LuckyRodSkillNames.plantOfResentment:
        //処理
        break;
      case LuckyRodSkillNames.byMyOwnHand:
        //処理
        break;
    }
  }

  //魔力微暴走　効果時間は短いが、かなりのスピード上昇と攻撃力上昇をもたらす。効果が切れた後、鈍足とダメージを受ける
  private castFirstSpell(chargeTime: number) {
    //TODO レベルに応じて動的に変える
    const duration = 10000;
    const damage = 20;
    const level = 4;

    api.applyEffect(this.playerId, "Speed", duration, { inbuiltLevel: level });
    api.applyEffect(this.playerId, "Damage", duration, { inbuiltLevel: level });

    setTimeout(() => {
      api.applyEffect(this.playerId, "Slowness", duration, { inbuiltLevel: level });
      api.attemptApplyDamage({eId: this.playerId, hitEId: this.playerId, attemptedDmgAmt: damage, withItem: this.itemName});
    }, duration, this.playerId);
  }
  
  //怨嗟の植物　前方の広い範囲が対象。下から木の枝が発生し突き上げる
  private castSecondSpell(chargeTime: number) {

  }

  private castThirdSpell(chargeTime: number) {

  }
}