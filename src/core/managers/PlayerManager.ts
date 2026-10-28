import type * as Types from "@bloxd";
import { CustomButtonManager } from "./KeyManager";
import { MagicManager } from "../../features/magic/magicManager";

export class PlayerManager {
  readonly playerId: Types.PlayerId;
  readonly magicManager: MagicManager;
  readonly customKeyManager: CustomButtonManager;

  constructor (playerId: Types.PlayerId){
    this.playerId = playerId;
    this.customKeyManager = new CustomButtonManager(playerId);
    this.magicManager = new MagicManager(playerId, this.customKeyManager);
    this.onPlayerJoin();
  }

  onPlayerJoin(){
    this.magicManager.onPlayerJoin(this.playerId);
  }

  onPlayerLeave(): void {
    this.magicManager.onPlayerLeave(this.playerId);
  }

  onPlayerSelectInventorySlot = (_: Types.PlayerId, slot: number) => {
    this.magicManager.onPlayerSelectInventorySlot(this.playerId, slot)
  }

  onPlayerSwapInvenSlots = (_: Types.PlayerId, firstSlot: number, secondSlot: number) => {
    this.magicManager.onPlayerSwapInvenSlots(this.playerId, firstSlot, secondSlot);
  }

  onPlayerDropItem = (_: Types.PlayerId, x: number, y: number, z: number, item: string, amount: number, slot: number): void => {
    this.magicManager.onPlayerDropItem(this.playerId, x, y, z, item, amount, slot);
  }

  onPlayerPickedUpItem = (_: Types.PlayerId, itemName: string, itemAmount: number, itemEntityId: Types.EntityId) => {
    this.magicManager.onPlayerPickedUpItem(this.playerId, itemName, itemAmount, itemEntityId)
  }

  onAttemptKillPlayer = (_: Types.PlayerId): void => {
    this.magicManager.onAttemptKillPlayer(this.playerId);
  }

  tick = () => {
    this.magicManager.tick();
  };

  onPlayerAltAction = (_: Types.PlayerId, ...args: any[]) => {
    this.magicManager.onPlayerAltAction(this.playerId, args);
  };

  onPlayerClick = (_: Types.PlayerId, wasAltClick: boolean, ...args: any[]) => {
    this.magicManager.onPlayerClick(this.playerId, wasAltClick, args);
  }
  
  onPlayerClickUp = (_: Types.PlayerId, wasAltClick: boolean, ...args: any[]) => {
    this.magicManager.onPlayerClickUp(this.playerId, wasAltClick, args);
  };

  onTouchscreenActionButton = (_: Types.PlayerId, touchDown: boolean) => {
    this.magicManager.onTouchscreenActionButton(this.playerId, touchDown)
  };

  onPlayerPressedButton = (_: Types.PlayerId, buttonId: string) => {
    this.magicManager.onPlayerPressedButton(this.playerId, buttonId);
  }
}