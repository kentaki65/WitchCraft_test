import type * as Types from "@bloxd";
import { MagicSystem } from "./magicSystem";
import { MoltenMagmaRod } from "./rods/moltenMagmaRod";
import { DraugrRod } from "./rods/draugrRod";
import { CursedRod } from "./rods/cursedRod";
import { SpeedRod } from "./rods/speedRod";
import { CustomButtonManager } from "../../core/managers/KeyManager";

export class MagicManager {
  protected readonly playerId: Types.PlayerId;
  protected readonly keyManager: CustomButtonManager;
  protected magicSystem: MagicSystem | null;

  constructor(playerId: Types.PlayerId, keyManager: CustomButtonManager) {
    this.playerId = playerId;
    this.keyManager = keyManager;

    this.magicSystem = null;
  }

  onPlayerJoin = (playerId: Types.PlayerId): void => {
    api.setClientOption(playerId, "canFish", false);
    this.updateMagic(playerId);
  }

  onPlayerLeave = (playerId: Types.PlayerId): void => {
    this.magicSystem?.deactivate();
    this.magicSystem = null;
  }

  onPlayerSelectInventorySlot = (
    playerId: Types.PlayerId,
    slot: number
  ) => {    
    if(this.magicSystem) this.magicSystem.deactivate()
    this.updateMagic(playerId, slot);
  };

  onPlayerSwapInvenSlots = (playerId: Types.PlayerId, firstSlot: number, secondSlot: number) => {
    this.magicSystem?.deactivate();
    api.setClientOptionToDefault(playerId, "touchscreenActionButton");

    if (firstSlot >= 0 && firstSlot <= 9) {
      api.setSelectedInventorySlotI(playerId, firstSlot);
      this.updateMagic(playerId, secondSlot);
    }
  }

  onPlayerDropItem = (playerId: Types.PlayerId, x: number, y: number, z: number, item: string, amount: number, slot: number): void => {
    this.magicSystem?.deactivate();
    const selectedSlot = api.getSelectedInventorySlotI(playerId);

    if (selectedSlot !== slot) {
      this.magicSystem?.onEquip();
    } else {
      api.setClientOptionToDefault(
        playerId,
        "touchscreenActionButton"
      );
    }
  }

  onPlayerPickedUpItem = (playerId: Types.PlayerId, itemName: string, itemAmount: number, itemEntityId: Types.EntityId) => {
    this.magicSystem?.onEquip();
  }

  onAttemptKillPlayer = (playerId: Types.PlayerId): void => {
    if (!this.magicSystem) return;
    this.magicSystem?.onPlayerDeath();
  }

  tick = () => {
    this.magicSystem?.tick();
  };

  onPlayerAltAction = (playerId: Types.PlayerId, ...args: any[]) => {
    this.magicSystem?.onPlayerAltAction();
  };

  onPlayerClick = (playerId: Types.PlayerId, ...args: any[]) => {
    this.magicSystem?.onPlayerClick();
  }

  onPlayerClickUp = (playerId: Types.PlayerId, ...args: any[]) => {
    this.magicSystem?.onPlayerClickUp();
  };

  onTouchscreenActionButton = (playerId: Types.PlayerId, touchDown: boolean) => {
    this.magicSystem?.onTouchscreenActionButton(playerId, touchDown)
  };

  onPlayerPressedButton = (playerId: Types.PlayerId, buttonId: string) => {
    this.magicSystem.onPlayerPressedButton(buttonId);
  }

  private updateMagic(id: Types.PlayerId, slot?: number): void {
    const item = slot === undefined
      ? api.getHeldItem(id)
      : api.getItemSlot(id, slot);

    let magic: MagicSystem | undefined;

    switch (item?.name) {
      case "Molten Magma Rod":
        magic = new MoltenMagmaRod(id, 0, this.keyManager);
        break;
      case "Draugr Rod":
        magic = new DraugrRod(id, 0, this.keyManager);
        break;
      case "Cursed Rod":
        magic = new CursedRod(id, 0, this.keyManager);
        break;
      case "Speed Rod":
        magic = new SpeedRod(id, 0, this.keyManager);
        break;
    }

    if (!magic) {
      this.magicSystem = null;
      api.setClientOptionToDefault(id, "touchscreenActionButton");
      return;
    }

    this.magicSystem = magic;
    magic.onEquip();
  }
}