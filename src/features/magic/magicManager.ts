import type * as Types from "@bloxd";
import { MagicSystem } from "./magicSystem";
import { MoltenMagmaRod } from "./rods/moltenMagmaRod";
import { DraugrRod } from "./rods/draugrRod";
import { cursedRod } from "./rods/cursedRod";

export class MagicManager {
  private magics = new Map<Types.PlayerId, MagicSystem>()

  onPlayerJoin = (playerId: Types.PlayerId): void => {
    this.updateMagic(playerId);
  }

  onPlayerLeave = (playerId: Types.PlayerId): void => {
    this.magics.get(playerId)?.deactivate();
    this.magics.delete(playerId);
  }

  onPlayerSelectInventorySlot = (playerId: Types.PlayerId, slot: number) => {
    this.magics.get(playerId)?.deactivate();
    this.updateMagic(playerId, slot);
  }

  onPlayerSwapInvenSlots = (playerId: Types.PlayerId, firstSlot: number, secondSlot: number) => {
    this.magics.get(playerId)?.deactivate();
    api.setClientOptionToDefault(playerId, "touchscreenActionButton");

    if (firstSlot >= 0 && firstSlot <= 9) {
      api.setSelectedInventorySlotI(playerId, firstSlot);
      this.updateMagic(playerId, secondSlot);
    }
  }

  onPlayerDropItem = (playerId: Types.PlayerId, x: number, y: number, z: number, item: string, amount: number, slot: number): void => {
    this.magics.get(playerId)?.deactivate();
    const selectedSlot = api.getSelectedInventorySlotI(playerId);

    if (selectedSlot !== slot) {
      this.magics.get(playerId)?.onEquip();
    } else {
      api.setClientOptionToDefault(
        playerId,
        "touchscreenActionButton"
      );
    }
  }

  onPlayerPickedUpItem = (playerId: Types.PlayerId, itemName: string, itemAmount: number, itemEntityId: Types.EntityId) => {
    this.magics.get(playerId)?.onEquip();
  }

  onAttemptKillPlayer = (playerId: Types.PlayerId): void => {
    const magic = this.magics.get(playerId);
    if (!magic) return;

    magic.onPlayerDeath();
  }

  tick = () => {
    for (const magic of this.magics.values()) {
      magic.tick();
    }
  };

  onPlayerAltAction = (playerId: Types.PlayerId, ...args: any[]) => {
    this.magics.get(playerId)?.onPlayerAltAction();
  };

  onPlayerClick = (playerId: Types.PlayerId, ...args: any[]) => {
    this.magics.get(playerId)?.onPlayerClick();
  }
  
  onPlayerClickUp = (playerId: Types.PlayerId, ...args: any[]) => {
    this.magics.get(playerId)?.onPlayerClickUp();
  };

  onTouchscreenActionButton = (playerId: Types.PlayerId, touchDown: boolean) => {
    this.magics.get(playerId)?.onTouchscreenActionButton(playerId, touchDown)
  };

  private updateMagic(id: Types.PlayerId, slot?: number): void {
    const item = slot === undefined
      ? api.getHeldItem(id)
      : api.getItemSlot(id, slot);

    let magic: MagicSystem | undefined;

    switch (item?.name) {
      case "Molten Magma Rod":
        magic = new MoltenMagmaRod(id);
        break;
      case "Draugr Rod":
        magic = new DraugrRod(id);
        break;
      case "Cursed Rod":
        magic = new cursedRod(id);
        break;
    }

    if (!magic) {
      this.magics.delete(id);
      api.setClientOptionToDefault(id, "touchscreenActionButton");
      return;
    }

    this.magics.set(id, magic);
    magic.onEquip();
  }
}