import { MagicSystem, type RodSettings } from "../magicSystem";

export enum TangleResistantRodSkillNames {
  shockwave = "衝撃波",
  airSlash = "エア・スラッシュ",
  downforce = "ダウンフォース",
  tornado = "トルネード",
}

// ### 最古の杖職人の杖
// - 衝撃波　全方位に衝撃を放つ。くらった相手は一秒スタンとダメ
// - エア・スラッシュ　前方へ空気でできた大きな刃を放つ。高火力
// - ダウンフォース　前方のエンティティ一体を下方向へ押し付ける。対象はダメージと2ブロック下に埋まる
// - トルネード　竜巻を起こす。竜巻に巻き込まれた場合、動けなくなり、上空へ浮かび上がり、視界がぐるぐる回る。（リアルへの攻撃）

export class TangleResistantRod extends MagicSystem<TangleResistantRodSkillNames> {
  protected override itemName: string = "Tangle Resistant Rod";
  protected override rodSettings: Record<TangleResistantRodSkillNames, RodSettings> = {
    [TangleResistantRodSkillNames.shockwave]: {
      useThirdParsonView: false,
      canCharge: false
    },
    //押してるときに出す
    [TangleResistantRodSkillNames.airSlash]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 1000
    },
    [TangleResistantRodSkillNames.downforce]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 500
    },
    [TangleResistantRodSkillNames.tornado]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 2500
    },
  };
  protected override skills: readonly TangleResistantRodSkillNames[] = [
    TangleResistantRodSkillNames.shockwave,
    TangleResistantRodSkillNames.airSlash,
    TangleResistantRodSkillNames.downforce,
    TangleResistantRodSkillNames.tornado
  ];

  protected override castSpell(mode: TangleResistantRodSkillNames, chargeTime: number): void {
    
  }
}