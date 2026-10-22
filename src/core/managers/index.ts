import { GameManager } from "./GameManager";

const gameManager = new GameManager();

export const handlers = {
  tick: gameManager.tick,
  onPlayerJoin: gameManager.onPlayerJoin,
  onPlayerLeave: gameManager.onPlayerLeave,
  onPlayerSelectInventorySlot: gameManager.onPlayerSelectInventorySlot,
  onPlayerSwapInvenSlots: gameManager.onPlayerSwapInvenSlots,
  onPlayerDropItem: gameManager.onPlayerDropItem,
  onPlayerPickedUpItem: gameManager.onPlayerPickedUpItem,
  onAttemptKillPlayer: gameManager.onAttemptKillPlayer,
  onPlayerClick: gameManager.onPlayerClick,
  onPlayerClickUp: gameManager.onPlayerClickUp,
  onPlayerAltAction: gameManager.onPlayerAltAction,
  onPlayerPressedButton: gameManager.onPlayerPressedButton,
  onTouchscreenActionButton: gameManager.onTouchscreenActionButton,
};