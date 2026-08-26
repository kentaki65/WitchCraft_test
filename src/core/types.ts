export interface PlayerData {
  deadPlayer: DeadPlayer;
}

export interface DeadPlayer {
  lastDiedPos: [number, number, number] | null,
  lastDiedTime: string | null;
}

export type DbKeys = keyof PlayerData;