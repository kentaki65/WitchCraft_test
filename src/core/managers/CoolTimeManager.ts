import type * as Types from "@bloxd";
import { getPlayerData, setPlayerData } from "../helpers/dbHelper";

export class CooldownManager {
  private playerId: Types.PlayerId;
  private cooldowns = new Map<string, number>();

  private saveInterval = 20;
  private elapsedTicks = 0;

  constructor(playerId: Types.PlayerId) {
    this.playerId = playerId;
  }

  set(key: string, duration: number): void {
    this.cooldowns.set(key, duration);
    this.save();
  }

  isOnCooldown(key: string): boolean {
    return (this.cooldowns.get(key) ?? 0) > 0;
  }

  onPlayerJoin(playerId: Types.PlayerId): void {
    const cooldowns = getPlayerData(playerId, "cooldowns");
    if (!cooldowns) return;

    this.cooldowns = new Map(Object.entries(cooldowns));
  }

  tick(): void {
    let changed = false;

    for (const [key, remaining] of this.cooldowns) {
      if (remaining <= 50) {
        this.cooldowns.delete(key);
        changed = true;
      } else {
        api.applyEffect(this.playerId, key, remaining, { displayName: key + "のクールダウン", icon: "Cross" })
        this.cooldowns.set(key, remaining - 50);
      }
    }

    if (++this.elapsedTicks >= this.saveInterval) {
      this.save();
      this.elapsedTicks = 0;
    }
  }

  onPlayerLeave(): void {
    this.save();
  }

  private save(): void {
    api.log(JSON.stringify(Object.fromEntries(this.cooldowns)))
    setPlayerData(this.playerId, "cooldowns", Object.fromEntries(this.cooldowns));
  }
}