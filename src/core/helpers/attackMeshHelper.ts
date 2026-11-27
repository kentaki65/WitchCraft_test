// import {MeshEntityOpts} from "@bloxd"
import {type MeshEntityOpts, type MeshEntityType, type MeshEntityPhysicsOpts, type EntityId, type Pos} from "../../../node_modules/@bloxd/index"

const degToRad = (deg: number) => deg * (Math.PI / 180);

type OtherMeshOpts = {
    meshType: MeshEntityType,
    pos: Pos,
    rotation?: [number,number,number], //use Deg
    name?: string,
    physicsOptions?: MeshEntityPhysicsOpts, 
    initiatorId?: EntityId,
    
};

export function addAttackMesh ({
    meshes,
}: {
    meshes: (MeshEntityOpts[MeshEntityType] & OtherMeshOpts)[],
}) {
    const generatedMeshes = meshes.map(mesh=>{
        const {meshType,pos,rotation,name,physicsOptions,initiatorId,...opts} = mesh;
        const meshId = api.attemptCreateMeshEntity(meshType,opts,name,physicsOptions,initiatorId);
        api.setPosition(meshId,pos);
        if(rotation) api.setEntityRotation(meshId,rotation.flatMap(deg=>degToRad(deg)));
        return meshId;
    });

    
}


