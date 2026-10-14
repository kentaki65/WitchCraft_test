import { PlayerId } from "@bloxd";
import { setTimeout } from "@plugins/helpers"

type AnimateEntitySchema = Parameters<typeof api.animateEntity>[1];

export function asyncAnimate(
  playerId: PlayerId, 
  animationSchema: AnimateEntitySchema
){
  return new globalThis.Promise((resolve) => {
    api.animateEntity(playerId, animationSchema);
    setTimeout(resolve, animationSchema.animationDurationMs)
  })
}