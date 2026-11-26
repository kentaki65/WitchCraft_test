import type { PlayerId } from "@bloxd";
import type {
  GameEventMap,
  PlayerListener
} from "../../core/helpers/eventListener";
import type { ISurvivalAccessor } from "../health/SurvivalManager";
import type { CooldownManager } from "../../core/managers/CoolTimeManager";

type Subscription = {
  unsubscribe: () => void;
};

export abstract class PassiveEffect {
  private readonly listener: PlayerListener;
  protected readonly playerId: PlayerId; 
  protected readonly survival: ISurvivalAccessor;
  protected readonly cooldownManager: CooldownManager;

  private readonly subscriptions: Subscription[] = [];
  private active = false;

  constructor(
    listener: PlayerListener,
    survival: ISurvivalAccessor,
    cooldownManager: CooldownManager,
    playerId: PlayerId
  ) {
    this.playerId = playerId;
    this.survival = survival;
    this.listener = listener;
    this.cooldownManager = cooldownManager;
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