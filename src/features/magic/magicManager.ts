import type * as Types from "@bloxd";
import { MagicSystem } from "./magicSystem";
import { MoltenMagmaRod } from "./rods/moltenMagmaRod";
import { DraugrRod } from "./rods/draugrRod";

export class MagicManager {
  private magics = new Map<Types.PlayerId, MagicSystem>()

  onPlayerJoin(playerId: Types.PlayerId): void {
    this.updateMagic(playerId);
  }

  onPlayerLeave(playerId: Types.PlayerId): void {
    this.magics.delete(playerId);
  }

  onPlayerSelectInventorySlot(playerId: Types.PlayerId, slot: number){
    this.updateMagic(playerId, slot);
  }

  private updateMagic(id: Types.PlayerId, slot?: number) {
    const item = slot === undefined
      ? api.getHeldItem(id)
      : api.getItemSlot(id, slot);

    if (item?.name === "Molten Magma Rod") {
      const magic = new MoltenMagmaRod(id);

      this.magics.set(id, magic);

      api.setClientOption(
        id,
        "touchscreenActionButton",
        [{ icon: "Molten Magma Rod" }]
      );

      return;
    }

    if (item?.name === "Draugr Rod") {
      this.magics.set(id, new DraugrRod(id));
      return;
    }

    this.magics.delete(id);
    api.setClientOptionToDefault(id, "touchscreenActionButton");
  }
}