
import type * as Types from "@bloxd";

export interface IMagicSystem {
  onEquip(): void;
  deactivate(): void;

  tick(): void;
  onPlayerDeath(): void;

  onPlayerAltAction(): void;
  onPlayerClick(): void;
  onPlayerClickUp(): void;

  onTouchscreenActionButton(
    playerId: Types.PlayerId,
    touchDown: boolean
  ): void;

  onPlayerPressedButton(buttonId: string): void;

  getNextSpellName(): string;
}
