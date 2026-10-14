import { divideVec, findNearest, subtractVec, dot, normalize } from "../../../utils/math";
import { MagicSystem, RodSettings } from "../magicSystem";
import type * as Types from "@bloxd";

type Vec3 = [number, number, number];

enum SpeedRodSkillNames {
  Flashstep,
  Overdrive,
}

export class SpeedRod extends MagicSystem<SpeedRodSkillNames> {
  protected readonly itemName = "Speed Rod";

  protected readonly rodSettings: Record<SpeedRodSkillNames, RodSettings> = {
    [SpeedRodSkillNames.Flashstep]: {
      needCharge: false,
    },
    [SpeedRodSkillNames.Overdrive]: {
      needCharge: false,
    }
  };

  protected readonly skills = [
    SpeedRodSkillNames.Flashstep, SpeedRodSkillNames.Overdrive
  ];

  protected readonly MIN_CHARGE = [1, 0] as const;

  castFirstSpell(chargeTime: number): void {
    const dir: Vec3 = normalize(api.getPlayerFacingInfo(this.playerId).dir ?? [0, 0, 1]);
    const max = 75;
    const value = max * (1 - Math.exp(-chargeTime / 500));
    api.applyImpulse(this.playerId, ...dir.map(n => n * value) as Vec3)
  }

  castSecondSpell(chargeTime: number): void {
    api.applyEffect(this.playerId, "Speed", 5000, {
      inbuiltLevel: 10
    })
  };

  onPlayerClick = (): void => {
    this.startCharging();
  }

  onPlayerClickUp = (): void => {
    const chargeTime = this.stopCharging();
    if (chargeTime === undefined || chargeTime < (this.rodSettings[this.currentMode]?.minCharge || 0)) return;

    if (!this.crouching) this.castFirstSpell(chargeTime);
    else this.castSecondSpell(chargeTime);
  }

  onPlayerAltAction = (): void => {
    this.startCharging();
  }

  onTouchscreenActionButton = (playerId: Types.PlayerId, touchDown: boolean): void => {
    if (touchDown) {
      this.startCharging();
    } else {
      const chargeTime = this.stopCharging();
      if (chargeTime === undefined || chargeTime < (this.rodSettings[this.currentMode]?.minCharge || 0)) return;

      if (!this.crouching) this.castFirstSpell(chargeTime);
      else this.castSecondSpell(chargeTime);
    }
  }

  tick = (): void => {
    this.updateCrouching();
    if (!this.charging) return;

    const chargeTime = this.diffCharging();
    const color = this.getChargeColor(chargeTime);

    api.shakePlayerCamera(this.playerId, chargeTime / 1e5, 50);
    api.sendFlyingMiddleMessage(this.playerId, [
      { icon: `fa-solid fa-crosshairs`, style: { color, opacity: 0.3 } },
      { str: `\n`.repeat(3) }
    ], 0, 100)

    if (chargeTime > 5000) {
      if (!this.crouching) this.castFirstSpell(chargeTime);
      else this.castSecondSpell(chargeTime);

      this.chargeStart = api.now();
      api.initiateMiddleScreenBar(this.playerId, 5000, true, 0)
      api.setClientOption(this.playerId, `runningSpeed`, 2);
      api.setClientOption(this.playerId, `walkingSpeed`, 2);
    }
  }
}