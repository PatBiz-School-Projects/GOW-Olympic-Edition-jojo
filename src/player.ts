// KEYBOARD -- VERSION


//# Third-party :
import { SceneLoader } from "@babylonjs/core";
import type { Scene, AbstractMesh, Skeleton } from "@babylonjs/core";


//-----------------------------------------------------------------------------------


type PlayerModel = {
    mesh: AbstractMesh,
    skeleton: Skeleton
};

type PlayerAnim = {
    hang     : ()=>void,
    climbUp  : ()=>void,
    climbDown: ()=>void,
    moveLeft : (shiftPressed: boolean)=>void,
    moveRight: (shiftPressed: boolean)=>void,
}


export class Player {
    public constructor(private scene: Scene){}

    //# ¤¤¤¤¤¤¤¤¤¤¤¤ ATTRIBUTES ¤¤¤¤¤¤¤¤¤¤¤¤ #//
    private _model?: PlayerModel;
    private _anim? : PlayerAnim;

    //# ¤¤¤¤¤¤¤¤¤¤¤¤¤¤ GETTERS ¤¤¤¤¤¤¤¤¤¤¤¤¤ #//
    public get model(): PlayerModel{return this._model!}
    public get anim() : PlayerAnim{return this._anim!}

    //# ¤¤¤¤¤¤¤¤¤¤¤¤¤¤ METHODS ¤¤¤¤¤¤¤¤¤¤¤¤¤ #//
    public async importPlayerModel() {
        const {meshes, skeletons} = await SceneLoader.ImportMeshAsync(
            "", "../assets/models/", "climber.glb", this.scene
        );
        this._model = {mesh: meshes[0], skeleton: skeletons[0]};
    }

    public setAnim() {
        const HANG_ANIM         = this.scene.getAnimationGroupByName("1_hang")!;

        const CLIMB_UP_ANIM     = this.scene.getAnimationGroupByName("4_climbingUp")!;
        const CLIMB_DOWN_ANIM   = this.scene.getAnimationGroupByName("5_climbingDown")!;

        const SHIMMY_RIGHT_ANIM  = this.scene.getAnimationGroupByName("7_shimmyLeft")!;
        const HOP_RIGHT_ANIM     = this.scene.getAnimationGroupByName("9_hopLeft")!;

        const SHIMMY_LEFT_ANIM = this.scene.getAnimationGroupByName("6_shimmyRight")!;
        const HOP_LEFT_ANIM    = this.scene.getAnimationGroupByName("8_hopRight")!;


        const player_mesh = this.model.mesh;


        this._anim = {
            hang: ()=>{
                HANG_ANIM.start(true, 1, HANG_ANIM.from, HANG_ANIM.to, true);
                CLIMB_UP_ANIM.stop();
                CLIMB_DOWN_ANIM.stop();
                SHIMMY_LEFT_ANIM.stop();
                SHIMMY_RIGHT_ANIM.stop();
                HOP_LEFT_ANIM.stop();
                HOP_RIGHT_ANIM.stop();
                CLIMB_DOWN_ANIM.stop();
            },

            climbUp: ()=>{
                CLIMB_UP_ANIM.start(true, 1, CLIMB_UP_ANIM.from, CLIMB_UP_ANIM.to, false);
                player_mesh.moveWithCollisions(player_mesh.up.scaleInPlace(0.2));
            },

            climbDown: ()=>{
                CLIMB_DOWN_ANIM.start(true, 1, CLIMB_DOWN_ANIM.from, CLIMB_DOWN_ANIM.to, false);
                player_mesh.moveWithCollisions(player_mesh.up.scaleInPlace(-0.2));
            },

            moveLeft: (shiftPressed: boolean)=>{
                if (shiftPressed) {
                    HOP_LEFT_ANIM.start(true, 1, HOP_LEFT_ANIM.from, HOP_LEFT_ANIM.to, false);
                    player_mesh.moveWithCollisions(player_mesh.right.scaleInPlace(-0.2));
                    return;
                }
                SHIMMY_LEFT_ANIM.start(true, 1, SHIMMY_LEFT_ANIM.from, SHIMMY_LEFT_ANIM.to, true);
                player_mesh.moveWithCollisions(player_mesh.right.scaleInPlace(-0.1));
            },

            moveRight: (shiftPressed: boolean)=>{
                if (shiftPressed) {
                    HOP_RIGHT_ANIM.start(true, 1, HOP_RIGHT_ANIM.from, HOP_RIGHT_ANIM.to, false);
                    player_mesh.moveWithCollisions(player_mesh.right.scaleInPlace(0.2));
                    return;
                }
                SHIMMY_RIGHT_ANIM.start(false, 1, SHIMMY_RIGHT_ANIM.from, SHIMMY_RIGHT_ANIM.to, true);
                player_mesh.moveWithCollisions(player_mesh.right.scaleInPlace(0.1));
            },
        }
    }
}
