import { MagicSystem, type PassiveConstructor, type RodSettings } from "../magicSystem";

export enum DeepSeaRodSkillNames {
  waterBall = "水球",
  waterManipulation = "水流操作",
  compressedWaterBomb = "圧縮水爆弾",
  nuclearFusion = "核融合"
}

// ### 深海の主の杖

// パッシブ:水親和性　水の中にいる場合、スピード、火力、防御力、回復速度、魔力回復速度がバフされる。 
// パッシブ:無制限の潤い　水ゲージが減らない。&#x20;

// - 水球　前方へ水球を発射する。重力に従って落ちる。地面に落ちた場合、水を落ちた地点を中心に3\*3の範囲で生成する。
// - 水流操作　周りのプレイヤーの水ゲージを0にする。
// - 圧縮水爆弾　水球を発射する。当たった場合、広範囲に爆発を起こす。
// - 核融合　敵の目の前で核融合を起こし、敵の視界を二秒間奪う。これに伴い、小規模な爆発を起こす（第一爆発）。この爆発の後、ダメージは伴わないが、広範囲にガスが発生する第二爆発を起こす。第一爆発に巻き込まれた場合、大ダメージを喰らう。

// また、第二爆発範囲にいた場合、毒、鈍足、火力減効果をつける

export class DeepSeaRod extends MagicSystem<DeepSeaRodSkillNames> {
  protected override itemName: string = "Deep Sea Rod";
  protected override rodSettings: Record<DeepSeaRodSkillNames, RodSettings> = {
    [DeepSeaRodSkillNames.waterBall]: {
      useThirdParsonView: false,
      canCharge: false
    },
    [DeepSeaRodSkillNames.waterManipulation]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 2500,
    },
    [DeepSeaRodSkillNames.compressedWaterBomb]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 1000
    },
    [DeepSeaRodSkillNames.nuclearFusion]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 2500
    }
  }; 
  
  protected override skills: readonly DeepSeaRodSkillNames[] = [
    DeepSeaRodSkillNames.waterBall,
    DeepSeaRodSkillNames.waterManipulation,
    DeepSeaRodSkillNames.compressedWaterBomb,
    DeepSeaRodSkillNames.nuclearFusion
  ];

  protected override passiveClasses: readonly PassiveConstructor[] = [

  ];

  protected override castSpell(mode: DeepSeaRodSkillNames, chargeTime: number): void {
    
  }
}