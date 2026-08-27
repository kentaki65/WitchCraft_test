import type * as Types from "@bloxd";
import { DbKeys, PlayerData } from "../types";

export function setData<Key extends DbKeys>(
  playerId: Types.PlayerId, 
  key: Key, 
  data: PlayerData[Key]
): void {
  const json = JSON.stringify(data);
  if(!json) return;
  api.setPlayerDbValue(playerId, key, json);
}

export function getData<Key extends DbKeys>(
  playerId: Types.PlayerId, 
  key: Key
): PlayerData[Key] | undefined {
  const raw = api.getPlayerDbValue(playerId, key);
  if(raw === undefined) return;

  if(typeof raw === "string"){
    try{
      return JSON.parse(raw) as PlayerData[Key]
    }catch{
      return undefined;
    }
  }
}