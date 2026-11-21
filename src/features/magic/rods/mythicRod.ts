import { MagicSystem, type PassiveConstructor, type RodSettings } from "../magicSystem";

export enum MythicRodSkillNames {
  divineJudgment = "神の裁き",
  divineWrath = "神の怒り",
  divineMercy = "神の慈悲",
  }

// ### 天使の翼を纏う杖
// パッシブ効果
// - 祝福 一秒に一回発動。HPを全快する。HP回復分魔力を消費。ない場合はある分だけ回復。
// - 正義　自身にダメージを与えた対象に対し、火力が増える。
// - 白翼　空中を（クリエみたいに）自由に移動できるようになる。空中移動した後には敵を追尾する白い結晶が生成される。
// - 加護　自身のHPの1/4以下のダメージを受けないようになる
// 魔法
// - 神の裁き　上空に白い結晶を発生させ、敵に降り注ぐ
// - 神の怒り　対象の位置を特定しその位置に爆発を起こす
// - 神の慈悲　自身と周りの対象のHPを全快させる

// - 神より委譲された権力の全てを行使し、地上の楽園を築く素敵な計画。決して破綻を知らず、その地は全てを包み込み、全てを愛する。しかし、全てに類するべき存在は決定されている。全ての上に君臨するべき君主が決まったとき、それは神ではなく神に成り代わるものだ。神は死んだ。そして神は再生成され、神はこの世に君臨するのだ。そこにかつての信仰はない。
// 広範囲において、神域を形成する。神域内では、対象はパッシブ含め魔法を使えなくなり、HPが即座に回復する。しかし、発動者にこの効果は適用されない。（とち狂ってバカ強すぎるので、アーティファクト込みの最大魔力がなければ表示すらされないようにしてほしい。後使った後は神域を切るまで魔力1で維持されるようにしてほしい）

export class MythicRod extends MagicSystem<MythicRodSkillNames> {
  protected readonly itemName = "Mythic Rod";
  protected readonly rodSettings: Record<MythicRodSkillNames, RodSettings> = {
    [MythicRodSkillNames.divineJudgment]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 500
    },
    [MythicRodSkillNames.divineWrath]: {
      useThirdParsonView: false,
      canCharge: false,
    },
    [MythicRodSkillNames.divineMercy]: {
      useThirdParsonView: false,
      canCharge: false
    }
  };
  
  protected readonly skills: readonly MythicRodSkillNames[] = [
    MythicRodSkillNames.divineJudgment,
    MythicRodSkillNames.divineWrath,
    MythicRodSkillNames.divineMercy
  ];

  protected override passiveClasses: readonly PassiveConstructor[] = [

  ];

  castSpell(mode: MythicRodSkillNames, chargeTime: number): void {

    
  }

}