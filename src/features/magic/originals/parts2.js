datas[1][0]={
onPlayerAltAction:(id,x,y,z,block,target)=>{
if(api.getHeldItem(id)?.name!==`Draugr Rod`)return
if(!iCharging[id]){iCharging[id]=api.now();api.initiateMiddleScreenBar(id,5000,true,0);api.setClientOption(id,`runningSpeed`,2);api.setClientOption(id,`walkingSpeed`,2)}
},
onPlayerClick:(id,alt,x,y,z,block,target)=>{
if(iCharging[id])return
if(api.getHeldItem(id)?.name!==`Draugr Rod`)return
if(!iCharging[id]){iCharging[id]=api.now();api.initiateMiddleScreenBar(id,5000,true,0);api.setClientOption(id,`runningSpeed`,2);api.setClientOption(id,`walkingSpeed`,2)}
},
onPlayerClickUp:(id,alt,x,y,z,block,target)=>{
if(!iCharging[id])return

api.setClientOption(id,`runningSpeed`,7)
api.setClientOption(id,`walkingSpeed`,4)
let s=api.now()-iCharging[id]
if(s>=500){
let[x,y,z]=api.getPosition(id)
y+=1.5
const f=api.getPlayerFacingInfo(id),[dx,dy,dz]=f?f.dir:[0,0,1]
api.playParticleEffect({pos1:[x+dx-0.2,y+dy-0.2,z+dz-0.2],pos2:[x+dx+0.2,y+dy+0.2,z+dz+0.2],dir1:[dx*10,dy*10,dz*10],dir2:[dx*12,dy*12,dz*12],texture:`glint`,manualEmitCount:Math.min(20,3+Math.floor(s/500)*2),minEmitPower:1,maxEmitPower:2,minLifeTime:s*0.0003,maxLifeTime:s*0.0003,minSize:0.4,maxSize:0.5,gravity:[0,0,0],blendMode:1,colorGradients:[{timeFraction:0,minColor:[100,100,255,1],maxColor:[100,100,255,1]},{timeFraction:1,minColor:[255,255,255,0],maxColor:[255,255,255,0]}],velocityGradients:[{timeFraction:0,factor:1,factor2:1},{timeFraction:1,factor:1,factor2:1}]})
let points=Math.min(20,Math.floor(s/250))
let damage=Math.min(200,10+Math.floor(s/1000)*10)
iceShootIds[id]=[]
for(let d=1;d<=points;d++){
iceShootIds[id].push(setTimeout(()=>{let px=x+dx*d;let py=y+dy*d;let pz=z+dz*d;api.broadcastSound(`croneHurt1`,1,1,{playerIdOrPos:[px,py,pz],maxHearDist:10});for(const i of api.getEntitiesInRect([px-1.5,py-2,pz-1.5],[px+1.5,py+2,pz+1.5])){if(i===id)continue;try{api.applyEffect(i,`Frozen`,s,{displayName:`Iced`,initiatorId:id})}catch(e){}api.attemptApplyDamage({eId:id,hitEId:i,attemptedDmgAmt:Math.max(1,damage-d),withItem:`Iceball`})}},d*100))
}
}
api.removeMiddleScreenBar(id)
delete iCharging[id]
cd[id]=api.now()
},
onPlayerSelectInventorySlot:(id,slot)=>{
if(iCharging[id]){delete iCharging[id];api.setClientOption(id,`runningSpeed`,7);api.setClientOption(id,`walkingSpeed`,4);api.removeMiddleScreenBar(id)}
if(api.getHeldItem(id)?.name===`Draugr Rod`){api.setClientOption(id,`touchscreenActionButton`,[{icon:`Draugr Rod`}])}else{api.setClientOptionToDefault(id,`touchscreenActionButton`)}},
onPlayerSwapInvenSlots:(id,i,j)=>{api.setClientOptionToDefault(id,`touchscreenActionButton`);if(fCharging[id]){delete fCharging[id];api.removeMiddleScreenBar(id)}api.setClientOption(id,`runningSpeed`,7);api.setClientOption(id,`walkingSpeed`,4);const item=api.getItemSlot(id,j),n=item?.name??"Dirt";if(itemData[n]&&0<=i&&9>=i){api.setSelectedInventorySlotI(id,i);changeCall(id,j);api.setClientOption(id,`touchscreenActionButton`,[{icon:n}])}},
onPlayerDropItem:(id,x,y,z,item,amount,slot)=>{if(iCharging[id]){delete iCharging[id];api.removeMiddleScreenBar(id)}api.setClientOption(id,`runningSpeed`,7);api.setClientOption(id,`walkingSpeed`,4);if(api.getSelectedInventorySlotI(id)!==slot&&api.getHeldItem(id)?.name===`Draugr Rod`){api.setClientOption(id,`touchscreenActionButton`,[{icon:`Draugr Rod`}])}else{api.setClientOptionToDefault(id,`touchscreenActionButton`)}},
onTouchscreenActionButton:(id,touchDown)=>{
if(touchDown){
if(api.getHeldItem(id)?.name!==`Draugr Rod`)return
if(!iCharging[id]){iCharging[id]=api.now();api.initiateMiddleScreenBar(id,5000,true,0);api.setClientOption(id,`runningSpeed`,2);api.setClientOption(id,`walkingSpeed`,2)}
}else{
if(!iCharging[id])return

api.setClientOption(id,`runningSpeed`,7)
api.setClientOption(id,`walkingSpeed`,4)
let s=api.now()-iCharging[id]
if(s>=500){
let[x,y,z]=api.getPosition(id)
y+=1.5
const f=api.getPlayerFacingInfo(id),[dx,dy,dz]=f?f.dir:[0,0,1]
api.playParticleEffect({pos1:[x+dx-0.2,y+dy-0.2,z+dz-0.2],pos2:[x+dx+0.2,y+dy+0.2,z+dz+0.2],dir1:[dx*10,dy*10,dz*10],dir2:[dx*12,dy*12,dz*12],texture:`glint`,manualEmitCount:Math.min(20,3+Math.floor(s/500)*2),minEmitPower:1,maxEmitPower:2,minLifeTime:s*0.0003,maxLifeTime:s*0.0003,minSize:0.4,maxSize:0.5,gravity:[0,0,0],blendMode:1,colorGradients:[{timeFraction:0,minColor:[100,100,255,1],maxColor:[100,100,255,1]},{timeFraction:1,minColor:[255,255,255,0],maxColor:[255,255,255,0]}],velocityGradients:[{timeFraction:0,factor:1,factor2:1},{timeFraction:1,factor:1,factor2:1}]})
let points=Math.min(20,Math.floor(s/250))
let damage=Math.min(200,10+Math.floor(s/1000)*10)
iceShootIds[id]=[]
for(let d=1;d<=points;d++){
iceShootIds[id].push(setTimeout(()=>{let px=x+dx*d;let py=y+dy*d;let pz=z+dz*d;api.broadcastSound(`croneHurt1`,1,1,{playerIdOrPos:[px,py,pz],maxHearDist:10});for(const i of api.getEntitiesInRect([px-1.5,py-2,pz-1.5],[px+1.5,py+2,pz+1.5])){if(i===id)continue;try{api.applyEffect(i,`Frozen`,s,{displayName:`Iced`,initiatorId:id})}catch(e){};api.attemptApplyDamage({eId:id,hitEId:i,attemptedDmgAmt:Math.max(1,damage-d),withItem:`Iceball`})}},d*100))
}
}
api.removeMiddleScreenBar(id)
delete iCharging[id]
cd[id]=api.now()
}
},
tick:(id)=>{
if(!iCharging[id])return
let s=api.now()-iCharging[id]
api.shakePlayerCamera(id,s/100000,1000/20)
let c=[`white`,`lime`,`lime`,`lime`,`yellow`,`yellow`,`orange`,`orange`,`red`,`red`][Math.min(8,Math.floor(s/500))]
api.sendFlyingMiddleMessage(id,[{icon:`fa-solid fa-crosshairs`,style:{color:c,opacity:0.3}},{str:`\n`.repeat(3)}],0,100)
if(s>5000){
let[x,y,z]=api.getPosition(id)
y+=1.5
const f=api.getPlayerFacingInfo(id),[dx,dy,dz]=f?f.dir:[0,0,1]
api.playParticleEffect({pos1:[x+dx-0.2,y+dy-0.2,z+dz-0.2],pos2:[x+dx+0.2,y+dy+0.2,z+dz+0.2],dir1:[dx*10,dy*10,dz*10],dir2:[dx*12,dy*12,dz*12],texture:`glint`,manualEmitCount:Math.min(20,3+Math.floor(s/500)*2),minEmitPower:1,maxEmitPower:2,minLifeTime:s*0.0003,maxLifeTime:s*0.0003,minSize:0.4,maxSize:0.5,gravity:[0,0,0],blendMode:1,colorGradients:[{timeFraction:0,minColor:[100,100,255,1],maxColor:[100,100,255,1]},{timeFraction:1,minColor:[255,255,255,0],maxColor:[255,255,255,0]}],velocityGradients:[{timeFraction:0,factor:1,factor2:1},{timeFraction:1,factor:1,factor2:1}]})
if(!api.isAlive(id))return
let points=Math.min(20,Math.floor(s/250))
let damage=Math.min(200,10+Math.floor(s/1000)*10)
iceShootIds[id]=[]
for(let d=1;d<=points;d++){
iceShootIds[id].push(setTimeout(()=>{let px=x+dx*d;let py=y+dy*d;let pz=z+dz*d;api.broadcastSound(`croneHurt1`,1,1,{playerIdOrPos:[px,py,pz],maxHearDist:10});for(const i of api.getEntitiesInRect([px-1.5,py-2,pz-1.5],[px+1.5,py+2,pz+1.5])){if(i===id)continue;try{api.applyEffect(i,`Frozen`,s,{displayName:`Iced`,initiatorId:id})}catch(e){};api.attemptApplyDamage({eId:id,hitEId:i,attemptedDmgAmt:Math.max(1,damage-d),withItem:`Iceball`})}},d*100))
}
iCharging[id]=api.now()
api.initiateMiddleScreenBar(id,5000,true,0)
api.setClientOption(id,`runningSpeed`,2)
api.setClientOption(id,`walkingSpeed`,2)
}
},
onPlayerPickedUpItem:(id,name,amount,eId)=>{
if(api.getHeldItem(id)?.name===`Draugr Rod`){api.setClientOption(id,`touchscreenActionButton`,[{icon:`Draugr Rod`}])}else{api.setClientOptionToDefault(id,`touchscreenActionButton`)}
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
delete iCharging[id]
if(iceShootIds[id]){
for(const i of iceShootIds[id])clearTimeout(i)
delete iceShootIds[id]
}
},
onPlayerJoin:(id)=>{
if(api.getHeldItem(id)?.name===`Draugr Rod`){api.setClientOption(id,`touchscreenActionButton`,[{icon:`Draugr Rod`}])}else{api.setClientOptionToDefault(id,`touchscreenActionButton`)}
}
}