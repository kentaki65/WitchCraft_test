export interface IRegistrableEvent {
  minInterval: number;
  register: () => void;
}

export class EventRegister {
  private readonly events: IRegistrableEvent[] = [
    //インスタンスを置く
  ];

  private readonly minInterval = 3000;
  private readonly maxInterval = 120000;
  private nextEventTime: number | undefined;

  constructor() {
    

  }

  tick() {
    
  }
}