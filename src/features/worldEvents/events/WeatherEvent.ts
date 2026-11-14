import type { IRegistrableEvent } from "../eventRegister";
import type { WeatherType } from "../WeatherManager";
import { WeatherManager } from "../WeatherManager";

export class WeatherEvent implements IRegistrableEvent {
  minInterval = 180;
  minDuration = 60;
  maxDuration = 180;

  constructor(
    private readonly weatherManager: WeatherManager,
    private readonly weatherType: Exclude<WeatherType, "clear">
  ) {}

  register(): void {
    this.weatherManager.setWeather(this.weatherType);
  }

  terminate(): void {
    this.weatherManager.setWeather("clear");
  }
}