interface PlayerState {
  hunger: number,
  thirst: number,
  temp: number,
}

interface Range {
  min: number; max: number;
}

export class PlayerStates {
  private playerState: PlayerState = {
    hunger: 8,
    thirst: 8,
    temp: 25,
  }

  public readonly stateRange: Record<keyof PlayerState, Range> = {
    "hunger": { min: 0, max: 8 },
    "thirst": { min: 0, max: 8 },
    "temp": { min: -30, max: 50 },
  }

  private _clamp<K extends keyof PlayerState>(key: K, value: PlayerState[K]): PlayerState[K] {
    return Math.min(this.stateRange[key].max, Math.max(this.stateRange[key].min, value));
  }

  get<K extends keyof PlayerState>(key: K): PlayerState[K] {
    return this.playerState[key];
  }

  set<K extends keyof PlayerState>(key: K, value: PlayerState[K]): void {
    this.playerState[key] = this._clamp(key, value);
  }

  update<K extends keyof PlayerState>(key: K, diff: PlayerState[K]): void {
    this.set(key, this.get(key) + diff)
  }
}