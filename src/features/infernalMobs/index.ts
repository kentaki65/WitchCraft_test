import { handleSpawning } from "./spawn";
import { handleMobAttackingPlayer, handlePlayerAttackingMob } from "./attack";

export const handlers = {
  onWorldSpawnMob: handleSpawning,
  onMobDamagingPlayer: handleMobAttackingPlayer,
  onPlayerDamagingMob: handlePlayerAttackingMob,
}