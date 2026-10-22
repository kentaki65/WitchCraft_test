import type * as Types from "@bloxd";
import { PlayerManager } from "./PlayerManager";

export class GameManager {
  private players = new Map<Types.PlayerId, PlayerManager>();

  tick = () => {
    for(const callbacks of this.players.values()){
      callbacks?.tick();
    }
  }

  onPlayerJoin = (playerId: Types.PlayerId) => {
    const player = new PlayerManager(playerId);
    this.players.set(playerId, player);
  };

  onPlayerLeave = (playerId: Types.PlayerId) => {
    this.players.get(playerId)?.onPlayerLeave();
    this.players.delete(playerId);
  };

  onPlayerSelectInventorySlot = (
    playerId: Types.PlayerId,
    slot: number
  ) => {
    this.players.get(playerId)?.onPlayerSelectInventorySlot(playerId, slot);
  };

  onPlayerSwapInvenSlots = (
    playerId: Types.PlayerId,
    firstSlot: number,
    secondSlot: number
  ) => {
    this.players.get(playerId)?.onPlayerSwapInvenSlots(playerId, firstSlot, secondSlot);
  };

  onPlayerDropItem = (
    playerId: Types.PlayerId,
    x: number,
    y: number,
    z: number,
    item: string,
    amount: number,
    slot: number
  ) => {
    this.players.get(playerId)?.onPlayerDropItem(playerId, x, y, z, item, amount, slot);
  };

  onPlayerPickedUpItem = (
    playerId: Types.PlayerId,
    itemName: string,
    itemAmount: number,
    itemEntityId: Types.EntityId
  ) => {
    this.players.get(playerId)?.onPlayerPickedUpItem(
      playerId,
      itemName,
      itemAmount,
      itemEntityId
    );
  };

  onAttemptKillPlayer = (playerId: Types.PlayerId) => {
    this.players.get(playerId)?.onAttemptKillPlayer(playerId);
  };

  onPlayerAltAction = (playerId: Types.PlayerId, ...args: any[]) => {
    this.players.get(playerId)?.onPlayerAltAction(playerId, ...args);
  };

  onPlayerClick = (playerId: Types.PlayerId, ...args: any[]) => {
    this.players.get(playerId)?.onPlayerClick(playerId, ...args);
  };

  onPlayerClickUp = (playerId: Types.PlayerId, ...args: any[]) => {
    this.players.get(playerId)?.onPlayerClickUp(playerId, ...args);
  };

  onTouchscreenActionButton = (
    playerId: Types.PlayerId,
    touchDown: boolean
  ) => {
    this.players.get(playerId)?.onTouchscreenActionButton(playerId, touchDown);
  };

  onPlayerPressedButton = (playerId: Types.PlayerId, buttonId: string) => {
    this.players.get(playerId)?.onPlayerPressedButton(playerId, buttonId)
  }
}