import type * as Types from "@bloxd";
import { PlayerStates, type PlayerState } from "./PlayerStates";
import { HungerSystem } from "./subsystems/HungerSystem";
import { TemperatureSystem, type TemperatureModifier } from "./subsystems/TemperatureSystem";
import { ThirstSystem } from "./subsystems/ThirstSystem";
import type { Parameters } from "../../core/types";

export interface ITickable {
  tick: () => void;
}

export interface ISurvivalAccessor {
  temperature: {
    addModifier(modifier: TemperatureModifier): string;
    removeModifier(id: string): void;
  };
}

export class SurvivalManager {
  public readonly accessor: ISurvivalAccessor;

  //private readonly playerId: Types.PlayerId;
  private readonly playerState: PlayerStates;
  private readonly hungerSystem: HungerSystem;
  private readonly temperatureSystem: TemperatureSystem;
  private readonly thirstSystem: ThirstSystem;

  constructor(playerId: Types.PlayerId) {
    //this.playerId = playerId;
    this.playerState = new PlayerStates();
    this.hungerSystem = new HungerSystem(playerId, this.playerState);
    this.temperatureSystem = new TemperatureSystem(playerId, this.playerState);
    this.thirstSystem = new ThirstSystem(playerId, this.playerState);
    this.accessor = {
      temperature: {
        addModifier: (modifier) => this.temperatureSystem.addModifier(modifier),
        removeModifier: (id) =>  this.temperatureSystem.removeModifier(id)
      }
    };
  }

  get<K extends keyof PlayerState>(key: K) {
    return this.playerState.get(key);
  }

  onPlayerFinishChargingItem(...args: Parameters<typeof onPlayerFinishChargingItem>) {
    this.hungerSystem.onPlayerFinishChargingItem(...args);
  }

  onPlayerAltAction(...args: Parameters<typeof onPlayerAltAction>) {
    this.thirstSystem.onPlayerAltAction();
  }

  onPlayerPotionEffect([, , effectName]: Parameters<typeof onPlayerPotionEffect>) {
    this.temperatureSystem.onPlayerPotionEffect(effectName);
  }

  tick() {
    this.hungerSystem.tick();
    this.temperatureSystem.tick();
    this.thirstSystem.tick();
  }
}