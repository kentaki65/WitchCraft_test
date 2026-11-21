import { MagicSystem, type PassiveConstructor, type RodSettings } from "../magicSystem";

export enum MasterRodSkillNames {
  eternalAndUntarnished = "永遠に輝き、曇らない",
  representativeOfTheSun = "太陽の地上における代理人",
  elDorado = "El Dorado",
}

// ### 聖なる意匠の込められた金の杖
// パッシブ:不変不朽　自分のインベントリにGold barが100個以上ある場合、死亡時に金100個と魔力を消費しHPが満タンになる。
// パッシブ:聖銭変換　魔力が最大量の1/4になった場合、Gold Coin,Gold barを消費して魔力を回復する。gold bar一個当たり魔力1/16回復。また、金ブロックの上にいる場合、HP回復速度増加と移動速度上昇、魔力回復などバフがつく
// - 永遠に輝き,曇らない　前方に金塊をたくさんばら撒く。これは重力に沿って落ちる。当たった場合ダメージ。拡散率高め
// - 太陽の地上における代理人　自身の目の前から金色のビームを放つ。
// - El Dorado　周りのブロックを一時的に金に変換する。また、敵は生成された金ブロックに乗っている間ダメージを定期的に受ける

export class MasterRod extends MagicSystem<MasterRodSkillNames> {
  protected override itemName: string = "Master Rod";
  protected override rodSettings: Record<MasterRodSkillNames, RodSettings> = {
    //仮
    [MasterRodSkillNames.eternalAndUntarnished]: {
      useThirdParsonView: false,
      canCharge: false
    },
    //チャージ中ビーム
    [MasterRodSkillNames.representativeOfTheSun]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 500
    },
    //チャージ中段階的に金に変換
    [MasterRodSkillNames.elDorado]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 500
    }
  };

  protected override skills: readonly MasterRodSkillNames[] = [
    MasterRodSkillNames.eternalAndUntarnished,
    MasterRodSkillNames.representativeOfTheSun,
    MasterRodSkillNames.elDorado
  ];

  protected override passiveClasses: readonly PassiveConstructor[] = [

  ];
  
  protected override castSpell(mode: MasterRodSkillNames, chargeTime: number): void {
    
  }
}