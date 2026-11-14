import type * as Types from "@bloxd";
import type { PlayerDbKeys, PlayerData, WorldDbKeys, WorldData } from "../types";

export function setWorldData<K extends WorldDbKeys>(
  key: K, data: WorldData[K]
): void {
  const json = JSON.stringify(data);
  api.setLobbyDbValue(key, json);
}

export function getWorldData<K extends WorldDbKeys>(
  key: K
): WorldData[K] | undefined {
  const raw = api.getLobbyDbValue(key);
  if(typeof raw === "string"){
    try{
      return JSON.parse(raw) as WorldData[K]
    }catch{
      return undefined;
    }
  }
  
  return undefined;
}

export function setPlayerData<K extends PlayerDbKeys>(
  playerId: Types.PlayerId, 
  key: K, 
  data: PlayerData[K]
): void {
  const json = JSON.stringify(data);
  if(!json) return;
  api.setPlayerDbValue(playerId, key, json);
}

export function getPlayerData<K extends PlayerDbKeys>(
  playerId: Types.PlayerId, 
  key: K
): PlayerData[K] | undefined {
  const raw = api.getPlayerDbValue(playerId, key);
  if(raw === undefined) return;

  if(typeof raw === "string"){
    try{
      return JSON.parse(raw) as PlayerData[K]
    }catch{
      return undefined;
    }
  }

  return undefined;
}