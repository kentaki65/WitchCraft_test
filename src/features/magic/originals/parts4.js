datas[0][0]={
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
if(!fCharging[id])return;
api.setClientOption(id,`runningSpeed`,7)
api.setClientOption(id,`walkingSpeed`,4)
let s=api.now()-fCharging[id]
if(s>=500){
let[x,y,z]=api.getPosition(id)
let[dx,dy,dz]=api.getPlayerFacingInfo(id)?.dir||[0,0,1]
let points=Math.min(20,Math.floor(s/250))
let damage=Math.min(100,10+Math.floor(s/1000)*10/2)
fireShootIds[id]=[]
for(let d=4;d<=points;d+=2){
fireShootIds[id].push(setTimeout(()=>{let px=x+dx*d;let py=y+dy*d;let pz=z+dz*d;api.broadcastSound(`firecracker1`,1,1,{playerIdOrPos:[px,py,pz],maxHearDist:10});api.playParticleEffect({pos1:[px-2,py-2,pz-2],pos2:[px+2,py+2,pz+2],presetId:`redFirecrackerLarge`});for(const i of api.getEntitiesInRect([px-4,py-4,pz-4],[px+4,py+4,pz+4])){if(i===id)continue;api.attemptApplyDamage({eId:id,hitEId:i,attemptedDmgAmt:Math.max(1,damage-d),withItem:`Fireball Block`})}},d*100))
}
}
api.removeMiddleScreenBar(id)
delete fCharging[id]
cd[id]=api.now()
},
onPlayerSelectInventorySlot:(id,slot)=>{if(fCharging[id]){delete fCharging[id];api.removeMiddleScreenBar(id)}api.setClientOption(id,`runningSpeed`,7);api.setClientOption(id,`walkingSpeed`,4);if(api.getHeldItem(id)?.name===`Molten Magma Rod`){api.setClientOption(id,`touchscreenActionButton`,[{icon:`Molten Magma Rod`}])}else{api.setClientOptionToDefault(id,`touchscreenActionButton`)}},
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
if(s>=500){
let[x,y,z]=api.getPosition(id)
let[dx,dy,dz]=api.getPlayerFacingInfo(id)?.dir||[0,0,1]
let points=Math.min(20,Math.floor(s/250))
let damage=Math.min(100,10+Math.floor(s/1000)*10/2)
fireShootIds[id]=[]
for(let d=4;d<=points;d+=2){
fireShootIds[id].push(setTimeout(()=>{let px=x+dx*d;let py=y+dy*d;let pz=z+dz*d;api.broadcastSound(`firecracker1`,1,1,{playerIdOrPos:[px,py,pz],maxHearDist:10});api.playParticleEffect({pos1:[px-2,py-2,pz-2],pos2:[px+2,py+2,pz+2],presetId:`redFirecrackerLarge`});for(const i of api.getEntitiesInRect([px-4,py-4,pz-4],[px+4,py+4,pz+4])){if(i===id)continue;api.attemptApplyDamage({eId:id,hitEId:i,attemptedDmgAmt:Math.max(1,damage-d),withItem:`Fireball Block`})}},d*100))
}
}
api.removeMiddleScreenBar(id)
delete fCharging[id]
cd[id]=api.now()
}
},
tick:(id)=>{
if(!fCharging[id])return
let s=api.now()-fCharging[id]
api.shakePlayerCamera(id,s/100000,1000/20)
let c=[`white`,`white`,`lime`,`lime`,`yellow`,`yellow`,`orange`,`orange`,`red`,`red`][Math.min(8,Math.floor(s/500))]
api.sendFlyingMiddleMessage(id,[{icon:`fa-solid fa-crosshairs`,style:{color:c,opacity:0.3}},{str:`\n`.repeat(3)}],0,100)
if(s>5000){
if(!api.isAlive(id))return
let[x,y,z]=api.getPosition(id)
let[dx,dy,dz]=api.getPlayerFacingInfo(id)?.dir||[0,0,1]
let points=Math.min(20,Math.floor(s/250))
let damage=Math.min(100,10+Math.floor(s/1000)*10/2)
fireShootIds[id]=[]
for(let d=4;d<=points;d+=2){
fireShootIds[id].push(setTimeout(()=>{let px=x+dx*d;let py=y+dy*d;let pz=z+dz*d;api.broadcastSound(`firecracker1`,1,1,{playerIdOrPos:[px,py,pz],maxHearDist:10});api.playParticleEffect({pos1:[px-2,py-2,pz-2],pos2:[px+2,py+2,pz+2],presetId:`redFirecrackerLarge`});for(const i of api.getEntitiesInRect([px-4,py-4,pz-4],[px+4,py+4,pz+4])){if(i===id)continue;api.attemptApplyDamage({eId:id,hitEId:i,attemptedDmgAmt:Math.max(1,damage-d),withItem:`Fireball Block`})}},d*100))
}
fCharging[id]=api.now()
api.initiateMiddleScreenBar(id,5000,true,0)
api.setClientOption(id,`runningSpeed`,2)
api.setClientOption(id,`walkingSpeed`,2)
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
}
}