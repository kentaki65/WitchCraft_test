import type * as Types from "@bloxd";
import { PlayerStates } from "./PlayerStates";
import { HungerSystem } from "./subsystems/HungerSystem";
import { TemperatureSystem } from "./subsystems/TemperatureSystem";
import { ThirstSystem } from "./subsystems/ThirstSystem";
import { Parameters } from "src/core/types";
import { StatusBarSystem } from "./subsystems/StatusBarSystem";

export interface ITickable {
  tick: () => void;
}

export class SurvivalManager {
  private readonly playerId: Types.PlayerId;
  private readonly playerState: PlayerStates;
  private readonly hungerSystem: HungerSystem;
  private readonly temperatureSystem: TemperatureSystem;
  private readonly thirstSystem: ThirstSystem;
  private readonly statusBarSystem: StatusBarSystem;

  constructor(playerId: Types.PlayerId) {
    this.playerId = playerId;
    this.playerState = new PlayerStates();
    this.hungerSystem = new HungerSystem(playerId, this.playerState);
    this.temperatureSystem = new TemperatureSystem(playerId, this.playerState);
    this.thirstSystem = new ThirstSystem(playerId, this.playerState);
    this.statusBarSystem = new StatusBarSystem(playerId, this.playerState);
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
    this.statusBarSystem.tick();
  }
}