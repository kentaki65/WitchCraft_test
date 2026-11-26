import type * as Types from "@bloxd"
import { CustomButtonManager } from "./KeyManager";
import { MagicManager } from "../../features/magic/magicManager";
import { SurvivalManager } from "../../features/health/SurvivalManager";
import type { Parameters } from "../types";
import { RightTextManager } from "../../features/RightInfoTextManager";
import { DungeonManager } from "../../features/structure/DungeonManager";
import type { EventRegister } from "../../features/worldEvents/eventRegister";
import { PlayerListener } from "../helpers/eventListener";
import { CooldownManager } from "./CoolTimeManager";

export class PlayerManager {
  readonly playerId: Types.PlayerId;
  readonly magicManager: MagicManager;
  readonly customKeyManager: CustomButtonManager;
  readonly healthManager: SurvivalManager;
  readonly dungeonManager: DungeonManager;
  readonly rightInfoTextManager: RightTextManager;
  readonly worldEvents: EventRegister;
  readonly playerListener: PlayerListener;
  readonly cooldownManager: CooldownManager;

  constructor (playerId: Types.PlayerId, worldEvent: EventRegister){
    this.playerId = playerId;

    this.healthManager = new SurvivalManager(playerId);
    this.playerListener = new PlayerListener(playerId);
    this.customKeyManager = new CustomButtonManager(playerId);
    this.cooldownManager = new CooldownManager(playerId);

    this.magicManager = new MagicManager(
      playerId, this.customKeyManager, 
      this.playerListener, 
      this.healthManager.accessor,
      this.cooldownManager
    );

    this.rightInfoTextManager = new RightTextManager(
      playerId, 
      this.healthManager
    );
    
    this.dungeonManager = new DungeonManager();
    this.worldEvents = worldEvent;
    this.onPlayerJoin();
  }

  onPlayerJoin(){
    this.cooldownManager.onPlayerJoin(this.playerId);
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
    this.healthManager.tick();
    this.rightInfoTextManager.tick();
    this.cooldownManager.tick();
  };

  onPlayerAltAction = (playerId: string, x: number, y: number, z: number, block: string, targetEId: string | null) => {
    this.healthManager.onPlayerAltAction(this.playerId, x, y, z, block, targetEId);
    this.magicManager.onPlayerAltAction(this.playerId);
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
  
  onPlayerFinishChargingItem = (_: Types.PlayerId, used: boolean, itemName: string, duration: number) => {
    this.healthManager.onPlayerFinishChargingItem(this.playerId, used, itemName, duration);
  }

  onPlayerPotionEffect = (...args: Parameters<typeof onPlayerPotionEffect>) => {
    this.healthManager.onPlayerPotionEffect(args);
  }

  onPlayerRequestChunk = (...args: Parameters<typeof onPlayerRequestChunk>) => {
    this.dungeonManager.onPlayerRequestChunk(...args);
  }
}