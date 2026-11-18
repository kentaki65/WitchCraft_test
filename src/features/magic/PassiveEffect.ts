import type {
  GameEventMap,
  PlayerListener
} from "../../core/helpers/eventListener";

type Subscription = {
  unsubscribe: () => void;
};

export abstract class PassiveEffect {
  private readonly listener: PlayerListener;
  private readonly subscriptions: Subscription[] = [];
  private active = false;

  constructor(listener: PlayerListener) {
    this.listener = listener;
  }

  public activate(): void {
    if (this.active) return;

    this.active = true;

    try {
      this.onActivate();
    } catch (error) {
      this.active = false;
      this.onDeactivate();
      throw error;
    }
  }

  public deactivate(): void {
    if (!this.active) return;

    this.active = false;
    this.onDeactivate();
  }

  public tick(): void { }

  protected subscribe<K extends keyof GameEventMap>(
    type: K,
    callback: (event: GameEventMap[K]) => void,
  ): void {
    this.listener.addEventListener(type, callback);

    this.subscriptions.push({
      unsubscribe: () => {
        this.listener.removeEventListener(type, callback);
      },
    });
  }

  abstract onActivate(): void
  protected onDeactivate(): void{
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions.length = 0;
  }
}