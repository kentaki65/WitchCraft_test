import { GameManager } from "./GameManager";

type MethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown
    ? K
    : never;
}[keyof T];
const gameManager = new GameManager();

const methodNames = [
  "tick",
  "onPlayerJoin",
  "onPlayerLeave",
  "onPlayerSelectInventorySlot",
  "onPlayerSwapInvenSlots",
  "onPlayerDropItem",
  "onPlayerPickedUpItem",
  "onAttemptKillPlayer",
  "onPlayerClick",
  "onPlayerClickUp",
  "onPlayerAltAction",
  "onPlayerPressedButton",
  "onTouchscreenActionButton",
  "onPlayerFinishChargingItem",
  "onPlayerPotionEffect",
] satisfies MethodNames<GameManager>[];

export const handlers = Object.fromEntries(
  methodNames.map((name) => [name, gameManager[name].bind(gameManager)])
);