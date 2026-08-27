//created by Enu_Vocaloid_yoRoz

onWorldAttemptSpawnMob = (t, x, y, z) => {
	if (t === "Frost Wraith") return;
	return "preventSpawn"
}
let loadPos = [
	[-10, 1, 30],
	[-12, 1, 30],
	[-14, 1, 30],
	[-16, 1, 30],
	[-18, 1, 30]
]
let loaded = {}
let loadIndex = 0
for (const pos of loadPos) loaded[pos.join(",")] = false
const s = [`iCharging`, `fCharging`, `iceShootIds`, `fireShootIds`,
	`playerDatas`, `cd`, `dataIndex`, `datas`, `attribute`, `changeCd`
]
var itemData = {
	"Molten Magma Rod": 0,
	"Draugr Rod": 1
};
for (const i of s) globalThis[i] = {};
attribute = [`fire`, `ice`];
datas = [
	[{}, {}],
	[{}, {}]
]
var changeCall = (id, slot = null) => {
	if (iCharging[id] || fCharging[id]) {
		delete iCharging[id];
		delete fCharging[id];
		api.removeMiddleScreenBar(id);
		api.setClientOption(id, `runningSpeed`, 7);
		api.setClientOption(id, `walkingSpeed`, 4);
		api.setClientOption(id, `crosshairText`, ``)
	}
	const item = slot === null ?api.getHeldItem(id) : api.getItemSlot(id, slot);
	const index = itemData[item ?.name];
	if (index === undefined) {
		delete playerDatas[id];
		return
	}
	if (dataIndex[id] === undefined) dataIndex[id] = {};
	if (dataIndex[id][index] === undefined || dataIndex[id][index] >= datas[index]
		.length) dataIndex[id][index] = 0;
	const s = dataIndex[id][index];
	playerDatas[id] = datas[index][s]
}

tick = () => {
	if (++cleanTick >= 600) {
		cleanTick = 0;
		asyncCalls = asyncCalls.filter(Boolean)
	}
	if (++countTick % 2 === 0)
		for (const id in playerDatas) {
			playerDatas[id] ?.tick ?.(id)
		}
	if (loadIndex < loadPos.length) {
		const pos = loadPos[loadIndex];
		const key = pos.join(",");
		if (!loaded[key]) {
			api.getBlock(pos);
			loaded[key] = true
		} else {
			eval(api.getBlockData(...pos) ?.persisted ?.shared ?.text ??"");
			loadIndex++;
			if (loadIndex === loadPos.length) api.log(loaded)
		}
	}
}, onPlayerJoin = (id) => {
	changeCall(id);
	return playerDatas[id] ?.onPlayerJoin ?.(id)
}, onPlayerAltAction = (id, x, y, z, block, target) => {
	if (api.isPlayerCrouching(id)) {
		if (iCharging[id] || fCharging[id]) return;
		const item = api.getHeldItem(id) ?.name;
		const index = itemData[item];
		if (index === undefined) return;
		if (changeCd[id]) return;
		changeCd[id] = 1;
		setTimeout(() => delete changeCd[id], 1000);
		let n = (dataIndex[id] ?.[index] ??-1) + 1;
		if (n >= datas[index].length) n = 0;
		if (dataIndex[id] === undefined) dataIndex[id] = {};
		dataIndex[id][index] = n;
		playerDatas[id] = datas[index][n];
		delete fCharging[id];
		delete iCharging[id];
		api.setClientOption(id, `crosshairText`, ``);
		api.sendFlyingMiddleMessage(id, [{
			str: `꧁魔法切り替え!!꧂` + `\n`.repeat(15),
			style: {
				color: `white`
			}
		}], 0, 1000);
		api.sendFlyingMiddleMessage(id, [{
			str: n + `\n`.repeat(11),
			style: {
				color: `aqua`
			}
		}], 0, 1000);
		api.removeMiddleScreenBar(id);
		return
	}
	return playerDatas[id] ?.onPlayerAltAction ?.(id, x, y, z, block, target)
}, onPlayerClick = (id, alt, x, y, z, block, target) => {
	return playerDatas[id] ?.onPlayerClick ?.(id, alt, x, y, z, target)
}, onPlayerClickUp = (id, alt, x, y, z, block, target) => {
	return playerDatas[id] ?.onPlayerClickUp ?.(id, alt, x, y, z, block, target)
}, onPlayerSelectInventorySlot = (id, slot) => {
	api.setClientOptionToDefault(id, `touchscreenActionButton`);
	changeCall(id);
	return playerDatas[id] ?.onPlayerSelectInventorySlot ?.(id, slot)
}, onPlayerLeave = (id) => {
	return playerDatas[id] ?.onPlayerLeave ?.(id);
	delete playerDatas[id];
	delete dataIndex[id]
}, onAttemptKillPlayer = (id) => {
	return playerDatas[id] ?.onAttemptKillPlayer ?.(id)
}, onTouchscreenActionButton = (id, touchDown) => {
	if (api.isPlayerCrouching(id) && touchDown) {
		const item = api.getHeldItem(id) ?.name;
		const index = itemData[item];
		if (index === undefined) return;
		if (changeCd[id]) return;
		changeCd[id] = 1;
		setTimeout(() => delete changeCd[id], 1000);
		let n = (dataIndex[id] ?.[index] ??-1) + 1;
		if (n >= datas[index].length) n = 0;
		if (dataIndex[id] === undefined) dataIndex[id] = {};
		dataIndex[id][index] = n;
		playerDatas[id] = datas[index][n];
		delete fCharging[id];
		delete iCharging[id];
		api.setClientOption(id, `crosshairText`, ``);
		api.sendFlyingMiddleMessage(id, [{
			str: `꧁魔法切り替え!!꧂` + `\n`.repeat(15),
			style: {
				color: `white`
			}
		}], 0, 1000);
		api.sendFlyingMiddleMessage(id, [{
			str: n + `\n`.repeat(11),
			style: {
				color: `aqua`
			}
		}], 0, 1000);
		api.removeMiddleScreenBar(id);
		return
	}
	return playerDatas[id] ?.onTouchscreenActionButton ?.(id, touchDown)
}, onPlayerPickedUpItem = (id, name, amount, eId) => {
	changeCall(id);
	return playerDatas[id] ?.onPlayerPickedUpItem ?.(id, name, amount, eId)
}, onPlayerSwapInvenSlots = (id, i, j) => {
	api.setClientOptionToDefault(id, `touchscreenActionButton`);
	return playerDatas[id] ?.onPlayerSwapInvenSlots ?.(id, i, j)
}, onPlayerDropItem = (id, x, y, z, name, amount, slot) => {
	return playerDatas[id] ?.onPlayerDropItem ?.(id, x, y, z, name, amount,
		slot)
}
onPlayerDamagingMob = (a, b, c, d, e) => {
	let text, health = api.getHealth(b),
		newHealth = (health - c),
		rHealth = Math.round(newHealth);
	text = String(c);
	if (rHealth < 0) text = `Dead`
	api.sendFlyingMiddleMessage(a, [{
		str: text,
		style: {
			color: `white`,
			opacity: 0.5,
			fontSize: "20px"
		}
	}, {
		str: `(` + rHealth + `)`,
		style: {
			color: `red`,
			opacity: 0.5,
			fontSize: "10px"
		}
	}], 30, 1000)
}
