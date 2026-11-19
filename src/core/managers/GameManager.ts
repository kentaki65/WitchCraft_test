import type * as Types from "@bloxd";
import { PlayerManager } from "./PlayerManager";
import type { Parameters } from "../types";
import { EventRegister } from "../../features/worldEvents/eventRegister";

export class GameManager {
  private players = new Map<Types.PlayerId, PlayerManager>();
  private worldEvent = new EventRegister();

  tick = () => {
    this.worldEvent.tick();

    for (const callbacks of this.players.values()) {
      callbacks?.tick();
    }
  }

  onPlayerJoin = (playerId: Types.PlayerId) => {
    const player = new PlayerManager(playerId, this.worldEvent);
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

  onPlayerAltAction = (playerId: string, x: number, y: number, z: number, block: string, targetEId: string | null) => {
    this.players.get(playerId)?.onPlayerAltAction(playerId, x, y, z, block, targetEId);
  };

  onPlayerClick = (playerId: Types.PlayerId, wasAltClick: boolean, ...args: any[]) => {
    this.players.get(playerId)?.onPlayerClick(playerId, wasAltClick, ...args);
  };

  onPlayerClickUp = (playerId: Types.PlayerId, wasAltClick: boolean, ...args: any[]) => {
    this.players.get(playerId)?.onPlayerClickUp(playerId, wasAltClick, ...args);
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

  onPlayerFinishChargingItem = (playerId: string, used: boolean, itemName: string, duration: number) => {
    this.players.get(playerId)?.onPlayerFinishChargingItem(playerId, used, itemName, duration);
  }

  onPlayerPotionEffect = (...args: Parameters<typeof onPlayerPotionEffect>) => {
    this.players.get(args[0])?.onPlayerPotionEffect(...args);
  }

  onPlayerRequestChunk = (...args: Parameters<typeof onPlayerRequestChunk>) => {
    this.players.get(args[0])?.onPlayerRequestChunk(...args);
  }
}