import { MagicSystem, type RodSettings } from "../magicSystem";

export enum JungleRodSkillNames {
  entanglementToDeath = "絡まり死に至る",
  masterOfNature = "自然を操るモノ",
  supernaturalBlessing = "超自然的な加護",
  yggdrasil = "ユグドラシル"
}

// ### 世界樹の杖
// - 絡まり死に至る　自身のまわりの地面からツタを発生させ、当たったエンティティに鈍足を付与する
// - 自然を操るモノ　自身の下に葉ブロックが発生する。（これにより空中での機動が行える）発動時、跳躍が付く。葉ブロックは一定秒数後に消える
// - 超自然的な加護　自身に防御とHP回復速度上昇、速度上昇などバフをかける。
// - ユグドラシル　自身のまわり（広範囲）のエンティティ全員に空から光線を降らせる。使用中は動けない。光線は一秒間にエンティティ一体あたり2〜3発降り、7秒程度持続する

export class JungleRod extends MagicSystem<JungleRodSkillNames> {
  protected override itemName: string = "Jungle Rod";

  protected override rodSettings: Record<JungleRodSkillNames, RodSettings> = {
    [JungleRodSkillNames.entanglementToDeath]: {
      useThirdParsonView: false,
      canCharge: false
    },
    [JungleRodSkillNames.masterOfNature]: {
      useThirdParsonView: false,
      canCharge: false
    },
    [JungleRodSkillNames.supernaturalBlessing]: {
      useThirdParsonView: false,
      canCharge: false
    },
    [JungleRodSkillNames.yggdrasil]: {
      useThirdParsonView: true,
      canCharge: true,
      minCharge: 2000
    }
  };

  override skills: readonly JungleRodSkillNames[] = [
    JungleRodSkillNames.entanglementToDeath,
    JungleRodSkillNames.masterOfNature,
    JungleRodSkillNames.supernaturalBlessing,
    JungleRodSkillNames.yggdrasil
  ];

  protected override castSpell(mode: JungleRodSkillNames, chargeTime: number): void {
    
  }
}