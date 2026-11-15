import type { MobId, PlayerId } from "@bloxd";
type EntityId = MobId | PlayerId;

type HookResult = string | number | boolean | number[] | null | undefined | void;
type HookFn = (...args: any[]) => HookResult;
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

export const EVENT_NAMES = Object.freeze({
  ATTACK: "attack",
  DAMAGE: "damage",
  KILL: "kill",
  DEATH: "death",

  ATTEMPT_KILL: "attemptKill",
  ATTEMPT_DEATH: "attemptDeath",
  ATTEMPT_DESPAWN: "attemptDespawn",

  CHAT: "chat",
  DROP: "drop",
  PICKUP: "pickup",
  CRAFT: "craft",
  CLICK: "click",
  CLICK_UP: "clickUp",

  LEAVE: "leave",
  JUMP: "jump",
  RESPAWN: "respawn",

  COMMAND: "command",
  EFFECT: "effect",
  BLOCK_CHANGE: "blockChange",
  OPEN_CHEST: "openChest",
  SPAWN_MOB: "spawnMob",
  SELECT_SLOT: "selectSlot",
  INVENTORY_UPDATE: "inventoryUpdate",
  CHARGE_START: "chargeStart",
  CHARGE_END: "chargeEnd",
  USED_THROWABLE: "usedThrowable",
  THROWABLE_TERRAIN_HIT: "throwableTerrainHit",
  FINISH_QTE: "finishQTE",
} as const);

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

interface PlayerIdData {
  playerId: EntityId;
}

interface DamageDataBase {
  damageDealt: number;
  withItem: string;
  preventDamage: boolean;
  /** リスナーが書き換えるとダメージ量を変更できる */
  damage: number;
}

export interface PlayerDamagePlayerData extends DamageDataBase {
  attackingPlayer: EntityId;
  damagedPlayer: EntityId;
  bodyPartHit: string;
  damagerDbId: string;
}

export interface PlayerDamageMobData extends DamageDataBase {
  playerId: EntityId;
  mobId: EntityId;
  damagerDbId: string;
}

interface KillDataBase {
  damageDealt: number;
  withItem: string;
}

export interface PlayerKillPlayerData extends KillDataBase {
  attackingPlayer: EntityId;
  killedPlayer: EntityId;
  keepInventory: boolean;
}

export interface MobKillPlayerData extends KillDataBase {
  attackingMob: EntityId;
  killedPlayer: EntityId;
  keepInventory: boolean;
}

export interface PlayerKillMobData extends KillDataBase {
  playerId: EntityId;
  mobId: EntityId;
  preventDrop: boolean;
}

export interface MobKillMobData extends KillDataBase {
  attackingMob: EntityId;
  killedMob: EntityId;
  preventDrop: boolean;
}

export interface AttemptKillData {
  killedPlayer: EntityId;
  attackingLifeform: EntityId;
  preventDeath: boolean;
}

export interface AttemptDespawnData {
  mobId: EntityId;
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
  preventDrop: boolean;
  droppedItemPosition: number[] | null;
}

export interface ClickData extends PlayerIdData {
  wasAltClick: boolean;
  x: number;
  y: number;
  z: number;
  block: string;
  targetEId: EntityId | null;
}

export interface PotionEffectData {
  initiatorId: EntityId;
  targetEId: EntityId;
  effectName: string;
}

export interface ThrowableData extends PlayerIdData {
  throwableName: string;
  thrownEntityId: EntityId;
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
  attack: PlayerDamagePlayerData | PlayerDamageMobData;
  damage: PlayerDamagePlayerData | PlayerDamageMobData;
  kill: PlayerKillPlayerData | MobKillPlayerData | PlayerKillMobData | MobKillMobData;
  death: PlayerKillPlayerData | MobKillPlayerData | PlayerKillMobData | MobKillMobData;

  attemptKill: AttemptKillData;
  attemptDeath: AttemptKillData;
  attemptDespawn: AttemptDespawnData;

  chat: ChatData;
  drop: DropData;
  pickup: PlayerIdData & { itemName: string; itemAmount: number };
  craft: CraftData;
  click: ClickData;
  clickUp: ClickData;

  leave: PlayerIdData;
  jump: PlayerIdData;
  respawn: PlayerIdData;

  command: CommandData;
  effect: PotionEffectData;
  blockChange: BlockChangeData;
  openChest: OpenChestData;
  spawnMob: SpawnMobData;
  selectSlot: PlayerIdData & { slotIndex: number };
  inventoryUpdate: PlayerIdData;
  chargeStart: PlayerIdData & { itemName: string };
  chargeEnd: PlayerIdData & { used: boolean; itemName: string; duration: number };
  usedThrowable: ThrowableData;
  throwableTerrainHit: ThrowableData;
  finishQTE: PlayerIdData & { qteId: string; result: unknown };
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

    for (let i = 0; i < list.length; i++) {
      const listener = list[i];
      if (!listener) continue;
      try { 
        listener.callback(e) 
      } catch (e: any){
        api.log(`${e.name}\nstack: ${e.stack}`)
      };
      if (listener.once) {
        list.splice(i--, 1);
      }
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
  constructor(public readonly id: EntityId) {
    super();
    mobMap.set(this.id, this);
  }

  destroy(): void {
    mobMap.delete(this.id);
  }
}

export class PlayerListener extends EventTarget<GameEventMap> {
  constructor(public readonly id: EntityId) {
    super();
    playerMap.set(this.id, this);
  }

  destroy(): void {
    playerMap.delete(this.id);
  }
}

const mobMap = new Map<EntityId, MobListener>();
const playerMap = new Map<EntityId, PlayerListener>();

interface PlayerEventHandlerDef {
  /** グローバルに登録するフック名 */
  handler: string;
  event: EventName;
  /** フック引数の名前 (イベントデータのキーになる) */
  args: readonly string[];
  /** イベントデータに追加するデフォルト値 */
  defaults?: Record<string, unknown>;
  extra?: (player: PlayerListener | undefined) => void;
  /** undefined 以外を返すとそれがフックの戻り値になる */
  returnIf?: (data: any) => HookResult;
}

const playerEventHandlers: readonly PlayerEventHandlerDef[] = [
  {
    handler: "onPlayerLeave",
    event: "leave",
    args: ["playerId"],
    extra: (player) => player?.destroy(),
  },
  {
    handler: "onPlayerJump",
    event: EVENT_NAMES.JUMP,
    args: ["playerId"],
  },
  {
    handler: "onRespawnRequest",
    event: EVENT_NAMES.RESPAWN,
    args: ["playerId"],
  },
  {
    handler: "onPlayerPickedUpItem",
    event: EVENT_NAMES.PICKUP,
    args: ["playerId", "itemName", "itemAmount"],
  },
  {
    handler: "onPlayerSelectInventorySlot",
    event: EVENT_NAMES.SELECT_SLOT,
    args: ["playerId", "slotIndex"],
  },
  {
    handler: "onInventoryUpdated",
    event: EVENT_NAMES.INVENTORY_UPDATE,
    args: ["playerId"],
  },
  {
    handler: "onPlayerClick",
    event: EVENT_NAMES.CLICK,
    args: ["playerId", "wasAltClick", "x", "y", "z", "block", "targetEId"],
  },
  {
    handler: "onPlayerClickUp",
    event: EVENT_NAMES.CLICK_UP,
    args: ["playerId", "wasAltClick", "x", "y", "z", "block", "targetEId"],
  },
  {
    handler: "onPlayerPotionEffect",
    event: EVENT_NAMES.EFFECT,
    args: ["initiatorId", "targetEId", "effectName"],
  },
  {
    handler: "onPlayerUsedThrowable",
    event: EVENT_NAMES.USED_THROWABLE,
    args: ["playerId", "throwableName", "thrownEntityId"],
  },
  {
    handler: "onPlayerThrowableHitTerrain",
    event: EVENT_NAMES.THROWABLE_TERRAIN_HIT,
    args: ["playerId", "throwableName", "thrownEntityId"],
  },
  {
    handler: "onPlayerStartChargingItem",
    event: EVENT_NAMES.CHARGE_START,
    args: ["playerId", "itemName"],
  },
  {
    handler: "onPlayerFinishChargingItem",
    event: EVENT_NAMES.CHARGE_END,
    args: ["playerId", "used", "itemName", "duration"],
  },
  {
    handler: "onPlayerFinishQTE",
    event: EVENT_NAMES.FINISH_QTE,
    args: ["playerId", "qteId", "result"],
  },
  {
    handler: "playerCommand",
    event: EVENT_NAMES.COMMAND,
    args: ["playerId", "cmd"],
    defaults: { trueCommand: true },
    returnIf: (d: CommandData) => !d.trueCommand && false,
  },
  {
    handler: "onPlayerChat",
    event: EVENT_NAMES.CHAT,
    args: ["playerId", "message", "channelName"],
    defaults: { isBroadcast: true, prefix: null },
    returnIf: (d: ChatData) => (!d.isBroadcast ? false : d.prefix ?? null),
  },
  {
    handler: "onPlayerAttemptCraft",
    event: EVENT_NAMES.CRAFT,
    args: ["playerId", "itemName", "craftingIdx", "craftTimes"],
    defaults: { preventCraft: false },
    returnIf: (d: CraftData) => d.preventCraft && "preventCraft",
  },
  {
    handler: "onPlayerAttemptOpenChest",
    event: EVENT_NAMES.OPEN_CHEST,
    args: ["playerId", "x", "y", "z", "isMoonstoneChest", "isIronChest"],
    defaults: { preventOpen: false },
    returnIf: (d: OpenChestData) => d.preventOpen && "preventOpen",
  },
  {
    handler: "onPlayerAttemptSpawnMob",
    event: EVENT_NAMES.SPAWN_MOB,
    args: ["playerId", "mobType", "x", "y", "z"],
    defaults: { preventSpawn: false },
    returnIf: (d: SpawnMobData) => d.preventSpawn && "preventSpawn",
  },
  {
    handler: "onPlayerDropItem",
    event: EVENT_NAMES.DROP,
    args: ["playerId", "x", "y", "z", "itemName", "itemAmount", "fromIdx"],
    defaults: { preventDrop: false, allowButNoDroppedItemCreated: false },
    returnIf: (d: DropData) =>
      d.preventDrop ? "preventDrop" : d.allowButNoDroppedItemCreated && "allowButNoDroppedItemCreated",
  },
];

const handlers: Record<string, HookFn> = Object.fromEntries(
  playerEventHandlers.map(({ handler, event, args, defaults, extra, returnIf }) => {
    const hook: HookFn = (...rawArgs: unknown[]) => {
      const player = playerMap.get(rawArgs[0] as EntityId);
      const data = {
        ...Object.fromEntries(args.map((key, i) => [key, rawArgs[i]])),
        ...defaults,
      };

      player?.dispatchEvent(event, data as never);
      extra?.(player);

      if (returnIf) {
        const result = returnIf(data);
        if (result !== undefined) return result;
      }
      return;
    };
    return [handler, hook];
  }),
);

const register: Record<string, HookFn> = {
  onWorldAttemptDespawnMob: (mobId: EntityId) => {
    const target = mobMap.get(mobId);
    const data: AttemptDespawnData = { mobId, preventDespawn: false };

    target?.dispatchEvent(EVENT_NAMES.ATTEMPT_DESPAWN, data);

    if (data.preventDespawn) {
      return "preventDespawn";
    }

    return;
  },

  onPlayerDamagingOtherPlayer: (
    attackingPlayer: EntityId,
    damagedPlayer: EntityId,
    damageDealt: number,
    withItem: string,
    bodyPartHit: string,
    damagerDbId: string,
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
      preventDamage: false,
      damage: damageDealt,
    };

    attacker?.dispatchEvent(EVENT_NAMES.ATTACK, data);
    damaged?.dispatchEvent(EVENT_NAMES.DAMAGE, data);

    if (data.preventDamage) {
      return "preventDamage";
    }

    if (data.damage !== damageDealt) {
      return data.damage;
    }
    return;
  },

  onPlayerDamagingMob: (
    playerId: EntityId,
    mobId: EntityId,
    damageDealt: number,
    withItem: string,
    damagerDbId: string,
  ) => {
    const player = playerMap.get(playerId);
    const mob = mobMap.get(mobId);

    const data: PlayerDamageMobData = {
      playerId,
      mobId,
      damageDealt,
      withItem,
      damagerDbId,
      preventDamage: false,
      damage: damageDealt,
    };

    player?.dispatchEvent(EVENT_NAMES.ATTACK, data);
    mob?.dispatchEvent(EVENT_NAMES.DAMAGE, data);

    if (data.preventDamage) {
      return "preventDamage";
    }

    if (data.damage !== damageDealt) {
      return data.damage;
    }
    return;
  },

  onAttemptKillPlayer: (killedPlayer: EntityId, attackingLifeform: EntityId) => {
    const player = playerMap.get(killedPlayer);
    const attacker = playerMap.get(attackingLifeform) ?? mobMap.get(attackingLifeform);
    if (!attacker) return;

    const data: AttemptKillData = { killedPlayer, attackingLifeform, preventDeath: false };
    player?.dispatchEvent(EVENT_NAMES.ATTEMPT_DEATH, data);
    attacker.dispatchEvent(EVENT_NAMES.ATTEMPT_KILL, data);

    if (data.preventDeath) {
      return "preventDeath";
    }
    return;
  },

  onPlayerKilledOtherPlayer: (
    attackingPlayer: EntityId,
    killedPlayer: EntityId,
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
    attacker?.dispatchEvent(EVENT_NAMES.KILL, data);
    killed?.dispatchEvent(EVENT_NAMES.DEATH, data);

    if (data.keepInventory) {
      return "keepInventory";
    }
    return;
  },

  onMobKilledPlayer: (
    attackingMob: EntityId,
    killedPlayer: EntityId,
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

    attacker?.dispatchEvent(EVENT_NAMES.KILL, data);
    killed?.dispatchEvent(EVENT_NAMES.DEATH, data);

    if (data.keepInventory) {
      return "keepInventory";
    }
    return;
  },

  onPlayerKilledMob: (
    playerId: EntityId,
    mobId: EntityId,
    damageDealt: number,
    withItem: string,
  ) => {
    const attacker = playerMap.get(playerId);
    const killed = mobMap.get(mobId);

    const data: PlayerKillMobData = { playerId, mobId, damageDealt, withItem, preventDrop: false };
    attacker?.dispatchEvent(EVENT_NAMES.KILL, data);
    killed?.dispatchEvent(EVENT_NAMES.DEATH, data);

    if (data.preventDrop) {
      return "preventDrop";
    }
    return;
  },

  onMobKilledOtherMob: (
    attackingMob: EntityId,
    killedMob: EntityId,
    damageDealt: number,
    withItem: string,
  ) => {
    const attacker = mobMap.get(attackingMob);
    const killed = mobMap.get(killedMob);

    const data: MobKillMobData = { attackingMob, killedMob, damageDealt, withItem, preventDrop: false };
    attacker?.dispatchEvent(EVENT_NAMES.KILL, data);
    killed?.dispatchEvent(EVENT_NAMES.DEATH, data);

    if (data.preventDrop) {
      return "preventDrop";
    }
    return;
  },

  onPlayerChangeBlock: (
    playerId: EntityId,
    x: number,
    y: number,
    z: number,
    fromBlock: string,
    toBlock: string,
    droppedItem: unknown,
    fromBlockInfo: unknown,
    toBlockInfo: unknown,
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
      preventChange: false,
      preventDrop: false,
      droppedItemPosition: null,
    };

    player?.dispatchEvent(EVENT_NAMES.BLOCK_CHANGE, data);

    if (data.preventChange) {
      return "preventChange";
    }

    if (data.preventDrop) {
      return "preventDrop";
    }

    if (data.droppedItemPosition && Array.isArray(data.droppedItemPosition)) {
      return data.droppedItemPosition;
    }
    return;
  },

  ...handlers,
};

Object.entries(register).forEach(([name, callback]) => {
  __mixinRegister(name, (...args: unknown[]) => callback(...args));
});