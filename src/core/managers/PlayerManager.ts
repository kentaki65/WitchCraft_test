import * as Types from "@bloxd";
import { CustomButtonManager } from "./KeyManager";
import { MagicManager } from "../../features/magic/magicManager";
import { SurvivalManager } from "../../features/health/SurvivalManager";
import { Parameters } from "../types";

type effectNames = "Damage" | "Speed" | "Damage Reduction" | "Invisible" | "Jump Boost" | "Knockback" | "Poisoned" | "Slowness" | "Weakness" | "Cleansed" | "Instant Damage" | "Health Regen" | "Healing Pulse" | "Instant Health" | "Haste" | "Shield" | "Double Jump" | "Heat Resistance" | "Thief" | "X-Ray Vision" | "Mining Yield" | "Brain Rot" | "Aura" | "Wall Climbing" | "Air Walk" | "Pickpocketer" | "Lifesteal" | "Bounciness" | "Blindness" | "Poopy" | "Glowing" | "Night Vision" | "Hydrated";
export class PlayerManager {
  readonly playerId: Types.PlayerId;
  readonly magicManager: MagicManager;
  readonly customKeyManager: CustomButtonManager;
  readonly healthManager: SurvivalManager;

  constructor (playerId: Types.PlayerId){
    this.playerId = playerId;
    this.customKeyManager = new CustomButtonManager(playerId);
    this.magicManager = new MagicManager(playerId, this.customKeyManager);
    this.healthManager = new SurvivalManager(playerId);
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
    this.healthManager.tick();
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
}