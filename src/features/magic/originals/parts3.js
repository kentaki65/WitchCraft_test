datas[0][1]={
onPlayerAltAction:(id,x,y,z,block,target)=>{
if(api.getHeldItem(id)?.name!==`Molten Magma Rod`)return
if(!fCharging[id]){fCharging[id]=api.now();api.initiateMiddleScreenBar(id,5000,true,0);api.setClientOption(id,`runningSpeed`,2);api.setClientOption(id,`walkingSpeed`,2)}
},
onPlayerClick:(id,alt,x,y,z,block,target)=>{
if(fCharging[id])return
if(api.getHeldItem(id)?.name!==`Molten Magma Rod`)return
if(!fCharging[id]){fCharging[id]=api.now();api.initiateMiddleScreenBar(id,5000,true,0);api.setClientOption(id,`runningSpeed`,2);api.setClientOption(id,`walkingSpeed`,2)}
},
onPlayerClickUp:(id,alt,x,y,z,block,target)=>{
if(!fCharging[id])return

api.setClientOption(id,`runningSpeed`,7)
api.setClientOption(id,`walkingSpeed`,4)
let s=api.now()-fCharging[id]
if(s>=2000){
let[x,y,z]=api.getPosition(id)
y+=1.2
const f=api.getPlayerFacingInfo(id),[dx,dy,dz]=f?f.dir:[0,0,1]
x+=dx*0.5
y+=dy*0.5
z+=dz*0.5
api.broadcastSound(`cannonFire3`,1,1,{playerIdOrPos:[x,y,z],maxHearDist:10})
api.playParticleEffect({pos1:[x-0.2,y-0.2,z-0.2],pos2:[x+0.2,y+0.2,z+0.2],dir1:[dx*18-1,dy*18-1,dz*18-1],dir2:[dx*24+1,dy*24+1,dz*24+1],texture:`generic_2`,manualEmitCount:40,minEmitPower:0,maxEmitPower:1.5,minLifeTime:0.5,maxLifeTime:0.9,minSize:1.5,maxSize:3.5,gravity:[0,1,0],blendMode:1,colorGradients:[{timeFraction:0,minColor:[255,255,255,1],maxColor:[255,220,100,1]},{timeFraction:0.2,minColor:[255,120,0,1],maxColor:[255,150,0,1]},{timeFraction:0.6,minColor:[255,40,0,0.8],maxColor:[255,0,0,1]},{timeFraction:1,minColor:[150,0,0,0],maxColor:[100,0,0,0]}],velocityGradients:[{timeFraction:0,factor:1,factor2:1},{timeFraction:1,factor:0.6,factor2:0.6}]})
api.playParticleEffect({pos1:[x-0.3,y-0.3,z-0.3],pos2:[x+0.3,y+0.3,z+0.3],dir1:[dx*12-3,dy*12-3,dz*12-3],dir2:[dx*20+3,dy*20+3,dz*20+3],texture:`square_particle`,manualEmitCount:45,minEmitPower:0,maxEmitPower:2,minLifeTime:0.4,maxLifeTime:0.8,minSize:0.3,maxSize:0.9,gravity:[0,2,0],blendMode:1,colorGradients:[{timeFraction:0,minColor:[255,255,100,1],maxColor:[255,200,50,1]},{timeFraction:1,minColor:[255,0,0,0],maxColor:[200,0,0,0]}],velocityGradients:[{timeFraction:0,factor:1,factor2:1},{timeFraction:1,factor:0.7,factor2:0.7}]})
let dir=[dx,dy,dz]
let hit={}
let power=Math.min(20,s/250)
for(let i=1;i<=10;i++){
let tx=x+dir[0]*i
let ty=y+dir[1]*i
let tz=z+dir[2]*i
for(const e of api.getEntitiesInRect([tx-2,ty-2,tz-2],[tx+2,ty+2,tz+2])){
if(e===id||hit[e])continue
hit[e]=true
api.applyImpulse(e,...dir.map(v=>v*power*2))
}
api.applyImpulse(id,...dir.map(v=>v*power*0.3))
}
}
api.removeMiddleScreenBar(id)
delete fCharging[id]
cd[id]=api.now()
},
onPlayerSelectInventorySlot:(id,slot)=>{
if(fCharging[id]){delete fCharging[id];api.setClientOption(id,`runningSpeed`,7);api.setClientOption(id,`walkingSpeed`,4);api.removeMiddleScreenBar(id)}
if(api.getHeldItem(id)?.name===`Molten Magma Rod`){api.setClientOption(id,`touchscreenActionButton`,[{icon:`Molten Magma Rod`}])}else{api.setClientOptionToDefault(id,`touchscreenActionButton`)}},
onPlayerSwapInvenSlots:(id,i,j)=>{api.setClientOptionToDefault(id,`touchscreenActionButton`);if(fCharging[id]){delete fCharging[id];api.removeMiddleScreenBar(id)}api.setClientOption(id,`runningSpeed`,7);api.setClientOption(id,`walkingSpeed`,4);const item=api.getItemSlot(id,j),n=item?.name??"Dirt";if(itemData[n]&&0<=i&&9>=i){api.setSelectedInventorySlotI(id,i);changeCall(id,j);api.setClientOption(id,`touchscreenActionButton`,[{icon:n}])}},
onPlayerDropItem:(id,x,y,z,item,amount,slot)=>{if(fCharging[id]){delete fCharging[id];api.removeMiddleScreenBar(id)}api.setClientOption(id,`runningSpeed`,7);api.setClientOption(id,`walkingSpeed`,4);if(api.getSelectedInventorySlotI(id)!==slot&&api.getHeldItem(id)?.name===`Molten Magma Rod`){api.setClientOption(id,`touchscreenActionButton`,[{icon:`Molten Magma Rod`}])}else{api.setClientOptionToDefault(id,`touchscreenActionButton`)}},
onTouchscreenActionButton:(id,touchDown)=>{
if(touchDown){
if(api.getHeldItem(id)?.name!==`Molten Magma Rod`)return
if(!fCharging[id]){fCharging[id]=api.now();api.initiateMiddleScreenBar(id,5000,true,0);api.setClientOption(id,`runningSpeed`,2);api.setClientOption(id,`walkingSpeed`,2)}
}else{
if(!fCharging[id])return

api.setClientOption(id,`runningSpeed`,7)
api.setClientOption(id,`walkingSpeed`,4)
let s=api.now()-fCharging[id]
if(s>=2000){
let[x,y,z]=api.getPosition(id)
y+=1.2
const f=api.getPlayerFacingInfo(id),[dx,dy,dz]=f?f.dir:[0,0,1]
x+=dx*0.5
y+=dy*0.5
z+=dz*0.5
api.broadcastSound(`cannonFire3`,1,1,{playerIdOrPos:[x,y,z],maxHearDist:10})
api.playParticleEffect({pos1:[x-0.2,y-0.2,z-0.2],pos2:[x+0.2,y+0.2,z+0.2],dir1:[dx*18-1,dy*18-1,dz*18-1],dir2:[dx*24+1,dy*24+1,dz*24+1],texture:`generic_2`,manualEmitCount:40,minEmitPower:0,maxEmitPower:1.5,minLifeTime:0.5,maxLifeTime:0.9,minSize:1.5,maxSize:3.5,gravity:[0,1,0],blendMode:1,colorGradients:[{timeFraction:0,minColor:[255,255,255,1],maxColor:[255,220,100,1]},{timeFraction:0.2,minColor:[255,120,0,1],maxColor:[255,150,0,1]},{timeFraction:0.6,minColor:[255,40,0,0.8],maxColor:[255,0,0,1]},{timeFraction:1,minColor:[150,0,0,0],maxColor:[100,0,0,0]}],velocityGradients:[{timeFraction:0,factor:1,factor2:1},{timeFraction:1,factor:0.6,factor2:0.6}]})
api.playParticleEffect({pos1:[x-0.3,y-0.3,z-0.3],pos2:[x+0.3,y+0.3,z+0.3],dir1:[dx*12-3,dy*12-3,dz*12-3],dir2:[dx*20+3,dy*20+3,dz*20+3],texture:`square_particle`,manualEmitCount:45,minEmitPower:0,maxEmitPower:2,minLifeTime:0.4,maxLifeTime:0.8,minSize:0.3,maxSize:0.9,gravity:[0,2,0],blendMode:1,colorGradients:[{timeFraction:0,minColor:[255,255,100,1],maxColor:[255,200,50,1]},{timeFraction:1,minColor:[255,0,0,0],maxColor:[200,0,0,0]}],velocityGradients:[{timeFraction:0,factor:1,factor2:1},{timeFraction:1,factor:0.7,factor2:0.7}]})
let dir=[dx,dy,dz]
let hit={}
let power=Math.min(20,s/250)
for(let i=1;i<=10;i++){
let tx=x+dir[0]*i
let ty=y+dir[1]*i
let tz=z+dir[2]*i
for(const e of api.getEntitiesInRect([tx-2,ty-2,tz-2],[tx+2,ty+2,tz+2])){
if(e===id||hit[e])continue
hit[e]=true
api.applyImpulse(e,...dir.map(v=>v*power*2))
}
api.applyImpulse(id,...dir.map(v=>v*power*0.3))
}
}
api.removeMiddleScreenBar(id)
delete fCharging[id]
cd[id]=api.now()
}
},
onPlayerPickedUpItem:(id,name,amount,eId)=>{
if(api.getHeldItem(id)?.name===`Molten Magma Rod`){api.setClientOption(id,`touchscreenActionButton`,[{icon:`Molten Magma Rod`}])}else{api.setClientOptionToDefault(id,`touchscreenActionButton`)}
},
onAttemptKillPlayer:(id)=>{
if(fCharging[id]){
api.setClientOption(id,`runningSpeed`,7)
api.setClientOption(id,`walkingSpeed`,4)
api.removeMiddleScreenBar(id)
delete fCharging[id]
cd[id]=api.now()
}
if(iCharging[id]){
api.setClientOption(id,`runningSpeed`,7)
api.setClientOption(id,`walkingSpeed`,4)
api.removeMiddleScreenBar(id)
delete iCharging[id]
cd[id]=api.now()
}
if(fireShootIds[id]){
for(const i of fireShootIds[id])clearTimeout(i)
delete fireShootIds[id]
}
if(iceShootIds[id]){
for(const i of iceShootIds[id])clearTimeout(i)
delete iceShootIds[id]
}
},
onPlayerLeave:(id)=>{
delete fCharging[id]
if(fireShootIds[id]){
for(const i of fireShootIds[id])clearTimeout(i)
delete fireShootIds[id]
}
},
onPlayerJoin:(id)=>{
if(api.getHeldItem(id)?.name===`Molten Magma Rod`){api.setClientOption(id,`touchscreenActionButton`,[{icon:`Molten Magma Rod`}])}else{api.setClientOptionToDefault(id,`touchscreenActionButton`)}
},
tick:(id)=>{
if(!fCharging[id])return
let s=api.now()-fCharging[id]
api.shakePlayerCamera(id,s/100000,1000/20)
let c=[`white`,`white`,`white`,`white`,`lime`,`lime`,`yellow`,`orange`,`red`,`red`][Math.min(8,Math.floor(s/500))]
api.sendFlyingMiddleMessage(id,[{icon:`fa-solid fa-crosshairs`,style:{color:c,opacity:0.3}},{str:`\n`.repeat(3)}],0,100)
if(s>5000){
if(!api.isAlive(id))return
let[x,y,z]=api.getPosition(id)
y+=1.2
const f=api.getPlayerFacingInfo(id),[dx,dy,dz]=f?f.dir:[0,0,1]
x+=dx*0.5
y+=dy*0.5
z+=dz*0.5
api.broadcastSound(`cannonFire3`,1,1,{playerIdOrPos:[x,y,z],maxHearDist:10})
api.playParticleEffect({pos1:[x-0.2,y-0.2,z-0.2],pos2:[x+0.2,y+0.2,z+0.2],dir1:[dx*18-1,dy*18-1,dz*18-1],dir2:[dx*24+1,dy*24+1,dz*24+1],texture:`generic_2`,manualEmitCount:40,minEmitPower:0,maxEmitPower:1.5,minLifeTime:0.5,maxLifeTime:0.9,minSize:1.5,maxSize:3.5,gravity:[0,1,0],blendMode:1,colorGradients:[{timeFraction:0,minColor:[255,255,255,1],maxColor:[255,220,100,1]},{timeFraction:0.2,minColor:[255,120,0,1],maxColor:[255,150,0,1]},{timeFraction:0.6,minColor:[255,40,0,0.8],maxColor:[255,0,0,1]},{timeFraction:1,minColor:[150,0,0,0],maxColor:[100,0,0,0]}],velocityGradients:[{timeFraction:0,factor:1,factor2:1},{timeFraction:1,factor:0.6,factor2:0.6}]})
api.playParticleEffect({pos1:[x-0.3,y-0.3,z-0.3],pos2:[x+0.3,y+0.3,z+0.3],dir1:[dx*12-3,dy*12-3,dz*12-3],dir2:[dx*20+3,dy*20+3,dz*20+3],texture:`square_particle`,manualEmitCount:45,minEmitPower:0,maxEmitPower:2,minLifeTime:0.4,maxLifeTime:0.8,minSize:0.3,maxSize:0.9,gravity:[0,2,0],blendMode:1,colorGradients:[{timeFraction:0,minColor:[255,255,100,1],maxColor:[255,200,50,1]},{timeFraction:1,minColor:[255,0,0,0],maxColor:[200,0,0,0]}],velocityGradients:[{timeFraction:0,factor:1,factor2:1},{timeFraction:1,factor:0.7,factor2:0.7}]})
let dir=[dx,dy,dz]
let hit={}
let power=Math.min(20,s/250)
for(let i=1;i<=10;i++){
let tx=x+dir[0]*i
let ty=y+dir[1]*i
let tz=z+dir[2]*i
for(const e of api.getEntitiesInRect([tx-2,ty-2,tz-2],[tx+2,ty+2,tz+2])){
if(e===id||hit[e])continue
hit[e]=true
api.applyImpulse(e,...dir.map(v=>v*power*2))
}
api.applyImpulse(id,...dir.map(v=>v*power*0.3))
fCharging[id]=api.now()
api.initiateMiddleScreenBar(id,5000,true,0)
api.setClientOption(id,`runningSpeed`,2)
api.setClientOption(id,`walkingSpeed`,2)
}
}
}
}