datas[1][1] = {
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
}