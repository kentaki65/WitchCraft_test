import { MagicSystem, type PassiveConstructor, type RodSettings } from "../magicSystem";

export enum FrostRodSkillNames {
  iceAquarium = "アイス・アクアリウム",
  iceSwordBlizzard = "氷剣吹雪",
  iceRoad = "アイス・ロード",
  nightOfFallingIce = "氷塊の降る夜"
}

// ### 凍てつく吹雪の杖
// -アイス・アクアリウム　近くのエンティティ3体を氷で閉じ込める。内部を水で満たす。数秒経ったら消える。
// - 氷剣吹雪　氷の剣のような形をしたものを前方へ飛ばす
// - アイス・ロード　自身の後ろに氷の道を形成し、素早く滑ることで後方へ脱出する。
// - 氷塊の降る夜　前方の広い範囲に大きな氷の塊を降らせる　落ちてくる速度はゆっくりだが、威力が大変高い。

export class FrostRod extends MagicSystem<FrostRodSkillNames> {
  protected override itemName: string = "Frost Rod";
  protected override rodSettings: Record<FrostRodSkillNames, RodSettings> = {
    //押してるときに発動させる
    [FrostRodSkillNames.iceAquarium]: {
      useThirdParsonView: false,
      canCharge: false
    },
    [FrostRodSkillNames.iceSwordBlizzard]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 1000
    },
    [FrostRodSkillNames.iceRoad]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 1000
    },
    //押してるときに降らせる
    [FrostRodSkillNames.nightOfFallingIce]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 100
    },
  };

  protected override skills: readonly FrostRodSkillNames[] = [
    FrostRodSkillNames.iceAquarium,
    FrostRodSkillNames.iceSwordBlizzard,
    FrostRodSkillNames.iceRoad,
    FrostRodSkillNames.nightOfFallingIce
  ];

  protected override castSpell(mode: FrostRodSkillNames, chargeTime: number): void {
    
  }
}