import { MagicSystem, type PassiveConstructor, type RodSettings } from "../magicSystem";

export enum CarbonRodSkillNames {
  ironHammer = "鉄槌",
  magicArmor = "魔装甲",
  feignedRetreat = "偽装退却"
}

//### 魔鐵の杖
// パッシブ:魔力伝播　自身の着用している鉄装備にエンチャントが付与される。 
// パッシブ:鉄の意志　HPが0になっても一度だけ30に回復し、100%ダメカットが3秒間付く。クールタイムは15分間。クールタイムはワールドにいる時しか回復しない（ようにできるか？）
// - 鉄鎚　自身から鉄の塊が発射され、攻撃対象へ追尾する。対象に当たった場合、ノックバックとダメージ。チャージ時間によって発射される鉄の塊の量が増える。
// - 魔装甲　自身の攻撃力・防御力強化。
// - 偽装退却　自身の足元から鉄の柱を出現させ、自身の方に柱を押し出し、バックする。バック時、0.2秒前に自身がいた地面から鉄の柱が下から生えてくる。鉄の柱に当たった場合、上へ突き上げられる。チャージ時間によってバック距離・ダメージが増加する。

export class CarbonRod extends MagicSystem<CarbonRodSkillNames> {
  protected override itemName: string = "Carbon Rod";
  protected override rodSettings: Record<CarbonRodSkillNames, RodSettings> = {
    [CarbonRodSkillNames.ironHammer]: {
      canCharge: true,
      minCharge: 2000,
      useThirdParsonView: true
    },
    [CarbonRodSkillNames.magicArmor]: {
      canCharge: false,
      useThirdParsonView: false,
    },
    [CarbonRodSkillNames.feignedRetreat]: {
      canCharge: false,
      useThirdParsonView: false,
    }
  };

  protected override skills: readonly CarbonRodSkillNames[] = [
    CarbonRodSkillNames.ironHammer,
    CarbonRodSkillNames.magicArmor,
    CarbonRodSkillNames.feignedRetreat
  ];

  protected override passiveClasses: readonly PassiveConstructor[] = [

  ];

  protected override castSpell(mode: CarbonRodSkillNames, chargeTime: number): void {
    
  }
}