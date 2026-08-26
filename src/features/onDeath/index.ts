import { DeadPlayer } from "src/core/types";
import { toYMDHMS } from "../../utils/math";
import { setData, getData } from "../db/dbHelper";
import type * as Types from "@bloxd";

onPlayerJoin = (playerId) => {
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

onMobKilledPlayer = onDeath;
onPlayerKilledOtherPlayer = onDeath;