import { setTimeout } from "@plugins/helpers";
import type { AttemptKillData } from "../../../core/helpers/eventListener";
import type { Vec3 } from "../../../core/types";
import { normalize, subtractVec } from "../../../utils/math";
import { MagicSystem, type PassiveConstructor, type RodSettings } from "../magicSystem";
import { PassiveEffect } from "../PassiveEffect";

export enum CarbonRodSkillNames {
  ironHammer = "鉄槌",
  magicArmor = "魔装甲",
  feignedRetreat = "偽装退却"
}

class magicPropagation extends PassiveEffect {
  override onActivate(): void {
    const equipmentsMap = {
      "Helmet": "ヘルメット",
      "Chestplate": "チェストプレート",
      "Gauntlets": "ガントレット",
      "Leggings": "レギンス",
      "Boots": "ブーツ",
      "Equipment": "装備"
    } as const;

    for (let i = 45; i <= 50; i++) {
      const item = api.getItemSlot(this.playerId, i);
      if (!item) continue;

      const type = item.name.split(" ").at(-1) ?? "Equipment";
      const equipmentName = Object.prototype.hasOwnProperty.call(equipmentsMap, type)
        ? equipmentsMap[type as keyof typeof equipmentsMap]
        : equipmentsMap.Equipment;

      api.setItemSlot(this.playerId, i, item.name, 1, {
        customDisplayName: `魔鐵の${equipmentName}`,
        customDescription: "魔鐵によりエンチャントされている...",
        customAttributes: {
          //TODO: 杖のレベルによってエンチャントのレベルを変えよう
          ...api.createEnchantmentAttributesForItem(item.name, 100),
        }
      })
    }
  }
}

class ironWill extends PassiveEffect {
  override onActivate(): void {
    const onAttemptKill = (e: AttemptKillData) => {
      if(this.cooldownManager.isOnCooldown("iron_will")) return;

      setTimeout(() => {
        this.cooldownManager.set("iron_will", 900000);

        api.setHealth(e.killedPlayer, api.getClientOption(e.killedPlayer, "maxHealth"));
        api.applyEffect(e.killedPlayer, "Damage Reduction", 180000 , { inbuiltLevel: 10 });
        if (api.checkValid(e.attackingLifeform)) {
          const attakerPos = api.getPosition(e.attackingLifeform);
          const victimPos = api.getPosition(e.killedPlayer);

          const dir = normalize(subtractVec(victimPos, attakerPos));
          if (!dir) return;

          api.applyImpulse(e.attackingLifeform, ...dir as Vec3);
        }
      }, 100, e.killedPlayer);
      e.preventDeath = true;
    }

    this.subscribe("playerAttemptToBeKilledByMob", e => onAttemptKill(e));
    this.subscribe("playerAttemptToBeKilledByPlayer", e => onAttemptKill(e));
  }
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
    magicPropagation,
    ironWill
  ];

  protected override castSpell(mode: CarbonRodSkillNames, chargeTime: number): void {

  }
}