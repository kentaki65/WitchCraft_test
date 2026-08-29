import { MagicSystem } from "../magicSystem";
import type * as Types from "@bloxd";

export class MoltenMagmaRod extends MagicSystem {
  protected readonly itemName: string = "Molten Magma Rod";

  onPlayerClick = (): void => {
    this.startCharging();
  }

  onPlayerClickUp = (): void => {
    const chargeTime = this.stopCharging();
    if (chargeTime === undefined || chargeTime < 500) return;
    this.castChargedSpell(chargeTime);
  }

  onPlayerAltAction = (): void => {
    this.startCharging();
  }

  onTouchscreenActionButton = (playerId: Types.PlayerId, touchDown: boolean): void => {
    if (touchDown) {
      this.startCharging();
    } else {
      const chargeTime = this.stopCharging();
      if (chargeTime === undefined || chargeTime < 500) return;
      this.castChargedSpell(chargeTime);
    }
  }
  tick = (): void => {
    if (!this.charging) return;
    const chargeTime = this.diffCharging();
    const color = this.getChargeColor(chargeTime);

    api.shakePlayerCamera(this.playerId, chargeTime / 1e2, 50);
    api.sendFlyingMiddleMessage(this.playerId, [
      { icon: `fa-solid fa-crosshairs`, style: { color, opacity: 0.3 } },
      { str: `\n`.repeat(3) }
    ], 0, 100)

    if (chargeTime > 5000) {
      this.castChargedSpell(chargeTime);
      this.chargeStart = api.now();
      api.initiateMiddleScreenBar(this.playerId, 5000, true, 0)
      api.setClientOption(this.playerId, `runningSpeed`, 2);
      api.setClientOption(this.playerId, `walkingSpeed`, 2);
    }
  }
}