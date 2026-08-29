type Callback = (...args: any[]) => any

type Module = {
	handlers?: Record<string, Callback>
	[key: string]: any
}

const BUILD_LOCATION: [number, number, number] = [0, 1, 0]

const MODULES = [
	"./test.js",
	"./hello.js"
]

class Loader {
	static BUILD(e = BUILD_LOCATION) {
		api.setBlock(e, "Code Block")
		api.setBlockData(...e, {
			persisted: {
				shared: {
					text: `${MODULES.map((e, n) => `
						import * as $${n} from "${e}"
					`).join(";")};Loader.modules = [${MODULES.map((e, n) => `
						$${n}
					`).join(",")}]`
				}
			}
		})
	}

	static modules: Module[] = []

	static returns = {
		tick: [],
		onClose: [],
		onPlayerJoin: [],
		onPlayerLeave: [],
		onPlayerJump: [],
		onRespawnRequest: [!0, Array],
		playerCommand: [Boolean],
		onPlayerChat: [Boolean, String, Object],
		onPlayerChangeBlock: ["preventChange", "preventDrop", Array],
		onPlayerDropItem: ["preventDrop", "allowButNoDroppedItemCreated"],
		onPlayerPickedUpItem: [],
		onPlayerSelectInventorySlot: [],
		onBlockStand: [],
		onBlockStandStart: [],
		onBlockStandStop: [],
		onPlayerAttemptCraft: ["preventCraft"],
		onPlayerCraft: [],
		onPlayerAttemptOpenChest: ["preventOpen"],
		onPlayerOpenedChest: [],
		onPlayerMoveItemOutOfInventory: ["preventChange"],
		onPlayerMoveInvenItem: ["preventChange"],
		onPlayerMoveItemIntoIdxs: ["preventChange"],
		onPlayerSwapInvenSlots: ["preventChange"],
		onPlayerMoveInvenItemWithAmt: ["preventChange"],
		onPlayerAttemptAltAction: ["preventAction"],
		onPlayerAltAction: [],
		onPlayerClick: [],
		onPlayerClickUp: [],
		onClientOptionUpdated: [],
		onMobSettingUpdated: [],
		onInventoryUpdated: [],
		onChestUpdated: [],
		onWorldChangeBlock: ["preventChange", "preventDrop"],
		onCreateBloxdMeshEntity: [],
		onEntityCollision: [],
		onPlayerAttemptSpawnMob: ["preventSpawn"],
		onPlayerSpawnMob: [],
		onWorldSpawnMob: [],
		onWorldAttemptSpawnMob: ["preventSpawn"],
		onWorldAttemptDespawnMob: ["preventDespawn"],
		onMobDespawned: [],
		onPlayerAttack: [],
		onPlayerDamagingOtherPlayer: ["preventDamage", Number],
		onPlayerDamagingMob: ["preventDamage", Number],
		onPlayerDamagingMeshEntity: [],
		onMobDamagingPlayer: ["preventDamage", Number],
		onMobDamagingOtherMob: ["preventDamage", Number],
		onAttemptKillPlayer: ["preventDeath"],
		onPlayerKilledOtherPlayer: ["keepInventory"],
		onMobKilledPlayer: ["keepInventory"],
		onPlayerKilledMob: ["preventDrop"],
		onMobKilledOtherMob: ["preventDrop"],
		onPlayerPotionEffect: ["preventEffect"],
		onPlayerUsedThrowable: [],
		onPlayerThrowableHitTerrain: [],
		onPlayerStartChargingItem: ["preventCharge"],
		onPlayerFinishChargingItem: [],
		onPlayerFinishQTE: [],
		onPlayerPlayedEmote: [],
		onPlayerEnteredVehicle: [],
		onPlayerExitedVehicle: [],
		onPlayerBoughtShopItem: [],
		onTouchscreenActionButton: [],
		onTaskClaimed: [],
		onChunkLoaded: [],
		onPlayerRequestChunk: [],
		onUiRequestResponded: [],
		onItemDropCreated: []
	}

	static INIT() {
		for (const module of Loader.modules) {
			if (module.handlers) {
				for (const [name, handler] of Object.entries(module.handlers)) {
					if (typeof handler === "function") {
						; (Loader.callbacks[name] ??= []).push(handler)
					}
				}
			}
		}

		for (const [name, callbacks] of Object.entries(Loader.callbacks)) {
			globalThis[name] = function (...args) {
				const results = []
				for (const callback of callbacks) {
					try {
						results.push(callback(...args))
					} catch {
						//@ts-ignore
						const fallback = api.getCallbackValueFallback?.(name)
						if (fallback !== undefined) {
							results.push(fallback)
						}
					}
				}
				return Loader.priorize(results, name)
			}
		}
	}

	static callbacks: Record<string, Callback[]> = {}
	static priorize(e, n, o = Loader.returns) {
		const t = o[n]

		if (t) {
			for (const n of t) {
				if ("string" == typeof n && e.includes(n)) return n
				if (n === Number) {
					const n = e.find(e => typeof e === "number")
					if (n !== undefined) return n
				}
				if (n === Boolean) {
					const n = e.find(e => typeof e === "boolean")
					if (n !== undefined) return n
				}
				if (n === Array) {
					const n = e.find(e => Array.isArray(e))
					if (n !== undefined) return n
				}
				if (n === Object) {
					const n = e.find(e => e && typeof e === "object" && !Array.isArray(e))
					if (n !== undefined) return n
				}
			}
		}
	}
}

Loader.BUILD(BUILD_LOCATION)

import * as $0 from "./src/features/achievements/index"
import * as $1 from "./src/features/infernalMobs/index"
import * as $2 from "./src/features/onDeath/index";
import * as $3 from "./src/features/magic/index";
import * as $4 from "./src/core/scheduler";

Loader.modules = [$0, $1, $2, $3, $4];
Loader.INIT()

api.log("loaded!")