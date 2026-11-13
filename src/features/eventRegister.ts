import { randomNumber, randomOnePick, tickToMs } from "src/utils/math";

export interface IRegistrableEvent {
  minInterval: number;
  minDuration: number;
  maxDuration: number;
  register: () => void;
  terminate: () => void;
}

export class EventRegister {
  private readonly events: IRegistrableEvent[] = [
    //インスタンスを置く
  ];

  private count = 0;
  private readonly maxInterval = 120000;

  private nextEventTime: number | undefined;
  private nextEventEndTime: number | undefined;
  private runningEvent: IRegistrableEvent | undefined;

  private lastTriggered = new Map<IRegistrableEvent, number>();

  private scheduleNextEvent() {
    const now = tickToMs(this.count);
    const waitTime = randomNumber(30000, this.maxInterval);

    this.nextEventTime = now + waitTime;
  }

  private getAvailableEvents(): IRegistrableEvent[] {
    const now = tickToMs(this.count);

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

  private triggerEvent(event: IRegistrableEvent) {
    event.register();

    this.runningEvent = event;
    this.nextEventEndTime = tickToMs(this.count) + randomNumber(event.minDuration, event.maxDuration);
    this.lastTriggered.set(event, tickToMs(this.count));
  }

  tick() {
    const now = tickToMs(++this.count);
    if (this.nextEventTime !== undefined && now >= this.nextEventTime) {
      const avaliableEvents = this.getAvailableEvents();
      const event = this.chooseNextEvent(avaliableEvents);
      if (event) {
        this.triggerEvent(event);
      };
    }

    if (this.nextEventEndTime !== undefined && now >= this.nextEventEndTime) {
      this.runningEvent?.terminate();
      this.scheduleNextEvent();

      this.runningEvent = undefined;
      this.nextEventEndTime = undefined;
    }
  }
}