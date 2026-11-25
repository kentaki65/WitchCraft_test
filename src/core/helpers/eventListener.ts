import type { 
  LifeformId, 
  ShopCategoryKey, 
  ShopItemKey, 
  BoughtShopItem, 
  BlockName, 
  ItemName, 
  MobType, 
  MobId, 
  MobHerdId,
  MobSetting,
  EntityType,
  MeshEntityVehicleType,
  DamageInfo,
  MultiBlockInfo,
  WorldBlockChangedInfo,
  ClientOption,
  LoadedChunk,
  QTERequestId,
  UiRequestId
} from "@bloxd";

type RecipeInfo = unknown;

interface FishingAttemptOptions {
  caughtItemName?: ItemName;
  biteDelayMs?: number;
  qte?: unknown;
}

interface BlockPos {
  x: number;
  y: number;
  z: number;
}

/** フックが返せる値 (undefined は「何も返さない」扱い) */
type HookResult = string | number | boolean | number[] | object | null | undefined | void;
type HookFn = (...args: any[]) => HookResult;

/* ------------------------------------------------------------------ */
/* MixinLoader                                                         */
/* ------------------------------------------------------------------ */

type MixinCallback = (this: unknown, ...args: any[]) => unknown;

const mixinCallbacks = new Map<string, MixinCallback[]>();

function __mixinRegister(name: string, callback: MixinCallback): void {
  if (typeof name !== "string" || typeof callback !== "function") return;

  let callbacks = mixinCallbacks.get(name);

  // この名前の初回登録時のみ、グローバルにラッパーを仕込む
  if (!callbacks) {
    const list: MixinCallback[] = [];
    callbacks = list;
    mixinCallbacks.set(name, list);

    // すでに同名のグローバル関数があれば、最初のコールバックとして取り込む
    const existing = (globalThis as Record<string, unknown>)[name];
    if (typeof existing === "function") {
      list.push(existing as MixinCallback);
    }

    // 登録された全コールバックを順に呼ぶラッパー。
    // undefined 以外を返した最後のコールバックの値が戻り値になる。
    const wrapper = function (this: unknown, ...args: unknown[]): unknown {
      let result: unknown;
      for (const cb of list) {
        try {
          const value = cb.apply(this, args);
          if (value !== undefined) result = value;
        } catch (error) {
          const e = error as Error;
          api.log(`[MixinLoader/ERROR] ${name} callback failed: ${e.message}`, e.stack);
        }
      }
      return result;
    };

    Object.defineProperty(globalThis, name, {
      configurable: true,
      enumerable: true,
      get: () => wrapper,
      set(next: unknown) {
        // 後から代入された関数はコールバックとして追加する
        if (next !== wrapper && typeof next === "function") {
          list.push(next as MixinCallback);
        }
      },
    });
    (globalThis as Record<string, unknown>)[name] = wrapper;
  }

  callbacks.push(callback);
}

/* ------------------------------------------------------------------ */
/* イベント名                                                          */
/*                                                                     */
/* 命名規則                                                            */
/*  - 〜ed 形 (playerAttackedMob)        : その行為をした側に届く       */
/*  - 〜By 形 (mobWasDamagedByPlayer)    : その行為を受けた側に届く     */
/*  - 〜AttemptTo〜 : 実行前に届く。prevent 系フラグでキャンセル可能    */
/* ------------------------------------------------------------------ */

export const EVENT_NAMES = Object.freeze({
  // --- 攻撃 (攻撃した側) / ダメージ (受けた側) ---
  PLAYER_ATTACKED_PLAYER: "playerAttackedPlayer",
  PLAYER_WAS_DAMAGED_BY_PLAYER: "playerWasDamagedByPlayer",
  PLAYER_ATTACKED_MOB: "playerAttackedMob",
  MOB_WAS_DAMAGED_BY_PLAYER: "mobWasDamagedByPlayer",
  MOB_ATTACKED_PLAYER: "mobAttackedPlayer",
  PLAYER_WAS_DAMAGED_BY_MOB: "playerWasDamagedByMob",
  MOB_ATTACKED_MOB: "mobAttackedMob",
  MOB_WAS_DAMAGED_BY_MOB: "mobWasDamagedByMob",

  // --- キル (倒した側) / 死亡 (倒された側) ---
  PLAYER_KILLED_PLAYER: "playerKilledPlayer",
  PLAYER_WAS_KILLED_BY_PLAYER: "playerWasKilledByPlayer",
  MOB_KILLED_PLAYER: "mobKilledPlayer",
  PLAYER_WAS_KILLED_BY_MOB: "playerWasKilledByMob",
  PLAYER_KILLED_MOB: "playerKilledMob",
  MOB_WAS_KILLED_BY_PLAYER: "mobWasKilledByPlayer",
  MOB_KILLED_MOB: "mobKilledMob",
  MOB_WAS_KILLED_BY_MOB: "mobWasKilledByMob",

  // --- キル/死亡の直前 (preventDeath でキャンセル可能) ---
  PLAYER_ATTEMPT_TO_KILL_PLAYER: "playerAttemptToKillPlayer",
  PLAYER_ATTEMPT_TO_BE_KILLED_BY_PLAYER: "playerAttemptToBeKilledByPlayer",
  MOB_ATTEMPT_TO_KILL_PLAYER: "mobAttemptToKillPlayer",
  PLAYER_ATTEMPT_TO_BE_KILLED_BY_MOB: "playerAttemptToBeKilledByMob",

  // --- Mob ---
  MOB_ATTEMPT_TO_DESPAWN: "mobAttemptToDespawn",

  // --- プレイヤーの行動 ---
  PLAYER_SENT_CHAT_MESSAGE: "playerSentChatMessage",
  PLAYER_RAN_COMMAND: "playerRanCommand",
  PLAYER_DROPPED_ITEM: "playerDroppedItem",
  PLAYER_PICKED_UP_ITEM: "playerPickedUpItem",
  PLAYER_ATTEMPTED_TO_CRAFT_ITEM: "playerAttemptedToCraftItem",
  PLAYER_CLICKED: "playerClicked",
  PLAYER_RELEASED_CLICK: "playerReleasedClick",
  PLAYER_LEFT_GAME: "playerLeftGame",
  PLAYER_JUMPED: "playerJumped",
  PLAYER_REQUESTED_RESPAWN: "playerRequestedRespawn",
  PLAYER_APPLIED_POTION_EFFECT: "playerAppliedPotionEffect",
  PLAYER_CHANGED_BLOCK: "playerChangedBlock",
  PLAYER_ATTEMPTED_TO_OPEN_CHEST: "playerAttemptedToOpenChest",
  PLAYER_ATTEMPTED_TO_SPAWN_MOB: "playerAttemptedToSpawnMob",
  PLAYER_SELECTED_INVENTORY_SLOT: "playerSelectedInventorySlot",
  PLAYER_INVENTORY_UPDATED: "playerInventoryUpdated",
  PLAYER_STARTED_CHARGING_ITEM: "playerStartedChargingItem",
  PLAYER_FINISHED_CHARGING_ITEM: "playerFinishedChargingItem",
  PLAYER_USED_THROWABLE: "playerUsedThrowable",
  PLAYER_THROWABLE_HIT_TERRAIN: "playerThrowableHitTerrain",
  PLAYER_FINISHED_QTE: "playerFinishedQTE",
  PLAYER_TOGGLED_SHOP_MENU: "playerToggledShopMenu",
  PLAYER_BOUGHT_SHOP_ITEM: "playerBoughtShopItem",
  PLAYER_PRESSED_CUSTOM_BUTTON: "playerPressedCustomButton",
  PLAYER_RELEASED_CUSTOM_BUTTON: "playerReleasedCustomButton",
  PLAYER_ATTACK_TRIGGERED: "playerAttackTriggered",
  PLAYER_ATTEMPTED_TO_CHANGE_BLOCK: "playerAttemptedToChangeBlock",
  PLAYER_STOOD_ON_BLOCK: "playerStoodOnBlock",
  PLAYER_STARTED_STANDING_ON_BLOCK: "playerStartedStandingOnBlock",
  PLAYER_STOPPED_STANDING_ON_BLOCK: "playerStoppedStandingOnBlock",
  PLAYER_CRAFTED_ITEM: "playerCraftedItem",
  PLAYER_OPENED_CHEST: "playerOpenedChest",
  PLAYER_ATTEMPTED_TO_MOVE_ITEM_OUT_OF_INVENTORY: "playerAttemptedToMoveItemOutOfInventory",
  PLAYER_ATTEMPTED_TO_MOVE_INVENTORY_ITEM: "playerAttemptedToMoveInventoryItem",
  PLAYER_ATTEMPTED_TO_MOVE_ITEM_INTO_SLOT_RANGE: "playerAttemptedToMoveItemIntoSlotRange",
  PLAYER_ATTEMPTED_TO_SWAP_INVENTORY_SLOTS: "playerAttemptedToSwapInventorySlots",
  PLAYER_ATTEMPTED_TO_MOVE_INVENTORY_ITEM_WITH_AMOUNT: "playerAttemptedToMoveInventoryItemWithAmount",
  PLAYER_ATTEMPTED_ALT_ACTION: "playerAttemptedAltAction",
  PLAYER_PERFORMED_ALT_ACTION: "playerPerformedAltAction",
  PLAYER_CLIENT_OPTION_UPDATED: "playerClientOptionUpdated",
  PLAYER_UPDATED_CHEST: "playerUpdatedChest",
  PLAYER_SPAWNED_MOB: "playerSpawnedMob",
  PLAYER_ATTEMPTED_TO_SPAWN_VEHICLE: "playerAttemptedToSpawnVehicle",
  PLAYER_SPAWNED_VEHICLE: "playerSpawnedVehicle",
  PLAYER_DAMAGED_MESH_ENTITY: "playerDamagedMeshEntity",
  PLAYER_BROKE_MESH_ENTITY: "playerBrokeMeshEntity",
  PLAYER_USED_TOUCHSCREEN_ACTION_BUTTON: "playerUsedTouchscreenActionButton",
  PLAYER_REQUESTED_CHUNK: "playerRequestedChunk",
  PLAYER_ATTEMPTED_TO_FISH: "playerAttemptedToFish",
  PLAYER_SUCCEEDED_FISH_CATCH: "playerSucceededFishCatch",
  PLAYER_FAILED_FISH_CATCH: "playerFailedFishCatch",
  PLAYER_PLAYED_EMOTE: "playerPlayedEmote",
  PLAYER_ENTERED_VEHICLE: "playerEnteredVehicle",
  PLAYER_EXITED_VEHICLE: "playerExitedVehicle",
  PLAYER_RESPONDED_TO_UI_REQUEST: "playerRespondedToUiRequest",
  PLAYER_CLAIMED_TASK: "playerClaimedTask",

  // --- Mob ---
  MOB_SETTING_UPDATED: "mobSettingUpdated",
  MOB_DESPAWNED: "mobDespawned",

  // --- ワールド / ロビー全体 (gameEvents に届く) ---
  WORLD_TICKED: "worldTicked",
  LOBBY_CLOSING: "lobbyClosing",
  PLAYER_JOINED_LOBBY: "playerJoinedLobby",
  PERIODIC_SAVE_REQUESTED: "periodicSaveRequested",
  CHUNK_LOADED: "chunkLoaded",
  WORLD_ATTEMPTED_TO_CHANGE_BLOCK: "worldAttemptedToChangeBlock",
  WORLD_CHANGED_BLOCK: "worldChangedBlock",
  WORLD_ATTEMPTED_TO_SPAWN_MOB: "worldAttemptedToSpawnMob",
  WORLD_SPAWNED_MOB: "worldSpawnedMob",
  WORLD_ATTEMPTED_TO_SPAWN_VEHICLE: "worldAttemptedToSpawnVehicle",
  WORLD_SPAWNED_VEHICLE: "worldSpawnedVehicle",
  VEHICLE_DESPAWNED: "vehicleDespawned",
  ENTITY_DELETED: "entityDeleted",
  ENTITIES_COLLIDED: "entitiesCollided",
  MESH_ENTITY_CREATED: "meshEntityCreated",
  ITEM_DROP_CREATED: "itemDropCreated",
} as const);

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

/* ------------------------------------------------------------------ */
/* イベントデータの型                                                  */
/* ------------------------------------------------------------------ */

interface PlayerIdData {
  playerId: LifeformId;
}

interface DamageDataBase {
  damageDealt: number;
  withItem: string;
  preventDamage: boolean;
  /** リスナーが書き換えるとダメージ量を変更できる */
  damage: number;
}

export interface PlayerDamagePlayerData extends DamageDataBase {
  attackingPlayer: LifeformId;
  damagedPlayer: LifeformId;
  bodyPartHit: string;
  damagerDbId: string;
  damageInfo: DamageInfo;
}

export interface PlayerDamageMobData extends DamageDataBase {
  playerId: LifeformId;
  mobId: LifeformId;
  damagerDbId: string;
  damageInfo: DamageInfo;
}

export interface MobDamagePlayerData extends DamageDataBase {
  attackingMob: LifeformId;
  damagedPlayer: LifeformId;
  damageInfo: DamageInfo;
}

export interface MobDamageMobData extends DamageDataBase {
  attackingMob: LifeformId;
  damagedMob: LifeformId;
  damageInfo: DamageInfo;
}

interface KillDataBase {
  damageDealt: number;
  withItem: string;
}

export interface PlayerKillPlayerData extends KillDataBase {
  attackingPlayer: LifeformId;
  killedPlayer: LifeformId;
  keepInventory: boolean;
}

export interface MobKillPlayerData extends KillDataBase {
  attackingMob: LifeformId;
  killedPlayer: LifeformId;
  keepInventory: boolean;
}

export interface PlayerKillMobData extends KillDataBase {
  playerId: LifeformId;
  mobId: LifeformId;
  preventDrop: boolean;
}

export interface MobKillMobData extends KillDataBase {
  attackingMob: LifeformId;
  killedMob: LifeformId;
  preventDrop: boolean;
}

export interface AttemptKillData {
  killedPlayer: LifeformId;
  attackingLifeform: LifeformId;
  preventDeath: boolean;
}

export interface AttemptDespawnData {
  mobId: LifeformId;
  preventDespawn: boolean;
}

export interface BlockChangeData extends PlayerIdData {
  x: number;
  y: number;
  z: number;
  fromBlock: string;
  toBlock: string;
  droppedItem: unknown;
  fromBlockInfo: unknown;
  toBlockInfo: unknown;
  preventChange: boolean;
  dropsPrevented: boolean;
  preventDrop: boolean;
  droppedItemPosition: number[] | null;
}

export interface ClickData extends PlayerIdData {
  wasAltClick: boolean;
  x: number;
  y: number;
  z: number;
  block: string;
  targetEId: LifeformId | null;
}

export interface PotionEffectData {
  initiatorId: LifeformId;
  targetEId: LifeformId;
  effectName: string;
  preventEffect: boolean;
}

export interface ThrowableData extends PlayerIdData {
  throwableName: string;
  thrownLifeformId: LifeformId;
}

export interface CommandData extends PlayerIdData {
  cmd: string;
  trueCommand: boolean;
}

export interface ChatData extends PlayerIdData {
  message: string;
  channelName: string;
  isBroadcast: boolean;
  prefix: string | null;
}

export interface CraftData extends PlayerIdData {
  itemName: string;
  craftingIdx: number;
  craftTimes: number;
  preventCraft: boolean;
}

export interface OpenChestData extends PlayerIdData {
  x: number;
  y: number;
  z: number;
  isMoonstoneChest: boolean;
  isIronChest: boolean;
  preventOpen: boolean;
}

export interface SpawnMobData extends PlayerIdData {
  mobType: string;
  x: number;
  y: number;
  z: number;
  preventSpawn: boolean;
}

export interface DropData extends PlayerIdData {
  x: number;
  y: number;
  z: number;
  itemName: string;
  itemAmount: number;
  fromIdx: number;
  preventDrop: boolean;
  allowButNoDroppedItemCreated: boolean;
}

export interface GameEventMap {
  // 攻撃 / ダメージ
  playerAttackedPlayer: PlayerDamagePlayerData;
  playerWasDamagedByPlayer: PlayerDamagePlayerData;
  playerAttackedMob: PlayerDamageMobData;
  mobWasDamagedByPlayer: PlayerDamageMobData;
  mobAttackedPlayer: MobDamagePlayerData;
  playerWasDamagedByMob: MobDamagePlayerData;
  mobAttackedMob: MobDamageMobData;
  mobWasDamagedByMob: MobDamageMobData;

  // キル / 死亡
  playerKilledPlayer: PlayerKillPlayerData;
  playerWasKilledByPlayer: PlayerKillPlayerData;
  mobKilledPlayer: MobKillPlayerData;
  playerWasKilledByMob: MobKillPlayerData;
  playerKilledMob: PlayerKillMobData;
  mobWasKilledByPlayer: PlayerKillMobData;
  mobKilledMob: MobKillMobData;
  mobWasKilledByMob: MobKillMobData;

  // キル/死亡の直前
  playerAttemptToKillPlayer: AttemptKillData;
  playerAttemptToBeKilledByPlayer: AttemptKillData;
  mobAttemptToKillPlayer: AttemptKillData;
  playerAttemptToBeKilledByMob: AttemptKillData;

  // Mob
  mobAttemptToDespawn: AttemptDespawnData;

  // プレイヤーの行動
  playerSentChatMessage: ChatData;
  playerRanCommand: CommandData;
  playerDroppedItem: DropData;
  playerPickedUpItem: PlayerIdData & { itemName: string; itemAmount: number; itemLifeformId: LifeformId };
  playerAttemptedToCraftItem: CraftData;
  playerClicked: ClickData;
  playerReleasedClick: ClickData;
  playerLeftGame: PlayerIdData;
  playerJumped: PlayerIdData;
  playerRequestedRespawn: PlayerIdData;
  playerAppliedPotionEffect: PotionEffectData;
  playerChangedBlock: BlockChangeData;
  playerAttemptedToOpenChest: OpenChestData;
  playerAttemptedToSpawnMob: SpawnMobData;
  playerSelectedInventorySlot: PlayerIdData & { slotIndex: number };
  playerInventoryUpdated: PlayerIdData;
  playerStartedChargingItem: PlayerIdData & { itemName: string; preventCharge: boolean };
  playerFinishedChargingItem: PlayerIdData & { used: boolean; itemName: string; duration: number };
  playerUsedThrowable: ThrowableData;
  playerThrowableHitTerrain: ThrowableData;
  playerFinishedQTE: PlayerIdData & { qteId: string; result: unknown };
  playerToggledShopMenu: PlayerIdData & { isOpen: boolean };
  playerBoughtShopItem: PlayerIdData & {
    categoryKey: ShopCategoryKey;
    itemKey: ShopItemKey;
    item: BoughtShopItem;
    userInput?: string;
  };
  playerPressedCustomButton: PlayerIdData & { buttonId: string };
  playerReleasedCustomButton: PlayerIdData & { buttonId: string };
  playerAttackTriggered: PlayerIdData;
  playerAttemptedToChangeBlock: PlayerIdData &
    BlockPos & {
      fromBlock: BlockName;
      toBlock: BlockName;
      droppedItem: BlockName | null;
      fromBlockInfo: MultiBlockInfo;
      toBlockInfo: MultiBlockInfo;
      preventChange: boolean;
    };
  playerStoodOnBlock: PlayerIdData & BlockPos & { blockName: BlockName };
  playerStartedStandingOnBlock: PlayerIdData & BlockPos & { blockName: BlockName };
  playerStoppedStandingOnBlock: PlayerIdData & BlockPos & { blockName: BlockName };
  playerCraftedItem: PlayerIdData & {
    itemName: string;
    craftingIdx: number;
    recipe: RecipeInfo;
    craftTimes: number;
  };
  playerOpenedChest: PlayerIdData &
    BlockPos & { isMoonstoneChest: boolean; isIronChest: boolean };
  playerAttemptedToMoveItemOutOfInventory: PlayerIdData & {
    itemName: string;
    itemAmount: number;
    fromIdx: number;
    movementType: string;
    preventChange: boolean;
  };
  playerAttemptedToMoveInventoryItem: PlayerIdData & {
    fromIdx: number;
    toStartIdx: number;
    toEndIdx: number;
    amt: number;
    preventChange: boolean;
  };
  playerAttemptedToMoveItemIntoSlotRange: PlayerIdData & {
    start: number;
    end: number;
    moveIdx: number;
    itemAmount: number;
    preventChange: boolean;
  };
  playerAttemptedToSwapInventorySlots: PlayerIdData & { i: number; j: number; preventChange: boolean };
  playerAttemptedToMoveInventoryItemWithAmount: PlayerIdData & {
    i: number;
    j: number;
    amt: number;
    preventChange: boolean;
  };
  playerAttemptedAltAction: PlayerIdData &
    BlockPos & { block: BlockName; targetEId: LifeformId | null; preventAction: boolean };
  playerPerformedAltAction: PlayerIdData & BlockPos & { block: BlockName; targetEId: LifeformId | null };
  playerClientOptionUpdated: PlayerIdData & { option: ClientOption; value: unknown };
  /** playerId ではなく initiatorEId (操作したプレイヤーのID) を持つ。x/y/z は Moonstone Chest のとき null */
  playerUpdatedChest: {
    initiatorEId: LifeformId;
    isMoonstoneChest: boolean;
    x: number | null;
    y: number | null;
    z: number | null;
  };
  playerSpawnedMob: PlayerIdData &
    BlockPos & {
      mobId: MobId;
      mobType: MobType;
      mobHerdId: MobHerdId;
      playSoundOnSpawn: boolean;
    };
  playerAttemptedToSpawnVehicle: PlayerIdData &
    BlockPos & { vehicleType: MeshEntityVehicleType; preventSpawn: boolean };
  playerSpawnedVehicle: PlayerIdData &
    BlockPos & { vehicleEId: LifeformId; vehicleType: MeshEntityVehicleType };
  playerDamagedMeshEntity: PlayerIdData & { damagedId: LifeformId; damageDealt: number; withItem: string };
  playerBrokeMeshEntity: PlayerIdData & { LifeformId: LifeformId };
  playerUsedTouchscreenActionButton: PlayerIdData & { touchDown: boolean };
  playerRequestedChunk: PlayerIdData & {
    chunkX: number;
    chunkY: number;
    chunkZ: number;
    chunkId: string;
  };
  playerAttemptedToFish: PlayerIdData &
    BlockPos & {
      rodName: string;
      preventFish: boolean;
      /** 設定すると釣りの内容 (魚の種類、待ち時間、QTE) を上書きできる */
      fishingOptions: FishingAttemptOptions | null;
    };
  playerSucceededFishCatch: PlayerIdData &
    BlockPos & {
      rodName: string;
      caughtItemName: ItemName;
      preventDrop: boolean;
      preventItemGrant: boolean;
    };
  playerFailedFishCatch: PlayerIdData & BlockPos & { rodName: string; caughtItemName: ItemName };
  playerPlayedEmote: PlayerIdData & { emoteId: string };
  playerEnteredVehicle: PlayerIdData & { vehicleType: MeshEntityVehicleType; vehicleEId: LifeformId };
  playerExitedVehicle: PlayerIdData & { vehicleType: MeshEntityVehicleType; vehicleEId: LifeformId };
  playerRespondedToUiRequest: PlayerIdData & { id: UiRequestId; response: boolean };
  playerClaimedTask: PlayerIdData & { taskId: unknown; isPromoTask: unknown; claimedRewards: unknown };

  // Mob
  mobSettingUpdated: { mobId: MobId; setting: MobSetting; value: unknown };
  mobDespawned: { mobId: MobId };

  // ワールド / ロビー全体
  worldTicked: { ms: number };
  lobbyClosing: { serverIsShuttingDown: boolean };
  /** PlayerListener はこのイベントの前に自動で作成される */
  playerJoinedLobby: PlayerIdData & { fromGameReset: boolean; player: PlayerListener };
  periodicSaveRequested: Record<string, never>;
  chunkLoaded: { chunkId: string; chunk: LoadedChunk; wasPersistedChunk: boolean };
  worldAttemptedToChangeBlock: BlockPos & {
    fromBlock: BlockName;
    toBlock: BlockName;
    initiatorDbId: string | null;
    extraInfo: WorldBlockChangedInfo;
    preventChange: boolean;
  };
  worldChangedBlock: BlockPos & {
    fromBlock: BlockName;
    toBlock: BlockName;
    initiatorDbId: string | null;
    extraInfo: WorldBlockChangedInfo;
    dropsPrevented: boolean;
    preventChange: boolean;
    preventDrop: boolean;
  };
  worldAttemptedToSpawnMob: BlockPos & { mobType: MobType; preventSpawn: boolean };
  worldSpawnedMob: BlockPos & {
    mobId: MobId;
    mobType: MobType;
    mobHerdId: MobHerdId;
    playSoundOnSpawn: boolean;
  };
  worldAttemptedToSpawnVehicle: BlockPos & { vehicleType: MeshEntityVehicleType; preventSpawn: boolean };
  worldSpawnedVehicle: BlockPos & { vehicleEId: LifeformId; vehicleType: MeshEntityVehicleType };
  vehicleDespawned: { vehicleEId: LifeformId; vehicleType: MeshEntityVehicleType };
  entityDeleted: { eId: LifeformId; entityType: EntityType };
  entitiesCollided: { eId: LifeformId; otherEId: LifeformId };
  meshEntityCreated: { eId: LifeformId; type: string; initiatorId: LifeformId | null };
  itemDropCreated: BlockPos & { itemEId: LifeformId; itemName: string; itemAmount: number };
}

export interface ListenerOptions {
  once?: boolean;
  /** 大きいほど先に実行される */
  priority?: number;
}

interface ListenerEntry<T> {
  callback: (e: T) => void;
  once: boolean;
  priority: number;
}

export class EventTarget<M extends { [K in keyof M]: unknown } = GameEventMap> {
  private _listeners: { [K in keyof M]?: ListenerEntry<M[K]>[] } = {};

  addEventListener<K extends keyof M>(
    type: K,
    callback: (e: M[K]) => void,
    options: ListenerOptions = {},
  ): void {
    const list = (this._listeners[type] ??= []);
    list.push({
      callback,
      once: !!options.once,
      priority: options.priority ?? 0,
    });
    list.sort((a, b) => b.priority - a.priority);
  }

  dispatchEvent<K extends keyof M>(type: K, e: M[K]): void {
    const list = this._listeners[type];
    if (!list) return;

    // once のリスナーは「実行前」に外す。実行後に外すと、コールバック内の処理が
    // 同じイベントを再度発火させたとき (例: リスナー内で attemptApplyDamage →
    // 同じ mobWasDamagedByPlayer) に自分自身が再実行され、無限再帰になる。
    // また、実行中の add/remove の影響を受けないようコピーを走査する。
    for (const listener of [...list]) {
      if (listener.once) {
        const idx = list.indexOf(listener);
        if (idx === -1) continue; // 実行中に他のリスナーが外した
        list.splice(idx, 1);
      }
      listener.callback(e);
    }
  }

  removeEventListener<K extends keyof M>(type: K, callback: (e: M[K]) => void): void {
    const list = this._listeners[type];
    if (!list) return;

    const idx = list.findIndex((v) => v.callback === callback);
    if (idx !== -1) {
      list.splice(idx, 1);
    }
  }
}
export class MobListener extends EventTarget<GameEventMap> {
  constructor(public readonly id: LifeformId) {
    super();
    mobMap.set(this.id, this);
  }

  destroy(): void {
    mobMap.delete(this.id);
  }
}

export class PlayerListener extends EventTarget<GameEventMap> {
  constructor(public readonly id: LifeformId) {
    super();
    playerMap.set(this.id, this);
  }

  destroy(): void {
    playerMap.delete(this.id);
  }
}

const mobMap = new Map<LifeformId, MobListener>();
const playerMap = new Map<LifeformId, PlayerListener>();

export const gameEvents = new EventTarget<GameEventMap>();

const exclusion = new Set<string>([]);

interface EventHookDef {
  /** グローバルに登録するフック名 */
  handler: string;
  event: EventName;
  /**
   * イベントの届け先。省略時は "player"。
   *  - "player": 第1引数のIDのプレイヤー
   *  - "mob": 第1引数のIDのMob
   *  - "global": gameEvents
   */
  target?: "player" | "mob" | "global";
  /** フック引数の名前 (イベントデータのキーになる) */
  args: readonly string[];
  /** イベントデータに追加するデフォルト値 */
  defaults?: Record<string, unknown>;
  extra?: (listener: PlayerListener | MobListener | undefined) => void;
  /** undefined 以外を返すとそれがフックの戻り値になる */
  returnIf?: (data: any) => HookResult;
}

const eventHooks: readonly EventHookDef[] = [
  {
    handler: "onPlayerLeave",
    event: EVENT_NAMES.PLAYER_LEFT_GAME,
    args: ["playerId"],
    extra: (player) => player?.destroy(),
  },
  {
    handler: "onPlayerJump",
    event: EVENT_NAMES.PLAYER_JUMPED,
    args: ["playerId"],
  },
  {
    handler: "onRespawnRequest",
    event: EVENT_NAMES.PLAYER_REQUESTED_RESPAWN,
    args: ["playerId"],
  },
  {
    handler: "onPlayerPickedUpItem",
    event: EVENT_NAMES.PLAYER_PICKED_UP_ITEM,
    args: ["playerId", "itemName", "itemAmount", "itemLifeformId"],
  },
  {
    handler: "onPlayerSelectInventorySlot",
    event: EVENT_NAMES.PLAYER_SELECTED_INVENTORY_SLOT,
    args: ["playerId", "slotIndex"],
  },
  {
    handler: "onInventoryUpdated",
    event: EVENT_NAMES.PLAYER_INVENTORY_UPDATED,
    args: ["playerId"],
  },
  {
    handler: "onPlayerClick",
    event: EVENT_NAMES.PLAYER_CLICKED,
    args: ["playerId", "wasAltClick", "x", "y", "z", "block", "targetEId"],
  },
  {
    handler: "onPlayerClickUp",
    event: EVENT_NAMES.PLAYER_RELEASED_CLICK,
    args: ["playerId", "wasAltClick", "x", "y", "z", "block", "targetEId"],
  },
  {
    handler: "onPlayerPotionEffect",
    event: EVENT_NAMES.PLAYER_APPLIED_POTION_EFFECT,
    args: ["initiatorId", "targetEId", "effectName"],
    defaults: { preventEffect: false },
    returnIf: (d: PotionEffectData) => (d.preventEffect ? "preventEffect" : undefined),
  },
  {
    handler: "onPlayerUsedThrowable",
    event: EVENT_NAMES.PLAYER_USED_THROWABLE,
    args: ["playerId", "throwableName", "thrownLifeformId"],
  },
  {
    handler: "onPlayerThrowableHitTerrain",
    event: EVENT_NAMES.PLAYER_THROWABLE_HIT_TERRAIN,
    args: ["playerId", "throwableName", "thrownLifeformId"],
  },
  {
    handler: "onPlayerStartChargingItem",
    event: EVENT_NAMES.PLAYER_STARTED_CHARGING_ITEM,
    args: ["playerId", "itemName"],
    defaults: { preventCharge: false },
    returnIf: (d: { preventCharge: boolean }) => (d.preventCharge ? "preventCharge" : undefined),
  },
  {
    handler: "onPlayerFinishChargingItem",
    event: EVENT_NAMES.PLAYER_FINISHED_CHARGING_ITEM,
    args: ["playerId", "used", "itemName", "duration"],
  },
  {
    handler: "onPlayerFinishQTE",
    event: EVENT_NAMES.PLAYER_FINISHED_QTE,
    args: ["playerId", "qteId", "result"],
  },
  {
    handler: "onPlayerToggledShopMenu",
    event: EVENT_NAMES.PLAYER_TOGGLED_SHOP_MENU,
    args: ["playerId", "isOpen"],
  },
  {
    handler: "onPlayerBoughtShopItem",
    event: EVENT_NAMES.PLAYER_BOUGHT_SHOP_ITEM,
    args: ["playerId", "categoryKey", "itemKey", "item", "userInput"],
  },
  {
    handler: "onPlayerPressedButton",
    event: EVENT_NAMES.PLAYER_PRESSED_CUSTOM_BUTTON,
    args: ["playerId", "buttonId"],
  },
  {
    handler: "onPlayerReleasedButton",
    event: EVENT_NAMES.PLAYER_RELEASED_CUSTOM_BUTTON,
    args: ["playerId", "buttonId"],
  },
  {
    handler: "playerCommand",
    event: EVENT_NAMES.PLAYER_RAN_COMMAND,
    args: ["playerId", "cmd"],
    defaults: { trueCommand: true },
    returnIf: (d: CommandData) => (d.trueCommand ? undefined : false),
  },
  {
    handler: "onPlayerChat",
    event: EVENT_NAMES.PLAYER_SENT_CHAT_MESSAGE,
    args: ["playerId", "message", "channelName"],
    defaults: { isBroadcast: true, prefix: null },
    returnIf: (d: ChatData) => (!d.isBroadcast ? false : d.prefix ?? undefined),
  },
  {
    handler: "onPlayerAttemptCraft",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_TO_CRAFT_ITEM,
    args: ["playerId", "itemName", "craftingIdx", "craftTimes"],
    defaults: { preventCraft: false },
    returnIf: (d: CraftData) => (d.preventCraft ? "preventCraft" : undefined),
  },
  {
    handler: "onPlayerAttemptOpenChest",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_TO_OPEN_CHEST,
    args: ["playerId", "x", "y", "z", "isMoonstoneChest", "isIronChest"],
    defaults: { preventOpen: false },
    returnIf: (d: OpenChestData) => (d.preventOpen ? "preventOpen" : undefined),
  },
  {
    handler: "onPlayerAttemptSpawnMob",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_TO_SPAWN_MOB,
    args: ["playerId", "mobType", "x", "y", "z"],
    defaults: { preventSpawn: false },
    returnIf: (d: SpawnMobData) => (d.preventSpawn ? "preventSpawn" : undefined),
  },
  {
    handler: "onPlayerDropItem",
    event: EVENT_NAMES.PLAYER_DROPPED_ITEM,
    args: ["playerId", "x", "y", "z", "itemName", "itemAmount", "fromIdx"],
    defaults: { preventDrop: false, allowButNoDroppedItemCreated: false },
    returnIf: (d: DropData) =>
      d.preventDrop
        ? "preventDrop"
        : d.allowButNoDroppedItemCreated
          ? "allowButNoDroppedItemCreated"
          : undefined,
  },

  /* ---- 以下、後から追加したプレイヤー対象のフック ---- */
  {
    handler: "onPlayerAttack",
    event: EVENT_NAMES.PLAYER_ATTACK_TRIGGERED,
    args: ["playerId"],
  },
  {
    handler: "onPlayerAttemptChangeBlock",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_TO_CHANGE_BLOCK,
    args: ["playerId", "x", "y", "z", "fromBlock", "toBlock", "droppedItem", "fromBlockInfo", "toBlockInfo"],
    defaults: { preventChange: false },
    returnIf: (d: { preventChange: boolean }) => (d.preventChange ? "preventChange" : undefined),
  },
  {
    handler: "onBlockStand",
    event: EVENT_NAMES.PLAYER_STOOD_ON_BLOCK,
    args: ["playerId", "x", "y", "z", "blockName"],
  },
  {
    handler: "onBlockStandStart",
    event: EVENT_NAMES.PLAYER_STARTED_STANDING_ON_BLOCK,
    args: ["playerId", "x", "y", "z", "blockName"],
  },
  {
    handler: "onBlockStandStop",
    event: EVENT_NAMES.PLAYER_STOPPED_STANDING_ON_BLOCK,
    args: ["playerId", "x", "y", "z", "blockName"],
  },
  {
    handler: "onPlayerCraft",
    event: EVENT_NAMES.PLAYER_CRAFTED_ITEM,
    args: ["playerId", "itemName", "craftingIdx", "recipe", "craftTimes"],
  },
  {
    handler: "onPlayerOpenedChest",
    event: EVENT_NAMES.PLAYER_OPENED_CHEST,
    args: ["playerId", "x", "y", "z", "isMoonstoneChest", "isIronChest"],
  },
  {
    handler: "onPlayerMoveItemOutOfInventory",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_TO_MOVE_ITEM_OUT_OF_INVENTORY,
    args: ["playerId", "itemName", "itemAmount", "fromIdx", "movementType"],
    defaults: { preventChange: false },
    returnIf: (d: { preventChange: boolean }) => (d.preventChange ? "preventChange" : undefined),
  },
  {
    handler: "onPlayerMoveInvenItem",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_TO_MOVE_INVENTORY_ITEM,
    args: ["playerId", "fromIdx", "toStartIdx", "toEndIdx", "amt"],
    defaults: { preventChange: false },
    returnIf: (d: { preventChange: boolean }) => (d.preventChange ? "preventChange" : undefined),
  },
  {
    handler: "onPlayerMoveItemIntoIdxs",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_TO_MOVE_ITEM_INTO_SLOT_RANGE,
    args: ["playerId", "start", "end", "moveIdx", "itemAmount"],
    defaults: { preventChange: false },
    returnIf: (d: { preventChange: boolean }) => (d.preventChange ? "preventChange" : undefined),
  },
  {
    handler: "onPlayerSwapInvenSlots",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_TO_SWAP_INVENTORY_SLOTS,
    args: ["playerId", "i", "j"],
    defaults: { preventChange: false },
    returnIf: (d: { preventChange: boolean }) => (d.preventChange ? "preventChange" : undefined),
  },
  {
    handler: "onPlayerMoveInvenItemWithAmt",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_TO_MOVE_INVENTORY_ITEM_WITH_AMOUNT,
    args: ["playerId", "i", "j", "amt"],
    defaults: { preventChange: false },
    returnIf: (d: { preventChange: boolean }) => (d.preventChange ? "preventChange" : undefined),
  },
  {
    handler: "onPlayerAttemptAltAction",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_ALT_ACTION,
    args: ["playerId", "x", "y", "z", "block", "targetEId"],
    defaults: { preventAction: false },
    returnIf: (d: { preventAction: boolean }) => (d.preventAction ? "preventAction" : undefined),
  },
  {
    handler: "onPlayerAltAction",
    event: EVENT_NAMES.PLAYER_PERFORMED_ALT_ACTION,
    args: ["playerId", "x", "y", "z", "block", "targetEId"],
  },
  {
    handler: "onClientOptionUpdated",
    event: EVENT_NAMES.PLAYER_CLIENT_OPTION_UPDATED,
    args: ["playerId", "option", "value"],
  },
  {
    handler: "onChestUpdated",
    event: EVENT_NAMES.PLAYER_UPDATED_CHEST,
    args: ["initiatorEId", "isMoonstoneChest", "x", "y", "z"],
  },
  {
    handler: "onPlayerSpawnMob",
    event: EVENT_NAMES.PLAYER_SPAWNED_MOB,
    args: ["playerId", "mobId", "mobType", "x", "y", "z", "mobHerdId", "playSoundOnSpawn"],
  },
  {
    handler: "onPlayerAttemptSpawnVehicle",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_TO_SPAWN_VEHICLE,
    args: ["playerId", "vehicleType", "x", "y", "z"],
    defaults: { preventSpawn: false },
    returnIf: (d: { preventSpawn: boolean }) => (d.preventSpawn ? "preventSpawn" : undefined),
  },
  {
    handler: "onPlayerSpawnVehicle",
    event: EVENT_NAMES.PLAYER_SPAWNED_VEHICLE,
    args: ["playerId", "vehicleEId", "vehicleType", "x", "y", "z"],
  },
  {
    handler: "onPlayerDamagingMeshEntity",
    event: EVENT_NAMES.PLAYER_DAMAGED_MESH_ENTITY,
    args: ["playerId", "damagedId", "damageDealt", "withItem"],
  },
  {
    handler: "onPlayerBreakMeshEntity",
    event: EVENT_NAMES.PLAYER_BROKE_MESH_ENTITY,
    args: ["playerId", "LifeformId"],
  },
  {
    handler: "onTouchscreenActionButton",
    event: EVENT_NAMES.PLAYER_USED_TOUCHSCREEN_ACTION_BUTTON,
    args: ["playerId", "touchDown"],
  },
  {
    handler: "onPlayerRequestChunk",
    event: EVENT_NAMES.PLAYER_REQUESTED_CHUNK,
    args: ["playerId", "chunkX", "chunkY", "chunkZ", "chunkId"],
  },
  {
    handler: "onPlayerAttemptFish",
    event: EVENT_NAMES.PLAYER_ATTEMPTED_TO_FISH,
    args: ["playerId", "rodName", "x", "y", "z"],
    defaults: { preventFish: false, fishingOptions: null },
    returnIf: (d: { preventFish: boolean; fishingOptions: FishingAttemptOptions | null }) =>
      d.preventFish ? "preventFish" : d.fishingOptions ?? undefined,
  },
  {
    handler: "onPlayerSucceededFishCatch",
    event: EVENT_NAMES.PLAYER_SUCCEEDED_FISH_CATCH,
    args: ["playerId", "rodName", "x", "y", "z", "caughtItemName"],
    defaults: { preventDrop: false, preventItemGrant: false },
    returnIf: (d: { preventDrop: boolean; preventItemGrant: boolean }) =>
      d.preventDrop ? "preventDrop" : d.preventItemGrant ? "preventItemGrant" : undefined,
  },
  {
    handler: "onPlayerFailedFishCatch",
    event: EVENT_NAMES.PLAYER_FAILED_FISH_CATCH,
    args: ["playerId", "rodName", "x", "y", "z", "caughtItemName"],
  },
  {
    handler: "onPlayerPlayedEmote",
    event: EVENT_NAMES.PLAYER_PLAYED_EMOTE,
    args: ["playerId", "emoteId"],
  },
  {
    handler: "onPlayerEnteredVehicle",
    event: EVENT_NAMES.PLAYER_ENTERED_VEHICLE,
    args: ["playerId", "vehicleType", "vehicleEId"],
  },
  {
    handler: "onPlayerExitedVehicle",
    event: EVENT_NAMES.PLAYER_EXITED_VEHICLE,
    args: ["playerId", "vehicleType", "vehicleEId"],
  },
  {
    handler: "onUiRequestResponded",
    event: EVENT_NAMES.PLAYER_RESPONDED_TO_UI_REQUEST,
    args: ["playerId", "id", "response"],
  },
  {
    handler: "onTaskClaimed",
    event: EVENT_NAMES.PLAYER_CLAIMED_TASK,
    args: ["playerId", "taskId", "isPromoTask", "claimedRewards"],
  },

  /* ---- Mob対象のフック ---- */
  {
    handler: "onMobSettingUpdated",
    target: "mob",
    event: EVENT_NAMES.MOB_SETTING_UPDATED,
    args: ["mobId", "setting", "value"],
  },
  {
    // 消えたMobのリスナーは自動で破棄する
    handler: "onMobDespawned",
    target: "mob",
    event: EVENT_NAMES.MOB_DESPAWNED,
    args: ["mobId"],
    extra: (listener) => listener?.destroy(),
  },

  /* ---- ワールド / ロビー全体のフック (gameEvents に届く) ---- */
  {
    handler: "tick",
    target: "global",
    event: EVENT_NAMES.WORLD_TICKED,
    args: ["ms"],
  },
  {
    handler: "onClose",
    target: "global",
    event: EVENT_NAMES.LOBBY_CLOSING,
    args: ["serverIsShuttingDown"],
  },
  {
    handler: "doPeriodicSave",
    target: "global",
    event: EVENT_NAMES.PERIODIC_SAVE_REQUESTED,
    args: [],
  },
  {
    handler: "onChunkLoaded",
    target: "global",
    event: EVENT_NAMES.CHUNK_LOADED,
    args: ["chunkId", "chunk", "wasPersistedChunk"],
  },
  {
    handler: "onWorldAttemptChangeBlock",
    target: "global",
    event: EVENT_NAMES.WORLD_ATTEMPTED_TO_CHANGE_BLOCK,
    args: ["x", "y", "z", "fromBlock", "toBlock", "initiatorDbId", "extraInfo"],
    defaults: { preventChange: false },
    returnIf: (d: { preventChange: boolean }) => (d.preventChange ? "preventChange" : undefined),
  },
  {
    handler: "onWorldChangeBlock",
    target: "global",
    event: EVENT_NAMES.WORLD_CHANGED_BLOCK,
    args: ["x", "y", "z", "fromBlock", "toBlock", "initiatorDbId", "extraInfo", "dropsPrevented"],
    defaults: { preventChange: false, preventDrop: false },
    returnIf: (d: { preventChange: boolean; preventDrop: boolean }) =>
      d.preventChange ? "preventChange" : d.preventDrop ? "preventDrop" : undefined,
  },
  {
    handler: "onWorldAttemptSpawnMob",
    target: "global",
    event: EVENT_NAMES.WORLD_ATTEMPTED_TO_SPAWN_MOB,
    args: ["mobType", "x", "y", "z"],
    defaults: { preventSpawn: false },
    returnIf: (d: { preventSpawn: boolean }) => (d.preventSpawn ? "preventSpawn" : undefined),
  },
  {
    handler: "onWorldSpawnMob",
    target: "global",
    event: EVENT_NAMES.WORLD_SPAWNED_MOB,
    args: ["mobId", "mobType", "x", "y", "z", "mobHerdId", "playSoundOnSpawn"],
  },
  {
    handler: "onWorldAttemptSpawnVehicle",
    target: "global",
    event: EVENT_NAMES.WORLD_ATTEMPTED_TO_SPAWN_VEHICLE,
    args: ["vehicleType", "x", "y", "z"],
    defaults: { preventSpawn: false },
    returnIf: (d: { preventSpawn: boolean }) => (d.preventSpawn ? "preventSpawn" : undefined),
  },
  {
    handler: "onWorldSpawnVehicle",
    target: "global",
    event: EVENT_NAMES.WORLD_SPAWNED_VEHICLE,
    args: ["vehicleEId", "vehicleType", "x", "y", "z"],
  },
  {
    handler: "onVehicleDespawned",
    target: "global",
    event: EVENT_NAMES.VEHICLE_DESPAWNED,
    args: ["vehicleEId", "vehicleType"],
  },
  {
    handler: "onEntityDeleted",
    target: "global",
    event: EVENT_NAMES.ENTITY_DELETED,
    args: ["eId", "entityType"],
  },
  {
    handler: "onEntityCollision",
    target: "global",
    event: EVENT_NAMES.ENTITIES_COLLIDED,
    args: ["eId", "otherEId"],
  },
  {
    handler: "onCreateBloxdMeshEntity",
    target: "global",
    event: EVENT_NAMES.MESH_ENTITY_CREATED,
    args: ["eId", "type", "initiatorId"],
  },
  {
    handler: "onItemDropCreated",
    target: "global",
    event: EVENT_NAMES.ITEM_DROP_CREATED,
    args: ["itemEId", "itemName", "itemAmount", "x", "y", "z"],
  },
];

const tableHooks: Record<string, HookFn> = Object.fromEntries(
  eventHooks.map(({ handler, event, target = "player", args, defaults, extra, returnIf }) => {
    const hook: HookFn = (...rawArgs: unknown[]) => {
      const listener =
        target === "player"
          ? playerMap.get(rawArgs[0] as LifeformId)
          : target === "mob"
            ? mobMap.get(rawArgs[0] as LifeformId)
            : undefined;
      const data = {
        ...Object.fromEntries(args.map((key, i) => [key, rawArgs[i]])),
        ...defaults,
      };

      if (target === "global") {
        gameEvents.dispatchEvent(event, data as never);
      } else {
        listener?.dispatchEvent(event, data as never);
      }
      extra?.(listener);

      if (returnIf) {
        const result = returnIf(data);
        if (result !== undefined) return result;
      }
    };
    return [handler, hook];
  }),
);

/* ------------------------------------------------------------------ */
/* 個別フック                                                          */
/* ------------------------------------------------------------------ */

const register: Record<string, HookFn> = {
  onWorldAttemptDespawnMob: (mobId: LifeformId) => {
    const target = mobMap.get(mobId);
    const data: AttemptDespawnData = { mobId, preventDespawn: false };

    target?.dispatchEvent(EVENT_NAMES.MOB_ATTEMPT_TO_DESPAWN, data);

    if (data.preventDespawn) {
      return "preventDespawn";
    }
  },

  // プレイヤー → プレイヤー
  onPlayerDamagingOtherPlayer: (
    attackingPlayer: LifeformId,
    damagedPlayer: LifeformId,
    damageDealt: number,
    withItem: string,
    bodyPartHit: string,
    damagerDbId: string,
    damageInfo: DamageInfo,
  ) => {
    const attacker = playerMap.get(attackingPlayer);
    const damaged = playerMap.get(damagedPlayer);

    const data: PlayerDamagePlayerData = {
      attackingPlayer,
      damagedPlayer,
      damageDealt,
      withItem,
      bodyPartHit,
      damagerDbId,
      damageInfo,
      preventDamage: false,
      damage: damageDealt,
    };

    attacker?.dispatchEvent(EVENT_NAMES.PLAYER_ATTACKED_PLAYER, data);
    damaged?.dispatchEvent(EVENT_NAMES.PLAYER_WAS_DAMAGED_BY_PLAYER, data);

    if (data.preventDamage) {
      return "preventDamage";
    }

    if (data.damage !== damageDealt) {
      return data.damage;
    }
  },

  // プレイヤー → モブ
  onPlayerDamagingMob: (
    playerId: LifeformId,
    mobId: LifeformId,
    damageDealt: number,
    withItem: string,
    damagerDbId: string,
    damageInfo: DamageInfo,
  ) => {
    const player = playerMap.get(playerId);
    const mob = mobMap.get(mobId);

    const data: PlayerDamageMobData = {
      playerId,
      mobId,
      damageDealt,
      withItem,
      damagerDbId,
      damageInfo,
      preventDamage: false,
      damage: damageDealt,
    };

    player?.dispatchEvent(EVENT_NAMES.PLAYER_ATTACKED_MOB, data);
    mob?.dispatchEvent(EVENT_NAMES.MOB_WAS_DAMAGED_BY_PLAYER, data);

    if (data.preventDamage) {
      return "preventDamage";
    }

    if (data.damage !== damageDealt) {
      return data.damage;
    }
  },

  // 攻撃者はプレイヤーかモブ。PlayerListener 登録済みならプレイヤー、それ以外はモブ扱い。
  // (MobListener が未登録のモブでも、倒される側のイベントは必ず発火する)
  onAttemptKillPlayer: (killedPlayer: LifeformId, attackingLifeform?: LifeformId) => {
    // 攻撃者なし (落下・虚空など) は対象外
    if (attackingLifeform === undefined) return;

    const victim = playerMap.get(killedPlayer);
    const attackerPlayer = playerMap.get(attackingLifeform);
    const data: AttemptKillData = { killedPlayer, attackingLifeform, preventDeath: false };

    if (attackerPlayer) {
      victim?.dispatchEvent(EVENT_NAMES.PLAYER_ATTEMPT_TO_BE_KILLED_BY_PLAYER, data);
      attackerPlayer.dispatchEvent(EVENT_NAMES.PLAYER_ATTEMPT_TO_KILL_PLAYER, data);
    } else {
      victim?.dispatchEvent(EVENT_NAMES.PLAYER_ATTEMPT_TO_BE_KILLED_BY_MOB, data);
      mobMap.get(attackingLifeform)?.dispatchEvent(EVENT_NAMES.MOB_ATTEMPT_TO_KILL_PLAYER, data);
    }

    if (data.preventDeath) {
      return "preventDeath";
    }
  },

  onPlayerKilledOtherPlayer: (
    attackingPlayer: LifeformId,
    killedPlayer: LifeformId,
    damageDealt: number,
    withItem: string,
  ) => {
    const attacker = playerMap.get(attackingPlayer);
    const killed = playerMap.get(killedPlayer);

    const data: PlayerKillPlayerData = {
      attackingPlayer,
      killedPlayer,
      damageDealt,
      withItem,
      keepInventory: false,
    };
    attacker?.dispatchEvent(EVENT_NAMES.PLAYER_KILLED_PLAYER, data);
    killed?.dispatchEvent(EVENT_NAMES.PLAYER_WAS_KILLED_BY_PLAYER, data);

    if (data.keepInventory) {
      return "keepInventory";
    }
  },

  onMobKilledPlayer: (
    attackingMob: LifeformId,
    killedPlayer: LifeformId,
    damageDealt: number,
    withItem: string,
  ) => {
    const attacker = mobMap.get(attackingMob);
    const killed = playerMap.get(killedPlayer);

    const data: MobKillPlayerData = {
      attackingMob,
      killedPlayer,
      damageDealt,
      withItem,
      keepInventory: false,
    };

    attacker?.dispatchEvent(EVENT_NAMES.MOB_KILLED_PLAYER, data);
    killed?.dispatchEvent(EVENT_NAMES.PLAYER_WAS_KILLED_BY_MOB, data);

    if (data.keepInventory) {
      return "keepInventory";
    }
  },

  onPlayerKilledMob: (
    playerId: LifeformId,
    mobId: LifeformId,
    damageDealt: number,
    withItem: string,
  ) => {
    const attacker = playerMap.get(playerId);
    const killed = mobMap.get(mobId);

    const data: PlayerKillMobData = { playerId, mobId, damageDealt, withItem, preventDrop: false };
    attacker?.dispatchEvent(EVENT_NAMES.PLAYER_KILLED_MOB, data);
    killed?.dispatchEvent(EVENT_NAMES.MOB_WAS_KILLED_BY_PLAYER, data);

    if (data.preventDrop) {
      return "preventDrop";
    }
  },

  onMobKilledOtherMob: (
    attackingMob: LifeformId,
    killedMob: LifeformId,
    damageDealt: number,
    withItem: string,
  ) => {
    const attacker = mobMap.get(attackingMob);
    const killed = mobMap.get(killedMob);

    const data: MobKillMobData = { attackingMob, killedMob, damageDealt, withItem, preventDrop: false };
    attacker?.dispatchEvent(EVENT_NAMES.MOB_KILLED_MOB, data);
    killed?.dispatchEvent(EVENT_NAMES.MOB_WAS_KILLED_BY_MOB, data);

    if (data.preventDrop) {
      return "preventDrop";
    }
  },

  onPlayerChangeBlock: (
    playerId: LifeformId,
    x: number,
    y: number,
    z: number,
    fromBlock: string,
    toBlock: string,
    droppedItem: unknown,
    fromBlockInfo: unknown,
    toBlockInfo: unknown,
    dropsPrevented: boolean,
  ) => {
    const player = playerMap.get(playerId);

    const data: BlockChangeData = {
      playerId,
      x,
      y,
      z,
      fromBlock,
      toBlock,
      droppedItem,
      fromBlockInfo,
      toBlockInfo,
      dropsPrevented,
      preventChange: false,
      preventDrop: false,
      droppedItemPosition: null,
    };

    player?.dispatchEvent(EVENT_NAMES.PLAYER_CHANGED_BLOCK, data);

    if (data.preventChange) {
      return "preventChange";
    }

    if (data.preventDrop) {
      return "preventDrop";
    }

    if (data.droppedItemPosition && Array.isArray(data.droppedItemPosition)) {
      return data.droppedItemPosition;
    }
  },

  // モブ → プレイヤー
  onMobDamagingPlayer: (
    attackingMob: LifeformId,
    damagedPlayer: LifeformId,
    damageDealt: number,
    withItem: string,
    damageInfo: DamageInfo,
  ) => {
    const attacker = mobMap.get(attackingMob);
    const damaged = playerMap.get(damagedPlayer);

    const data: MobDamagePlayerData = {
      attackingMob,
      damagedPlayer,
      damageDealt,
      withItem,
      damageInfo,
      preventDamage: false,
      damage: damageDealt,
    };

    attacker?.dispatchEvent(EVENT_NAMES.MOB_ATTACKED_PLAYER, data);
    damaged?.dispatchEvent(EVENT_NAMES.PLAYER_WAS_DAMAGED_BY_MOB, data);

    if (data.preventDamage) {
      return "preventDamage";
    }

    if (data.damage !== damageDealt) {
      return data.damage;
    }
  },

  // モブ → モブ
  onMobDamagingOtherMob: (
    attackingMob: LifeformId,
    damagedMob: LifeformId,
    damageDealt: number,
    withItem: string,
    damageInfo: DamageInfo,
  ) => {
    const attacker = mobMap.get(attackingMob);
    const damaged = mobMap.get(damagedMob);

    const data: MobDamageMobData = {
      attackingMob,
      damagedMob,
      damageDealt,
      withItem,
      damageInfo,
      preventDamage: false,
      damage: damageDealt,
    };

    attacker?.dispatchEvent(EVENT_NAMES.MOB_ATTACKED_MOB, data);
    damaged?.dispatchEvent(EVENT_NAMES.MOB_WAS_DAMAGED_BY_MOB, data);

    if (data.preventDamage) {
      return "preventDamage";
    }

    if (data.damage !== damageDealt) {
      return data.damage;
    }
  },

  // プレイヤー参加時は PlayerListener を自動作成し、gameEvents に通知する
  onPlayerJoin: (playerId: LifeformId, fromGameReset: boolean) => {
    const player = playerMap.get(playerId) ?? new PlayerListener(playerId);
    gameEvents.dispatchEvent(EVENT_NAMES.PLAYER_JOINED_LOBBY, { playerId, fromGameReset, player });
  },

  ...tableHooks,
};

export const handlers: Record<string, HookFn> = Object.fromEntries(
  Object.entries(register).filter(([name]) => !exclusion.has(name)),
);