import { randomNumber, randomOnePick, tickToSeconds } from "../../utils/math";
import { WeatherEvent } from "./events/WeatherEvent";
import type { WeatherManager } from "./WeatherManager";

export interface IRegistrableEvent {
  minInterval: number;
  minDuration: number;
  maxDuration: number;
  register: () => void;
  terminate: () => void;
}

export class EventRegister {
  private readonly events: IRegistrableEvent[];

  private count = 0;
  private readonly maxInterval = 200; //テストで10秒 

  private nextEventTime: number | undefined;
  private nextEventEndTime: number | undefined;
  private runningEvent: IRegistrableEvent | undefined;

  private lastTriggered = new Map<IRegistrableEvent, number>();
  
  constructor(weatherManager: WeatherManager) {
    this.events = [
      new WeatherEvent(weatherManager, "rain"),
      new WeatherEvent(weatherManager, "snow"),
    ];

    this.scheduleNextEvent();
  }


  private scheduleNextEvent() {
    const now = tickToSeconds(this.count);
    const waitTime = randomNumber(30, this.maxInterval);

    this.nextEventTime = now + waitTime;
  }

  private getAvailableEvents(): IRegistrableEvent[] {
    const now = tickToSeconds(this.count);

    return this.events.filter(event => {
      const lastTriggered = this.lastTriggered.get(event);

      if (lastTriggered === undefined) return true;

      return now - lastTriggered >= event.minInterval;
    });
  }

  private chooseNextEvent(events: IRegistrableEvent[]): IRegistrableEvent | undefined {
    const nextEvent = randomOnePick(events);
    if (!nextEvent) return undefined;

    return nextEvent;
  }

  private triggerEvent(event: IRegistrableEvent): void {
    if (this.runningEvent) return;

    event.register();

    this.runningEvent = event;
    this.nextEventTime = undefined;
    this.nextEventEndTime =
      tickToSeconds(this.count) + randomNumber(event.minDuration, event.maxDuration);

    this.lastTriggered.set(event, tickToSeconds(this.count));
  }

  tick(): void {
    const now = tickToSeconds(++this.count);

    if (this.nextEventEndTime !== undefined && now >= this.nextEventEndTime) {
      this.runningEvent?.terminate();

      this.runningEvent = undefined;
      this.nextEventEndTime = undefined;

      this.scheduleNextEvent();
    }

    if (this.nextEventTime !== undefined && now >= this.nextEventTime) {
      const event = this.chooseNextEvent(this.getAvailableEvents());

      if (event) {
        this.triggerEvent(event);
      } else {
        this.scheduleNextEvent();
      }
    }
  }
}