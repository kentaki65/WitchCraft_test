import { DeadPlayer } from "src/core/types";
import { toYMDHMS } from "../../utils/math";
import { setData, getData } from "../../core/api/dbHelper";
import type * as Types from "@bloxd";

function onJoin(playerId: Types.PlayerId){
  api.setClientOption(playerId, "lightingOverride", true);
  const data = getData(playerId, "deadPlayer")

  if (!data || !data.lastDiedPos) {
    const initialDatas: DeadPlayer = {
      lastDiedPos: null,
      lastDiedTime: null,
    }
    setData(playerId, "deadPlayer", initialDatas);
    return;
  }

  const markerPos = data.lastDiedPos;
  const deathTime = data.lastDiedTime;

  if (markerPos.length >= 0) {
    api.setDirectionArrow(
      playerId,
      "lastDiedPos" + playerId,
      markerPos,
      [`${deathTime} 死亡地点`],
      true
    );
  }
}

function onDeath(victim: Types.PlayerId): void {
  const [_, month, day, hour, minute ] = toYMDHMS(Math.floor(api.now() / 1000), 9);
  const pos = api.getPosition(victim);
  api.setDirectionArrow(
    victim,
    "lastDiedPos" + victim,
    pos,
    [`${month}/${day} ${hour}:${minute} 死亡地点`],
    true
  );

  const deadData: DeadPlayer = {
    lastDiedPos: pos,
    lastDiedTime: `${month}/${day} ${hour}:${minute}`
  }

  setData(victim, "deadPlayer", deadData);
}

export const handlers = {
  onPlayerJoin: onJoin,
  onMobKilledPlayer: onDeath,
  onPlayerKilledOtherPlayer: onDeath
}