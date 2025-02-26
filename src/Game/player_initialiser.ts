// KEYBOARD - VERSION

//# Third-party :
import type { Scene } from "@babylonjs/core";
import { PhysicsImpostor } from "@babylonjs/core";

//# Local :
import type { Player } from "../player.ts";


//-----------------------------------------------------------------------------------


export class Game_PlayerInitialiser {
    public constructor(
        private scene: Scene,
        private player: Player,
    ){}


    public exec() {
        // The type 'any' is necessary as '.getCameraByName()' return a 'Camera' which doesn't have the '.setTarget()' method
        const cam: any = this.scene.getCameraByName("PlayerCamera")!;
        cam.setTarget(this.player.model.mesh);

        this.player.model.mesh.scaling.setAll(5);
        this.player.model.mesh.position._x = -20;
        this.player.model.mesh.position._z = 1;
        this.player.model.mesh.physicsImpostor = new PhysicsImpostor(
            this.player.model.mesh,
            PhysicsImpostor.MeshImpostor,
            { mass:70, restitution:0 }
        );
    }
  }
