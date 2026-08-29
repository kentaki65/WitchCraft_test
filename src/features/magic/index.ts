import { MagicManager } from "./magicManager";

const magicManager = new MagicManager();

export const handlers = {
  tick: magicManager.tick,
  onPlayerJoin: magicManager.onPlayerJoin,
  onPlayerLeave: magicManager.onPlayerLeave,
  onPlayerSelectInventorySlot: magicManager.onPlayerSelectInventorySlot,
  onPlayerSwapInvenSlots: magicManager.onPlayerSwapInvenSlots,
  onPlayerDropItem: magicManager.onPlayerDropItem,
  onPlayerPickedUpItem: magicManager.onPlayerPickedUpItem,
  onAttemptKillPlayer: magicManager.onAttemptKillPlayer,
  onPlayerClick: magicManager.onPlayerClick,
  onPlayerClickUp: magicManager.onPlayerClickUp,
  onPlayerAltAction: magicManager.onPlayerAltAction,
};