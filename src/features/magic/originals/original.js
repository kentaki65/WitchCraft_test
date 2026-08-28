//created by Enu_Vocaloid_yoRoz
const iCharging = {};
const fCharging = {};
const iceShootIds = {};
const fireShootIds = {};
const playerDatas = {};
const cd = {};
const dataIndex = {};
const datas = [
	[{
		onPlayerAltAction: (id, x, y, z, block, target) => {
			if (api.getHeldItem(id)?.name !== `Molten Magma Rod`) return
			if (!fCharging[id]) { fCharging[id] = api.now(); api.initiateMiddleScreenBar(id, 5000, true, 0); api.setClientOption(id, `runningSpeed`, 2); api.setClientOption(id, `walkingSpeed`, 2) }
		},
		onPlayerClick: (id, alt, x, y, z, block, target) => {
			if (fCharging[id]) return
			if (api.getHeldItem(id)?.name !== `Molten Magma Rod`) return
			if (!fCharging[id]) { fCharging[id] = api.now(); api.initiateMiddleScreenBar(id, 5000, true, 0); api.setClientOption(id, `runningSpeed`, 2); api.setClientOption(id, `walkingSpeed`, 2) }
		},
		onPlayerClickUp: (id, alt, x, y, z, block, target) => {
			if (!fCharging[id]) return;
			api.setClientOption(id, `runningSpeed`, 7)
			api.setClientOption(id, `walkingSpeed`, 4)
			let s = api.now() - fCharging[id]
			if (s >= 500) {
				let [x, y, z] = api.getPosition(id)
				let [dx, dy, dz] = api.getPlayerFacingInfo(id)?.dir || [0, 0, 1]
				let points = Math.min(20, Math.floor(s / 250))
				let damage = Math.min(100, 10 + Math.floor(s / 1000) * 10 / 2)
				fireShootIds[id] = []
				for (let d = 4; d <= points; d += 2) {
					fireShootIds[id].push(setTimeout(() => { let px = x + dx * d; let py = y + dy * d; let pz = z + dz * d; api.broadcastSound(`firecracker1`, 1, 1, { playerIdOrPos: [px, py, pz], maxHearDist: 10 }); api.playParticleEffect({ pos1: [px - 2, py - 2, pz - 2], pos2: [px + 2, py + 2, pz + 2], presetId: `redFirecrackerLarge` }); for (const i of api.getEntitiesInRect([px - 4, py - 4, pz - 4], [px + 4, py + 4, pz + 4])) { if (i === id) continue; api.attemptApplyDamage({ eId: id, hitEId: i, attemptedDmgAmt: Math.max(1, damage - d), withItem: `Fireball Block` }) } }, d * 100))
				}
			}
			api.removeMiddleScreenBar(id)
			delete fCharging[id]
			cd[id] = api.now()
		},
		onPlayerSelectInventorySlot: (id, slot) => { if (fCharging[id]) { delete fCharging[id]; api.removeMiddleScreenBar(id) } api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); if (api.getHeldItem(id)?.name === `Molten Magma Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Molten Magma Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) } },
		onPlayerSwapInvenSlots: (id, i, j) => { api.setClientOptionToDefault(id, `touchscreenActionButton`); if (fCharging[id]) { delete fCharging[id]; api.removeMiddleScreenBar(id) } api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); const item = api.getItemSlot(id, j), n = item?.name ?? "Dirt"; if (itemData[n] && 0 <= i && 9 >= i) { api.setSelectedInventorySlotI(id, i); changeCall(id, j); api.setClientOption(id, `touchscreenActionButton`, [{ icon: n }]) } },
		onPlayerDropItem: (id, x, y, z, item, amount, slot) => { if (fCharging[id]) { delete fCharging[id]; api.removeMiddleScreenBar(id) } api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); if (api.getSelectedInventorySlotI(id) !== slot && api.getHeldItem(id)?.name === `Molten Magma Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Molten Magma Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) } },
		onTouchscreenActionButton: (id, touchDown) => {
			if (touchDown) {
				if (api.getHeldItem(id)?.name !== `Molten Magma Rod`) return
				if (!fCharging[id]) { fCharging[id] = api.now(); api.initiateMiddleScreenBar(id, 5000, true, 0); api.setClientOption(id, `runningSpeed`, 2); api.setClientOption(id, `walkingSpeed`, 2) }
			} else {
				if (!fCharging[id]) return

				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				let s = api.now() - fCharging[id]
				if (s >= 500) {
					let [x, y, z] = api.getPosition(id)
					let [dx, dy, dz] = api.getPlayerFacingInfo(id)?.dir || [0, 0, 1]
					let points = Math.min(20, Math.floor(s / 250))
					let damage = Math.min(100, 10 + Math.floor(s / 1000) * 10 / 2)
					fireShootIds[id] = []
					for (let d = 4; d <= points; d += 2) {
						fireShootIds[id].push(setTimeout(() => { let px = x + dx * d; let py = y + dy * d; let pz = z + dz * d; api.broadcastSound(`firecracker1`, 1, 1, { playerIdOrPos: [px, py, pz], maxHearDist: 10 }); api.playParticleEffect({ pos1: [px - 2, py - 2, pz - 2], pos2: [px + 2, py + 2, pz + 2], presetId: `redFirecrackerLarge` }); for (const i of api.getEntitiesInRect([px - 4, py - 4, pz - 4], [px + 4, py + 4, pz + 4])) { if (i === id) continue; api.attemptApplyDamage({ eId: id, hitEId: i, attemptedDmgAmt: Math.max(1, damage - d), withItem: `Fireball Block` }) } }, d * 100))
					}
				}
				api.removeMiddleScreenBar(id)
				delete fCharging[id]
				cd[id] = api.now()
			}
		},
		tick: (id) => {
			if (!fCharging[id]) return
			let s = api.now() - fCharging[id]
			api.shakePlayerCamera(id, s / 100000, 1000 / 20)
			let c = [`white`, `white`, `lime`, `lime`, `yellow`, `yellow`, `orange`, `orange`, `red`, `red`][Math.min(8, Math.floor(s / 500))]
			api.sendFlyingMiddleMessage(id, [{ icon: `fa-solid fa-crosshairs`, style: { color: c, opacity: 0.3 } }, { str: `\n`.repeat(3) }], 0, 100)
			if (s > 5000) {
				if (!api.isAlive(id)) return
				let [x, y, z] = api.getPosition(id)
				let [dx, dy, dz] = api.getPlayerFacingInfo(id)?.dir || [0, 0, 1]
				let points = Math.min(20, Math.floor(s / 250))
				let damage = Math.min(100, 10 + Math.floor(s / 1000) * 10 / 2)
				fireShootIds[id] = []
				for (let d = 4; d <= points; d += 2) {
					fireShootIds[id].push(setTimeout(() => { let px = x + dx * d; let py = y + dy * d; let pz = z + dz * d; api.broadcastSound(`firecracker1`, 1, 1, { playerIdOrPos: [px, py, pz], maxHearDist: 10 }); api.playParticleEffect({ pos1: [px - 2, py - 2, pz - 2], pos2: [px + 2, py + 2, pz + 2], presetId: `redFirecrackerLarge` }); for (const i of api.getEntitiesInRect([px - 4, py - 4, pz - 4], [px + 4, py + 4, pz + 4])) { if (i === id) continue; api.attemptApplyDamage({ eId: id, hitEId: i, attemptedDmgAmt: Math.max(1, damage - d), withItem: `Fireball Block` }) } }, d * 100))
				}
				fCharging[id] = api.now()
				api.initiateMiddleScreenBar(id, 5000, true, 0)
				api.setClientOption(id, `runningSpeed`, 2)
				api.setClientOption(id, `walkingSpeed`, 2)
			}
		},
		onPlayerPickedUpItem: (id, name, amount, eId) => {
			if (api.getHeldItem(id)?.name === `Molten Magma Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Molten Magma Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) }
		},
		onAttemptKillPlayer: (id) => {
			if (fCharging[id]) {
				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				api.removeMiddleScreenBar(id)
				delete fCharging[id]
				cd[id] = api.now()
			}
			if (iCharging[id]) {
				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				api.removeMiddleScreenBar(id)
				delete iCharging[id]
				cd[id] = api.now()
			}
			if (fireShootIds[id]) {
				for (const i of fireShootIds[id]) clearTimeout(i)
				delete fireShootIds[id]
			}
			if (iceShootIds[id]) {
				for (const i of iceShootIds[id]) clearTimeout(i)
				delete iceShootIds[id]
			}
		},
		onPlayerLeave: (id) => {
			delete fCharging[id]
			if (fireShootIds[id]) {
				for (const i of fireShootIds[id]) clearTimeout(i)
				delete fireShootIds[id]
			}
		},
		onPlayerJoin: (id) => {
			if (api.getHeldItem(id)?.name === `Molten Magma Rod`) { 
				api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Molten Magma Rod` }]) 
			} else { 
				api.setClientOptionToDefault(id, `touchscreenActionButton`) 
			}
		}
	}, {
		onPlayerAltAction: (id, x, y, z, block, target) => {
			if (api.getHeldItem(id)?.name !== `Molten Magma Rod`) return
			if (!fCharging[id]) { fCharging[id] = api.now(); api.initiateMiddleScreenBar(id, 5000, true, 0); api.setClientOption(id, `runningSpeed`, 2); api.setClientOption(id, `walkingSpeed`, 2) }
		},
		onPlayerClick: (id, alt, x, y, z, block, target) => {
			if (fCharging[id]) return
			if (api.getHeldItem(id)?.name !== `Molten Magma Rod`) return
			if (!fCharging[id]) { fCharging[id] = api.now(); api.initiateMiddleScreenBar(id, 5000, true, 0); api.setClientOption(id, `runningSpeed`, 2); api.setClientOption(id, `walkingSpeed`, 2) }
		},
		onPlayerClickUp: (id, alt, x, y, z, block, target) => {
			if (!fCharging[id]) return

			api.setClientOption(id, `runningSpeed`, 7)
			api.setClientOption(id, `walkingSpeed`, 4)
			let s = api.now() - fCharging[id]
			if (s >= 2000) {
				let [x, y, z] = api.getPosition(id)
				y += 1.2
				const f = api.getPlayerFacingInfo(id), [dx, dy, dz] = f ? f.dir : [0, 0, 1]
				x += dx * 0.5
				y += dy * 0.5
				z += dz * 0.5
				api.broadcastSound(`cannonFire3`, 1, 1, { playerIdOrPos: [x, y, z], maxHearDist: 10 })
				api.playParticleEffect({ pos1: [x - 0.2, y - 0.2, z - 0.2], pos2: [x + 0.2, y + 0.2, z + 0.2], dir1: [dx * 18 - 1, dy * 18 - 1, dz * 18 - 1], dir2: [dx * 24 + 1, dy * 24 + 1, dz * 24 + 1], texture: `generic_2`, manualEmitCount: 40, minEmitPower: 0, maxEmitPower: 1.5, minLifeTime: 0.5, maxLifeTime: 0.9, minSize: 1.5, maxSize: 3.5, gravity: [0, 1, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [255, 220, 100, 1] }, { timeFraction: 0.2, minColor: [255, 120, 0, 1], maxColor: [255, 150, 0, 1] }, { timeFraction: 0.6, minColor: [255, 40, 0, 0.8], maxColor: [255, 0, 0, 1] }, { timeFraction: 1, minColor: [150, 0, 0, 0], maxColor: [100, 0, 0, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.6, factor2: 0.6 }] })
				api.playParticleEffect({ pos1: [x - 0.3, y - 0.3, z - 0.3], pos2: [x + 0.3, y + 0.3, z + 0.3], dir1: [dx * 12 - 3, dy * 12 - 3, dz * 12 - 3], dir2: [dx * 20 + 3, dy * 20 + 3, dz * 20 + 3], texture: `square_particle`, manualEmitCount: 45, minEmitPower: 0, maxEmitPower: 2, minLifeTime: 0.4, maxLifeTime: 0.8, minSize: 0.3, maxSize: 0.9, gravity: [0, 2, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 100, 1], maxColor: [255, 200, 50, 1] }, { timeFraction: 1, minColor: [255, 0, 0, 0], maxColor: [200, 0, 0, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.7, factor2: 0.7 }] })
				let dir = [dx, dy, dz]
				let hit = {}
				let power = Math.min(20, s / 250)
				for (let i = 1; i <= 10; i++) {
					let tx = x + dir[0] * i
					let ty = y + dir[1] * i
					let tz = z + dir[2] * i
					for (const e of api.getEntitiesInRect([tx - 2, ty - 2, tz - 2], [tx + 2, ty + 2, tz + 2])) {
						if (e === id || hit[e]) continue
						hit[e] = true
						api.applyImpulse(e, ...dir.map(v => v * power * 2))
					}
					api.applyImpulse(id, ...dir.map(v => v * power * 0.3))
				}
			}
			api.removeMiddleScreenBar(id)
			delete fCharging[id]
			cd[id] = api.now()
		},
		onPlayerSelectInventorySlot: (id, slot) => {
			if (fCharging[id]) { delete fCharging[id]; api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); api.removeMiddleScreenBar(id) }
			if (api.getHeldItem(id)?.name === `Molten Magma Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Molten Magma Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) }
		},
		onPlayerSwapInvenSlots: (id, i, j) => { api.setClientOptionToDefault(id, `touchscreenActionButton`); if (fCharging[id]) { delete fCharging[id]; api.removeMiddleScreenBar(id) } api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); const item = api.getItemSlot(id, j), n = item?.name ?? "Dirt"; if (itemData[n] && 0 <= i && 9 >= i) { api.setSelectedInventorySlotI(id, i); changeCall(id, j); api.setClientOption(id, `touchscreenActionButton`, [{ icon: n }]) } },
		onPlayerDropItem: (id, x, y, z, item, amount, slot) => { if (fCharging[id]) { delete fCharging[id]; api.removeMiddleScreenBar(id) } api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); if (api.getSelectedInventorySlotI(id) !== slot && api.getHeldItem(id)?.name === `Molten Magma Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Molten Magma Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) } },
		onTouchscreenActionButton: (id, touchDown) => {
			if (touchDown) {
				if (api.getHeldItem(id)?.name !== `Molten Magma Rod`) return
				if (!fCharging[id]) { fCharging[id] = api.now(); api.initiateMiddleScreenBar(id, 5000, true, 0); api.setClientOption(id, `runningSpeed`, 2); api.setClientOption(id, `walkingSpeed`, 2) }
			} else {
				if (!fCharging[id]) return

				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				let s = api.now() - fCharging[id]
				if (s >= 2000) {
					let [x, y, z] = api.getPosition(id)
					y += 1.2
					const f = api.getPlayerFacingInfo(id), [dx, dy, dz] = f ? f.dir : [0, 0, 1]
					x += dx * 0.5
					y += dy * 0.5
					z += dz * 0.5
					api.broadcastSound(`cannonFire3`, 1, 1, { playerIdOrPos: [x, y, z], maxHearDist: 10 })
					api.playParticleEffect({ pos1: [x - 0.2, y - 0.2, z - 0.2], pos2: [x + 0.2, y + 0.2, z + 0.2], dir1: [dx * 18 - 1, dy * 18 - 1, dz * 18 - 1], dir2: [dx * 24 + 1, dy * 24 + 1, dz * 24 + 1], texture: `generic_2`, manualEmitCount: 40, minEmitPower: 0, maxEmitPower: 1.5, minLifeTime: 0.5, maxLifeTime: 0.9, minSize: 1.5, maxSize: 3.5, gravity: [0, 1, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [255, 220, 100, 1] }, { timeFraction: 0.2, minColor: [255, 120, 0, 1], maxColor: [255, 150, 0, 1] }, { timeFraction: 0.6, minColor: [255, 40, 0, 0.8], maxColor: [255, 0, 0, 1] }, { timeFraction: 1, minColor: [150, 0, 0, 0], maxColor: [100, 0, 0, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.6, factor2: 0.6 }] })
					api.playParticleEffect({ pos1: [x - 0.3, y - 0.3, z - 0.3], pos2: [x + 0.3, y + 0.3, z + 0.3], dir1: [dx * 12 - 3, dy * 12 - 3, dz * 12 - 3], dir2: [dx * 20 + 3, dy * 20 + 3, dz * 20 + 3], texture: `square_particle`, manualEmitCount: 45, minEmitPower: 0, maxEmitPower: 2, minLifeTime: 0.4, maxLifeTime: 0.8, minSize: 0.3, maxSize: 0.9, gravity: [0, 2, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 100, 1], maxColor: [255, 200, 50, 1] }, { timeFraction: 1, minColor: [255, 0, 0, 0], maxColor: [200, 0, 0, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.7, factor2: 0.7 }] })
					let dir = [dx, dy, dz]
					let hit = {}
					let power = Math.min(20, s / 250)
					for (let i = 1; i <= 10; i++) {
						let tx = x + dir[0] * i
						let ty = y + dir[1] * i
						let tz = z + dir[2] * i
						for (const e of api.getEntitiesInRect([tx - 2, ty - 2, tz - 2], [tx + 2, ty + 2, tz + 2])) {
							if (e === id || hit[e]) continue
							hit[e] = true
							api.applyImpulse(e, ...dir.map(v => v * power * 2))
						}
						api.applyImpulse(id, ...dir.map(v => v * power * 0.3))
					}
				}
				api.removeMiddleScreenBar(id)
				delete fCharging[id]
				cd[id] = api.now()
			}
		},
		onPlayerPickedUpItem: (id, name, amount, eId) => {
			if (api.getHeldItem(id)?.name === `Molten Magma Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Molten Magma Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) }
		},
		onAttemptKillPlayer: (id) => {
			if (fCharging[id]) {
				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				api.removeMiddleScreenBar(id)
				delete fCharging[id]
				cd[id] = api.now()
			}
			if (iCharging[id]) {
				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				api.removeMiddleScreenBar(id)
				delete iCharging[id]
				cd[id] = api.now()
			}
			if (fireShootIds[id]) {
				for (const i of fireShootIds[id]) clearTimeout(i)
				delete fireShootIds[id]
			}
			if (iceShootIds[id]) {
				for (const i of iceShootIds[id]) clearTimeout(i)
				delete iceShootIds[id]
			}
		},
		onPlayerLeave: (id) => {
			delete fCharging[id]
			if (fireShootIds[id]) {
				for (const i of fireShootIds[id]) clearTimeout(i)
				delete fireShootIds[id]
			}
		},
		onPlayerJoin: (id) => {
			if (api.getHeldItem(id)?.name === `Molten Magma Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Molten Magma Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) }
		},
		tick: (id) => {
			if (!fCharging[id]) return
			let s = api.now() - fCharging[id]
			api.shakePlayerCamera(id, s / 100000, 1000 / 20)
			let c = [`white`, `white`, `white`, `white`, `lime`, `lime`, `yellow`, `orange`, `red`, `red`][Math.min(8, Math.floor(s / 500))]
			api.sendFlyingMiddleMessage(id, [{ icon: `fa-solid fa-crosshairs`, style: { color: c, opacity: 0.3 } }, { str: `\n`.repeat(3) }], 0, 100)
			if (s > 5000) {
				if (!api.isAlive(id)) return
				let [x, y, z] = api.getPosition(id)
				y += 1.2
				const f = api.getPlayerFacingInfo(id), [dx, dy, dz] = f ? f.dir : [0, 0, 1]
				x += dx * 0.5
				y += dy * 0.5
				z += dz * 0.5
				api.broadcastSound(`cannonFire3`, 1, 1, { playerIdOrPos: [x, y, z], maxHearDist: 10 })
				api.playParticleEffect({ pos1: [x - 0.2, y - 0.2, z - 0.2], pos2: [x + 0.2, y + 0.2, z + 0.2], dir1: [dx * 18 - 1, dy * 18 - 1, dz * 18 - 1], dir2: [dx * 24 + 1, dy * 24 + 1, dz * 24 + 1], texture: `generic_2`, manualEmitCount: 40, minEmitPower: 0, maxEmitPower: 1.5, minLifeTime: 0.5, maxLifeTime: 0.9, minSize: 1.5, maxSize: 3.5, gravity: [0, 1, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [255, 220, 100, 1] }, { timeFraction: 0.2, minColor: [255, 120, 0, 1], maxColor: [255, 150, 0, 1] }, { timeFraction: 0.6, minColor: [255, 40, 0, 0.8], maxColor: [255, 0, 0, 1] }, { timeFraction: 1, minColor: [150, 0, 0, 0], maxColor: [100, 0, 0, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.6, factor2: 0.6 }] })
				api.playParticleEffect({ pos1: [x - 0.3, y - 0.3, z - 0.3], pos2: [x + 0.3, y + 0.3, z + 0.3], dir1: [dx * 12 - 3, dy * 12 - 3, dz * 12 - 3], dir2: [dx * 20 + 3, dy * 20 + 3, dz * 20 + 3], texture: `square_particle`, manualEmitCount: 45, minEmitPower: 0, maxEmitPower: 2, minLifeTime: 0.4, maxLifeTime: 0.8, minSize: 0.3, maxSize: 0.9, gravity: [0, 2, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 100, 1], maxColor: [255, 200, 50, 1] }, { timeFraction: 1, minColor: [255, 0, 0, 0], maxColor: [200, 0, 0, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.7, factor2: 0.7 }] })
				let dir = [dx, dy, dz]
				let hit = {}
				let power = Math.min(20, s / 250)
				for (let i = 1; i <= 10; i++) {
					let tx = x + dir[0] * i
					let ty = y + dir[1] * i
					let tz = z + dir[2] * i
					for (const e of api.getEntitiesInRect([tx - 2, ty - 2, tz - 2], [tx + 2, ty + 2, tz + 2])) {
						if (e === id || hit[e]) continue
						hit[e] = true
						api.applyImpulse(e, ...dir.map(v => v * power * 2))
					}
					api.applyImpulse(id, ...dir.map(v => v * power * 0.3))
					fCharging[id] = api.now()
					api.initiateMiddleScreenBar(id, 5000, true, 0)
					api.setClientOption(id, `runningSpeed`, 2)
					api.setClientOption(id, `walkingSpeed`, 2)
				}
			}
		}
	}],
	[{
		onPlayerAltAction: (id, x, y, z, block, target) => {
			if (api.getHeldItem(id)?.name !== `Draugr Rod`) return
			if (!iCharging[id]) { iCharging[id] = api.now(); api.initiateMiddleScreenBar(id, 5000, true, 0); api.setClientOption(id, `runningSpeed`, 2); api.setClientOption(id, `walkingSpeed`, 2) }
		},
		onPlayerClick: (id, alt, x, y, z, block, target) => {
			if (iCharging[id]) return
			if (api.getHeldItem(id)?.name !== `Draugr Rod`) return
			if (!iCharging[id]) { iCharging[id] = api.now(); api.initiateMiddleScreenBar(id, 5000, true, 0); api.setClientOption(id, `runningSpeed`, 2); api.setClientOption(id, `walkingSpeed`, 2) }
		},
		onPlayerClickUp: (id, alt, x, y, z, block, target) => {
			if (!iCharging[id]) return

			api.setClientOption(id, `runningSpeed`, 7)
			api.setClientOption(id, `walkingSpeed`, 4)
			let s = api.now() - iCharging[id]
			if (s >= 500) {
				let [x, y, z] = api.getPosition(id)
				y += 1.5
				const f = api.getPlayerFacingInfo(id), [dx, dy, dz] = f ? f.dir : [0, 0, 1]
				api.playParticleEffect({ pos1: [x + dx - 0.2, y + dy - 0.2, z + dz - 0.2], pos2: [x + dx + 0.2, y + dy + 0.2, z + dz + 0.2], dir1: [dx * 10, dy * 10, dz * 10], dir2: [dx * 12, dy * 12, dz * 12], texture: `glint`, manualEmitCount: Math.min(20, 3 + Math.floor(s / 500) * 2), minEmitPower: 1, maxEmitPower: 2, minLifeTime: s * 0.0003, maxLifeTime: s * 0.0003, minSize: 0.4, maxSize: 0.5, gravity: [0, 0, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [100, 100, 255, 1], maxColor: [100, 100, 255, 1] }, { timeFraction: 1, minColor: [255, 255, 255, 0], maxColor: [255, 255, 255, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 1, factor2: 1 }] })
				let points = Math.min(20, Math.floor(s / 250))
				let damage = Math.min(200, 10 + Math.floor(s / 1000) * 10)
				iceShootIds[id] = []
				for (let d = 1; d <= points; d++) {
					iceShootIds[id].push(setTimeout(() => { let px = x + dx * d; let py = y + dy * d; let pz = z + dz * d; api.broadcastSound(`croneHurt1`, 1, 1, { playerIdOrPos: [px, py, pz], maxHearDist: 10 }); for (const i of api.getEntitiesInRect([px - 1.5, py - 2, pz - 1.5], [px + 1.5, py + 2, pz + 1.5])) { if (i === id) continue; try { api.applyEffect(i, `Frozen`, s, { displayName: `Iced`, initiatorId: id }) } catch (e) { } api.attemptApplyDamage({ eId: id, hitEId: i, attemptedDmgAmt: Math.max(1, damage - d), withItem: `Iceball` }) } }, d * 100))
				}
			}
			api.removeMiddleScreenBar(id)
			delete iCharging[id]
			cd[id] = api.now()
		},
		onPlayerSelectInventorySlot: (id, slot) => {
			if (iCharging[id]) { delete iCharging[id]; api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); api.removeMiddleScreenBar(id) }
			if (api.getHeldItem(id)?.name === `Draugr Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Draugr Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) }
		},
		onPlayerSwapInvenSlots: (id, i, j) => { api.setClientOptionToDefault(id, `touchscreenActionButton`); if (fCharging[id]) { delete fCharging[id]; api.removeMiddleScreenBar(id) } api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); const item = api.getItemSlot(id, j), n = item?.name ?? "Dirt"; if (itemData[n] && 0 <= i && 9 >= i) { api.setSelectedInventorySlotI(id, i); changeCall(id, j); api.setClientOption(id, `touchscreenActionButton`, [{ icon: n }]) } },
		onPlayerDropItem: (id, x, y, z, item, amount, slot) => { if (iCharging[id]) { delete iCharging[id]; api.removeMiddleScreenBar(id) } api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); if (api.getSelectedInventorySlotI(id) !== slot && api.getHeldItem(id)?.name === `Draugr Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Draugr Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) } },
		onTouchscreenActionButton: (id, touchDown) => {
			if (touchDown) {
				if (api.getHeldItem(id)?.name !== `Draugr Rod`) return
				if (!iCharging[id]) { iCharging[id] = api.now(); api.initiateMiddleScreenBar(id, 5000, true, 0); api.setClientOption(id, `runningSpeed`, 2); api.setClientOption(id, `walkingSpeed`, 2) }
			} else {
				if (!iCharging[id]) return

				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				let s = api.now() - iCharging[id]
				if (s >= 500) {
					let [x, y, z] = api.getPosition(id)
					y += 1.5
					const f = api.getPlayerFacingInfo(id), [dx, dy, dz] = f ? f.dir : [0, 0, 1]
					api.playParticleEffect({ pos1: [x + dx - 0.2, y + dy - 0.2, z + dz - 0.2], pos2: [x + dx + 0.2, y + dy + 0.2, z + dz + 0.2], dir1: [dx * 10, dy * 10, dz * 10], dir2: [dx * 12, dy * 12, dz * 12], texture: `glint`, manualEmitCount: Math.min(20, 3 + Math.floor(s / 500) * 2), minEmitPower: 1, maxEmitPower: 2, minLifeTime: s * 0.0003, maxLifeTime: s * 0.0003, minSize: 0.4, maxSize: 0.5, gravity: [0, 0, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [100, 100, 255, 1], maxColor: [100, 100, 255, 1] }, { timeFraction: 1, minColor: [255, 255, 255, 0], maxColor: [255, 255, 255, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 1, factor2: 1 }] })
					let points = Math.min(20, Math.floor(s / 250))
					let damage = Math.min(200, 10 + Math.floor(s / 1000) * 10)
					iceShootIds[id] = []
					for (let d = 1; d <= points; d++) {
						iceShootIds[id].push(setTimeout(() => { let px = x + dx * d; let py = y + dy * d; let pz = z + dz * d; api.broadcastSound(`croneHurt1`, 1, 1, { playerIdOrPos: [px, py, pz], maxHearDist: 10 }); for (const i of api.getEntitiesInRect([px - 1.5, py - 2, pz - 1.5], [px + 1.5, py + 2, pz + 1.5])) { if (i === id) continue; try { api.applyEffect(i, `Frozen`, s, { displayName: `Iced`, initiatorId: id }) } catch (e) { }; api.attemptApplyDamage({ eId: id, hitEId: i, attemptedDmgAmt: Math.max(1, damage - d), withItem: `Iceball` }) } }, d * 100))
					}
				}
				api.removeMiddleScreenBar(id)
				delete iCharging[id]
				cd[id] = api.now()
			}
		},
		tick: (id) => {
			if (!iCharging[id]) return
			let s = api.now() - iCharging[id]
			api.shakePlayerCamera(id, s / 100000, 1000 / 20)
			let c = [`white`, `lime`, `lime`, `lime`, `yellow`, `yellow`, `orange`, `orange`, `red`, `red`][Math.min(8, Math.floor(s / 500))]
			api.sendFlyingMiddleMessage(id, [{ icon: `fa-solid fa-crosshairs`, style: { color: c, opacity: 0.3 } }, { str: `\n`.repeat(3) }], 0, 100)
			if (s > 5000) {
				let [x, y, z] = api.getPosition(id)
				y += 1.5
				const f = api.getPlayerFacingInfo(id), [dx, dy, dz] = f ? f.dir : [0, 0, 1]
				api.playParticleEffect({ pos1: [x + dx - 0.2, y + dy - 0.2, z + dz - 0.2], pos2: [x + dx + 0.2, y + dy + 0.2, z + dz + 0.2], dir1: [dx * 10, dy * 10, dz * 10], dir2: [dx * 12, dy * 12, dz * 12], texture: `glint`, manualEmitCount: Math.min(20, 3 + Math.floor(s / 500) * 2), minEmitPower: 1, maxEmitPower: 2, minLifeTime: s * 0.0003, maxLifeTime: s * 0.0003, minSize: 0.4, maxSize: 0.5, gravity: [0, 0, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [100, 100, 255, 1], maxColor: [100, 100, 255, 1] }, { timeFraction: 1, minColor: [255, 255, 255, 0], maxColor: [255, 255, 255, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 1, factor2: 1 }] })
				if (!api.isAlive(id)) return
				let points = Math.min(20, Math.floor(s / 250))
				let damage = Math.min(200, 10 + Math.floor(s / 1000) * 10)
				iceShootIds[id] = []
				for (let d = 1; d <= points; d++) {
					iceShootIds[id].push(setTimeout(() => { let px = x + dx * d; let py = y + dy * d; let pz = z + dz * d; api.broadcastSound(`croneHurt1`, 1, 1, { playerIdOrPos: [px, py, pz], maxHearDist: 10 }); for (const i of api.getEntitiesInRect([px - 1.5, py - 2, pz - 1.5], [px + 1.5, py + 2, pz + 1.5])) { if (i === id) continue; try { api.applyEffect(i, `Frozen`, s, { displayName: `Iced`, initiatorId: id }) } catch (e) { }; api.attemptApplyDamage({ eId: id, hitEId: i, attemptedDmgAmt: Math.max(1, damage - d), withItem: `Iceball` }) } }, d * 100))
				}
				iCharging[id] = api.now()
				api.initiateMiddleScreenBar(id, 5000, true, 0)
				api.setClientOption(id, `runningSpeed`, 2)
				api.setClientOption(id, `walkingSpeed`, 2)
			}
		},
		onPlayerPickedUpItem: (id, name, amount, eId) => {
			if (api.getHeldItem(id)?.name === `Draugr Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Draugr Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) }
		},
		onAttemptKillPlayer: (id) => {
			if (fCharging[id]) {
				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				api.removeMiddleScreenBar(id)
				delete fCharging[id]
				cd[id] = api.now()
			}
			if (iCharging[id]) {
				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				api.removeMiddleScreenBar(id)
				delete iCharging[id]
				cd[id] = api.now()
			}
			if (fireShootIds[id]) {
				for (const i of fireShootIds[id]) clearTimeout(i)
				delete fireShootIds[id]
			}
			if (iceShootIds[id]) {
				for (const i of iceShootIds[id]) clearTimeout(i)
				delete iceShootIds[id]
			}
		},
		onPlayerLeave: (id) => {
			delete iCharging[id]
			if (iceShootIds[id]) {
				for (const i of iceShootIds[id]) clearTimeout(i)
				delete iceShootIds[id]
			}
		},
		onPlayerJoin: (id) => {
			if (api.getHeldItem(id)?.name === `Draugr Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Draugr Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) }
		}
	}, {
		onPlayerAltAction: (id, x, y, z, block, target) => {
			if (api.getHeldItem(id)?.name !== `Draugr Rod`) return
			if (!iCharging[id]) {
				iCharging[id] = api.now()
				api.initiateMiddleScreenBar(id, 5000, true, 0)
				api.setClientOption(id, `runningSpeed`, 2)
				api.setClientOption(id, `walkingSpeed`, 2)
			}
		},
		onPlayerClick: (id, alt, x, y, z, block, target) => {
			if (iCharging[id]) return
			if (api.getHeldItem(id)?.name !== `Draugr Rod`) return
			if (!iCharging[id]) {
				iCharging[id] = api.now()
				api.initiateMiddleScreenBar(id, 5000, true, 0)
				api.setClientOption(id, `runningSpeed`, 2)
				api.setClientOption(id, `walkingSpeed`, 2)
			}
		},
		onPlayerClickUp: (id, alt, x, y, z, block, target) => {
			if (!iCharging[id]) return

			api.setClientOption(id, `runningSpeed`, 7)
			api.setClientOption(id, `walkingSpeed`, 4)
			let s = api.now() - iCharging[id]
			if (s >= 2000) {
				let [x, y, z] = api.getPosition(id)
				y += 1.2
				const f = api.getPlayerFacingInfo(id), [dx, dy, dz] = f ? f.dir : [0, 0, 1]
				x += dx * 0.5
				y += dy * 0.5
				z += dz * 0.5
				api.broadcastSound(`metalDoorKnock`, 1, 1, { playerIdOrPos: [x, y, z], maxHearDist: 10 })
				api.playParticleEffect({ pos1: [x - 10.5, y - 10, z - 10.5], pos2: [x + 10.5, y + 10, z + 10.5], dir1: [dx * 40 - 1, dy * 40 - 1, dz * 40 - 1], dir2: [dx * 50 + 1, dy * 50 + 1, dz * 50 + 1], texture: `glint`, manualEmitCount: 80, minEmitPower: 1, maxEmitPower: 1.2, minLifeTime: 0.3, maxLifeTime: 0.5, minSize: 2, maxSize: 5, gravity: [0, 0, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [220, 245, 255, 1] }, { timeFraction: 0.5, minColor: [100, 200, 255, 1], maxColor: [150, 230, 255, 1] }, { timeFraction: 1, minColor: [0, 100, 255, 0], maxColor: [50, 150, 255, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.8, factor2: 0.8 }] })
				api.playParticleEffect({ pos1: [x - 2.5, y - 1, z - 2.5], pos2: [x + 2.5, y + 2, z + 2.5], dir1: [dx * 15 - 3, dy * 15 - 3, dz * 15 - 3], dir2: [dx * 25 + 3, dy * 25 + 3, dz * 25 + 3], texture: `square_particle`, manualEmitCount: 100, minEmitPower: 1, maxEmitPower: 1.5, minLifeTime: 0.4, maxLifeTime: 0.8, minSize: 0.5, maxSize: 1.5, gravity: [0, -2, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [200, 245, 255, 1] }, { timeFraction: 1, minColor: [0, 150, 255, 0], maxColor: [100, 200, 255, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.2, factor2: 0.2 }] })
				let dir = [dx, dy, dz]
				let hit = {}
				let power = Math.min(20, s / 250)
				for (let i = 1; i <= 10; i++) {
					let tx = x + dir[0] * i
					let ty = y + dir[1] * i
					let tz = z + dir[2] * i
					for (const e of api.getEntitiesInRect([tx - 4, ty - 4, tz - 4], [tx + 4, ty + 4, tz + 4])) {
						if (e === id || hit[e]) continue
						hit[e] = true
						try {
							api.applyEffect(e, `Frozen`, power * 250, { initiatorId: id })
							api.applyEffect(e, `Slowness`, power * 250 * 2, { initiatorId: id })
						} catch (e) { }
					}
				}
			}
			api.removeMiddleScreenBar(id)
			delete iCharging[id]
			cd[id] = api.now()
		},
		onPlayerSelectInventorySlot: (id, slot) => { if (iCharging[id]) { delete iCharging[id]; api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); api.removeMiddleScreenBar(id); } if (api.getHeldItem(id)?.name === `Draugr Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Draugr Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) } },
		onPlayerSwapInvenSlots: (id, i, j) => { api.setClientOptionToDefault(id, `touchscreenActionButton`); if (fCharging[id]) { delete fCharging[id]; api.removeMiddleScreenBar(id) } api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); const item = api.getItemSlot(id, j), n = item?.name ?? "Dirt"; if (itemData[n] && 0 <= i && 9 >= i) { api.setSelectedInventorySlotI(id, i); changeCall(id, j); api.setClientOption(id, `touchscreenActionButton`, [{ icon: n }]) } },
		onPlayerDropItem: (id, x, y, z, item, amount, slot) => { if (iCharging[id]) { delete iCharging[id]; api.removeMiddleScreenBar(id) } api.setClientOption(id, `runningSpeed`, 7); api.setClientOption(id, `walkingSpeed`, 4); if (api.getSelectedInventorySlotI(id) !== slot && api.getHeldItem(id)?.name === `Draugr Rod`) { api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Draugr Rod` }]) } else { api.setClientOptionToDefault(id, `touchscreenActionButton`) } },
		onTouchscreenActionButton: (id, touchDown) => {
			if (touchDown) {
				if (api.getHeldItem(id)?.name !== `Draugr Rod`) return
				if (!iCharging[id]) {
					iCharging[id] = api.now()
					api.initiateMiddleScreenBar(id, 5000, true, 0)
					api.setClientOption(id, `runningSpeed`, 2)
					api.setClientOption(id, `walkingSpeed`, 2)
				}
			} else {
				if (!iCharging[id]) return

				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				let s = api.now() - iCharging[id]
				if (s >= 2000) {
					let [x, y, z] = api.getPosition(id)
					y += 1.2
					const f = api.getPlayerFacingInfo(id), [dx, dy, dz] = f ? f.dir : [0, 0, 1]
					x += dx * 0.5
					y += dy * 0.5
					z += dz * 0.5
					api.broadcastSound(`metalDoorKnock`, 1, 1, { playerIdOrPos: [x, y, z], maxHearDist: 10 })
					api.playParticleEffect({ pos1: [x - 10.5, y - 10, z - 10.5], pos2: [x + 10.5, y + 10, z + 10.5], dir1: [dx * 40 - 1, dy * 40 - 1, dz * 40 - 1], dir2: [dx * 50 + 1, dy * 50 + 1, dz * 50 + 1], texture: `glint`, manualEmitCount: 80, minEmitPower: 1, maxEmitPower: 1.2, minLifeTime: 0.3, maxLifeTime: 0.5, minSize: 2, maxSize: 5, gravity: [0, 0, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [220, 245, 255, 1] }, { timeFraction: 0.5, minColor: [100, 200, 255, 1], maxColor: [150, 230, 255, 1] }, { timeFraction: 1, minColor: [0, 100, 255, 0], maxColor: [50, 150, 255, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.8, factor2: 0.8 }] })
					api.playParticleEffect({ pos1: [x - 2.5, y - 1, z - 2.5], pos2: [x + 2.5, y + 2, z + 2.5], dir1: [dx * 15 - 3, dy * 15 - 3, dz * 15 - 3], dir2: [dx * 25 + 3, dy * 25 + 3, dz * 25 + 3], texture: `square_particle`, manualEmitCount: 100, minEmitPower: 1, maxEmitPower: 1.5, minLifeTime: 0.4, maxLifeTime: 0.8, minSize: 0.5, maxSize: 1.5, gravity: [0, -2, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [200, 245, 255, 1] }, { timeFraction: 1, minColor: [0, 150, 255, 0], maxColor: [100, 200, 255, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.2, factor2: 0.2 }] })
					let dir = [dx, dy, dz]
					let hit = {}
					let power = Math.min(20, s / 250)
					for (let i = 1; i <= 10; i++) {
						let tx = x + dir[0] * i
						let ty = y + dir[1] * i
						let tz = z + dir[2] * i
						for (const e of api.getEntitiesInRect([tx - 4, ty - 4, tz - 4], [tx + 4, ty + 4, tz + 4])) {
							if (e === id || hit[e]) continue
							hit[e] = true
							try {
								api.applyEffect(e, `Frozen`, power * 250, { initiatorId: id })
								api.applyEffect(e, `Slowness`, power * 250 * 2, { initiatorId: id })
							} catch (e) { }
						}
					}
				}
				api.removeMiddleScreenBar(id)
				delete iCharging[id]
				cd[id] = api.now()
			}
		},
		onPlayerPickedUpItem: (id, name, amount, eId) => {
			if (api.getHeldItem(id)?.name === `Draugr Rod`) {
				api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Draugr Rod` }])
			} else {
				api.setClientOptionToDefault(id, `touchscreenActionButton`)
			}
		},
		onAttemptKillPlayer: (id) => {
			if (fCharging[id]) {
				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				api.removeMiddleScreenBar(id)
				delete fCharging[id]
				cd[id] = api.now()
			}
			if (iCharging[id]) {
				api.setClientOption(id, `runningSpeed`, 7)
				api.setClientOption(id, `walkingSpeed`, 4)
				api.removeMiddleScreenBar(id)
				delete iCharging[id]
				cd[id] = api.now()
			}
			if (fireShootIds[id]) {
				for (const i of fireShootIds[id]) clearTimeout(i)
				delete fireShootIds[id]
			}
			if (iceShootIds[id]) {
				for (const i of iceShootIds[id]) clearTimeout(i)
				delete iceShootIds[id]
			}
		},
		onPlayerLeave: (id) => {
			delete iCharging[id]
			if (iceShootIds[id]) {
				for (const i of iceShootIds[id]) clearTimeout(i)
				delete iceShootIds[id]
			}
		},
		onPlayerJoin: (id) => {
			if (api.getHeldItem(id)?.name === `Draugr Rod`) {
				api.setClientOption(id, `touchscreenActionButton`, [{ icon: `Draugr Rod` }])
			} else {
				api.setClientOptionToDefault(id, `touchscreenActionButton`)
			}
		},
		tick: (id) => {
			if (!iCharging[id]) return
			let s = api.now() - iCharging[id]
			api.shakePlayerCamera(id, s / 100000, 1000 / 20)
			let c = [`white`, `white`, `white`, `white`, `lime`, `yellow`, `orange`, `orange`, `red`, `red`][Math.min(8, Math.floor(s / 500))]
			api.sendFlyingMiddleMessage(id, [{ icon: `fa-solid fa-crosshairs`, style: { color: c, opacity: 0.3 } }, { str: `\n`.repeat(3) }], 0, 100)
			if (s > 5000) {
				if (!api.isAlive(id)) return
				let [x, y, z] = api.getPosition(id)
				y += 1.2
				const f = api.getPlayerFacingInfo(id), [dx, dy, dz] = f ? f.dir : [0, 0, 1]
				x += dx * 0.5
				y += dy * 0.5
				z += dz * 0.5
				api.broadcastSound(`metalDoorKnock`, 1, 1, { playerIdOrPos: [x, y, z], maxHearDist: 10 })
				api.playParticleEffect({ pos1: [x - 10.5, y - 10, z - 10.5], pos2: [x + 10.5, y + 10, z + 10.5], dir1: [dx * 40 - 1, dy * 40 - 1, dz * 40 - 1], dir2: [dx * 50 + 1, dy * 50 + 1, dz * 50 + 1], texture: `glint`, manualEmitCount: 80, minEmitPower: 1, maxEmitPower: 1.2, minLifeTime: 0.3, maxLifeTime: 0.5, minSize: 2, maxSize: 5, gravity: [0, 0, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [220, 245, 255, 1] }, { timeFraction: 0.5, minColor: [100, 200, 255, 1], maxColor: [150, 230, 255, 1] }, { timeFraction: 1, minColor: [0, 100, 255, 0], maxColor: [50, 150, 255, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.8, factor2: 0.8 }] })
				api.playParticleEffect({ pos1: [x - 2.5, y - 1, z - 2.5], pos2: [x + 2.5, y + 2, z + 2.5], dir1: [dx * 15 - 3, dy * 15 - 3, dz * 15 - 3], dir2: [dx * 25 + 3, dy * 25 + 3, dz * 25 + 3], texture: `square_particle`, manualEmitCount: 100, minEmitPower: 1, maxEmitPower: 1.5, minLifeTime: 0.4, maxLifeTime: 0.8, minSize: 0.5, maxSize: 1.5, gravity: [0, -2, 0], blendMode: 1, colorGradients: [{ timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [200, 245, 255, 1] }, { timeFraction: 1, minColor: [0, 150, 255, 0], maxColor: [100, 200, 255, 0] }], velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }, { timeFraction: 1, factor: 0.2, factor2: 0.2 }] })
				let dir = [dx, dy, dz]
				let hit = {}
				let power = Math.min(20, s / 250)
				for (let i = 1; i <= 10; i++) {
					let tx = x + dir[0] * i
					let ty = y + dir[1] * i
					let tz = z + dir[2] * i
					for (const e of api.getEntitiesInRect([tx - 4, ty - 4, tz - 4], [tx + 4, ty + 4, tz + 4])) {
						if (e === id || hit[e]) continue
						hit[e] = true
						try {
							api.applyEffect(e, `Frozen`, power * 250, { initiatorId: id })
							api.applyEffect(e, `Slowness`, power * 250 * 2, { initiatorId: id })
						} catch (e) { }
					}
				}
				api.removeMiddleScreenBar(id)
				delete iCharging[id]
				cd[id] = api.now()
			}
		}
	}]
];
const attribute = [`fire`, `ice`];
const changeCd = {};
const itemData = {
	"Molten Magma Rod": 0,
	"Draugr Rod": 1
};

var changeCall = (id, slot = null) => {
	if (iCharging[id] || fCharging[id]) { //初期化またはリセットっぽい?
		delete iCharging[id];
		delete fCharging[id];
		api.removeMiddleScreenBar(id);
		api.setClientOption(id, `runningSpeed`, 7);
		api.setClientOption(id, `walkingSpeed`, 4);
		api.setClientOption(id, `crosshairText`, ``)
	}
	const item = slot === null ? api.getHeldItem(id) : api.getItemSlot(id, slot); //スロットからアイテムを取ってる
	const index = itemData[item?.name]; //itemdataに含まれてるなら値を入れる
	if (index === undefined) { //なかったら消す
		delete playerDatas[id];
		return
	}
	if (dataIndex[id] === undefined) dataIndex[id] = {}; //dataIndexってなんやころすぞ
	if (dataIndex[id][index] === undefined || dataIndex[id][index] >= datas[index].length) //上に同じ
		dataIndex[id][index] = 0;
	const s = dataIndex[id][index];
	playerDatas[id] = datas[index][s]
}

tick = () => {
	if (++countTick % 2 === 0)
		for (const id in playerDatas) {
			playerDatas[id]?.tick?.(id)
		}
}

onPlayerJoin = (id) => {
	changeCall(id);
	return playerDatas[id]?.onPlayerJoin?.(id)
}

onWorldAttemptSpawnMob = (t, x, y, z) => {
	if (t === "Frost Wraith") return;
	return "preventSpawn"
}

onPlayerAltAction = (id, x, y, z, block, target) => {
	//魔法切り替えっぽい
	if (api.isPlayerCrouching(id)) {
		if (iCharging[id] || fCharging[id]) return;
		const item = api.getHeldItem(id)?.name;
		const index = itemData[item];
		if (index === undefined) return;
		if (changeCd[id]) return;
		changeCd[id] = 1;
		setTimeout(() => delete changeCd[id], 1000);
		let n = (dataIndex[id]?.[index] ?? -1) + 1;
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
	return playerDatas[id]?.onPlayerAltAction?.(id, x, y, z, block, target)
}

onPlayerClick = (id, alt, x, y, z, block, target) => {
	return playerDatas[id]?.onPlayerClick?.(id, alt, x, y, z, target)
}

onPlayerClickUp = (id, alt, x, y, z, block, target) => {
	return playerDatas[id]?.onPlayerClickUp?.(id, alt, x, y, z, block, target)
}

onPlayerSelectInventorySlot = (id, slot) => {
	api.setClientOptionToDefault(id, `touchscreenActionButton`);
	changeCall(id);
	return playerDatas[id]?.onPlayerSelectInventorySlot?.(id, slot)
}

onPlayerLeave = (id) => {
	return playerDatas[id]?.onPlayerLeave?.(id);
	delete playerDatas[id];
	delete dataIndex[id]
}

onAttemptKillPlayer = (id) => {
	return playerDatas[id]?.onAttemptKillPlayer?.(id)
}

onTouchscreenActionButton = (id, touchDown) => {
	if (api.isPlayerCrouching(id) && touchDown) {
		const item = api.getHeldItem(id)?.name;
		const index = itemData[item];
		if (index === undefined) return;
		if (changeCd[id]) return;
		changeCd[id] = 1;
		setTimeout(() => delete changeCd[id], 1000);
		let n = (dataIndex[id]?.[index] ?? -1) + 1;
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
	return playerDatas[id]?.onTouchscreenActionButton?.(id, touchDown)
}

onPlayerPickedUpItem = (id, name, amount, eId) => {
	changeCall(id);
	return playerDatas[id]?.onPlayerPickedUpItem?.(id, name, amount, eId)
}

onPlayerSwapInvenSlots = (id, i, j) => {
	api.setClientOptionToDefault(id, `touchscreenActionButton`);
	return playerDatas[id]?.onPlayerSwapInvenSlots?.(id, i, j)
}

onPlayerDropItem = (id, x, y, z, name, amount, slot) => {
	return playerDatas[id]?.onPlayerDropItem?.(id, x, y, z, name, amount,
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
