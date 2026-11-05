import type * as Types from "@bloxd";
import { PlayerStates } from "../PlayerStates";
import { ITickable } from "../SurvivalManager";
import { Biome } from "src/core/worldgen/types";
import { world } from "src/core/managers/worldGenerator";
import { createTickInterval } from "src/utils/loop";
import { setTimeout } from "@plugins/helpers"

export class TemperatureSystem implements ITickable {
  private readonly playerId: Types.PlayerId;
  private readonly playerState: PlayerStates;
  private readonly biomeTemperature: Record<Biome, number> = {
    Jungle: 32,
    Desert: 42,
    FrozenBadlandsPlains: -10,
    CactusDesert: 35,
    RedDesert: 48,
    Plains: 22,
    MaplePlains: 18,
    TallGrassPlains: 24,
    SnowyPlains: -8,
    Forest: 20,
    CherryForest: 19,
    PearForest: 21,
    AutumnForest: 14,
    PumpkinForest: 16,
    FrozenBadlandsForest: -12,
    PineForest: 8,
    SnowyPineForest: -15,
    RollingHills: 17,
    SnowyMountains: -25,
    BlueForest: 5,
  };

  private readonly updateTemperature: () => void;
  private readonly updateTemperatureTint: () => void

  constructor(playerId: Types.PlayerId, playerState: PlayerStates) {
    this.playerId = playerId;
    this.playerState = playerState;
    
    this.updateTemperature = createTickInterval(6, () => this._updateTemperature());
    this.updateTemperatureTint = createTickInterval(10, () => this._updateTemperatureTint());
  }

  private _updateTemperature() {
    const [x, _, z] = api.getPosition(this.playerId);
    const biome = world.getBiome(x, z);

    const targetTemp = this.biomeTemperature[biome];
    const currentTemp = this.playerState.get("temp");

    const difference = targetTemp - currentTemp;

    if (Math.abs(difference) < 0.1) this.playerState.set("temp", targetTemp);
    else this.playerState.update("temp", difference * 0.1);
  }

  private _updateTemperatureTint() {
    const t = this.playerState.get("temp");
    const center = 25;
    let r = 0, g = 0, b = 0, a = 0;

    const chestplate = api.getItemSlot(this.playerId, 47);
    const hasHydrated = api.getEffects(this.playerId).includes("Hydrated");

    if (t > 40) {
      if (!hasHydrated) {
        api.applyEffect(this.playerId, "Heatstroke", 1000, { icon: "Heat Resistance" });
        api.attemptApplyDamage({ eId: this.playerId, hitEId: this.playerId, attemptedDmgAmt: 5, withItem: "Fireball" });
      }
    } else if (t < 0) {
      if (chestplate?.name !== "Fur Chestplate") {
        api.applyEffect(this.playerId, "Frostbite", 1000, { icon: "Frozen" });
        api.attemptApplyDamage({ eId: this.playerId, hitEId: this.playerId, attemptedDmgAmt: 5, withItem: "Iceball" });
      }
    }

    if (t > center) {
      const intensity = Math.min((t - center) / 40, 1);
      r = 1; g = 0.25; b = 0; a = 0.3 * intensity;
    } else if (t < center) {
      const intensity = Math.min((center - t) / 40, 1);
      r = 0; g = 0.5; b = 1; a = 0.3 * intensity;
    }

    api.setClientOption(this.playerId, "cameraTint", [r, g, b, a]);
  }

  updateSurvivalEffects() {
    const thirstLow = this.playerState.get("thirst") <= 3;
    const hungerLow = this.playerState.get("hunger") <= 3;

    if (thirstLow && !hungerLow) {
      api.applyEffect(this.playerId, "Slowness", 2000, {
        inbuiltLevel: 8
      });
    } else if (!thirstLow && hungerLow) {
      api.applyEffect(this.playerId, "Weakness", 2000, {
        inbuiltLevel: 8
      });
    } else if (thirstLow && hungerLow) {
      api.attemptApplyDamage({
        eId: this.playerId,
        hitEId: this.playerId,
        attemptedDmgAmt: 5,
        withItem: "Dirt"
      });
    }
  }
  
  onPlayerPotionEffect(effectName: string){
    if(effectName === "Hydrated"){
      setTimeout(() => api.applyEffect(this.playerId, "Hydrated", 720000, {}), 100);
    }
  }
  
  tick() {
    this.updateTemperature();
    this.updateTemperatureTint();
  }
}
