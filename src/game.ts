//# Third-party :
import { Engine, Scene, SceneLoader } from "@babylonjs/core";
import { ArcRotateCamera, FreeCamera, Vector3 } from "@babylonjs/core";
import { Animation, ActionManager, ExecuteCodeAction } from "@babylonjs/core";
import type { AbstractMesh } from "@babylonjs/core";
import '@babylonjs/loaders';

//# Local :
import { Player } from "./player.ts";
import { Game_SceneBuilder } from "./Game/scene_builder.ts";
import { Game_PlayerInitialiser } from "./Game/player_initialiser.ts";


type GameCameras = {[keys: string]: FreeCamera|ArcRotateCamera};
type MapMeshes = {[keys: string]: AbstractMesh[]};
type Kind = "Decors"|"Obstacles"|"SlipperyObjects"|"GrippableObjects"|"End";



////////////////////////////////////////////////////////////////////////////////
// Game :
////////////////////////////////////////////////////////////////////////////////

export class Game {
    private static _Inst : Game;

    private _canvas : HTMLCanvasElement;
    private _engine : Engine;
    private _scene  : Scene;
    private _player : Player;

    private _cameras   : GameCameras;
    private _mapMeshes : MapMeshes;


    private constructor() {
        this._canvas = document.getElementById('renderCanvas')! as HTMLCanvasElement;
        this._engine = new Engine(this._canvas, true);
        this._scene  = new Scene(this._engine);

        this._player = new Player(this._scene);
        this._cameras = {};
        this._mapMeshes = {};

        // this.initCameras(); // Test
    }


    ////////////////////////////////////////////////////////////////////////////
    // Getters :

    private static get Inst(): Game {
        if (!Game._Inst)
          Game._Inst = new Game();
        return Game._Inst;
    }

    // I made the following getters static bcs typing 'Game.Inst.<attribute>'
    // each time you need to access an attribute of the game is annoying.
    // Instead, typing 'Game.<attribute>' seem better.
    public static get canvas()   : HTMLCanvasElement {return Game.Inst._canvas;}
    public static get engine()   : Engine {return Game.Inst._engine;}
    public static get scene()    : Scene  {return Game.Inst._scene;}
    public static get player()   : Player {return Game.Inst._player;}
    public static get cameras()  : GameCameras {return Game.Inst._cameras;}
    public static get mapMeshes(): MapMeshes   {return Game.Inst._mapMeshes;}


    ////////////////////////////////////////////////////////////////////////////
    // Initialisation :

    private initCameras() {
        /*********************************************/
        /* Cinematic Camera :                        */
        /*********************************************/

        const cinematic_cam = new FreeCamera(
            "CinematicCamera", new Vector3(-100, 220, -80), this._scene
        );
        cinematic_cam.minZ = 0.5;
        cinematic_cam.speed = 0.5;
        cinematic_cam.rotation._y = Math.PI;

        this._cameras["CinematicCamera"] = cinematic_cam;

        /*********************************************/
        /* Player Camera :                           */
        /*********************************************/

        // Constants to fix camera position
        const arcAlpha = 1.5046653238154635;
        const arcBeta = 1.5296884191499718;
        const arcRadius = 44.649908575154164;

        const player_cam = new ArcRotateCamera(
            "PlayerCamera", arcAlpha, arcBeta, arcRadius, new Vector3(0, 0, 0), this._scene
        );
        //player_cam.attachControl();
        player_cam.minZ = 0.5;
        player_cam.speed = 0.1;
        player_cam.wheelPrecision = 10;

        this._cameras["PlayerCamera"] = player_cam;
    }

    private async initMap() {
        this._mapMeshes["Decors"] = (await SceneLoader.ImportMeshAsync(
            "", "../../assets/models/Map/", "decors.glb"
        )).meshes;

        this._mapMeshes["Obstacles"] = (await SceneLoader.ImportMeshAsync(
            "", "../../assets/models/Map/", "obstacles.glb"
        )).meshes;

        this._mapMeshes["SlipperyObjects"] = (await SceneLoader.ImportMeshAsync(
            "", "../../assets/models/Map/", "slippery-objects.glb"
        )).meshes;

        this._mapMeshes["GrippableObjects"] = (await SceneLoader.ImportMeshAsync(
            "", "../../assets/models/Map/", "grippable-objects.glb"
        )).meshes;

        this._mapMeshes["End"] = (await SceneLoader.ImportMeshAsync(
            "", "../../assets/models/Map/", "end.glb"
        )).meshes;
    }

    private static initPlayerActions() {
        let key_pressed: "ArrowUp"|"ArrowDown"|"ArrowLeft"|"ArrowRight"|null = null;
        let shiftPressed: boolean = false

        Game.scene.actionManager = new ActionManager(Game.scene);
        Game.scene.actionManager.registerAction(new ExecuteCodeAction(
            ActionManager.OnKeyDownTrigger,
            (event) => {
                console.log(event.sourceEvent.key);
                let key = event.sourceEvent.key;
                if (key == "Shift") {
                    shiftPressed = true;
                    return;
                }
                key_pressed = key;
            }
        ));
        Game.scene.actionManager.registerAction(new ExecuteCodeAction(
            ActionManager.OnKeyUpTrigger,
            (event) => {
                let key = event.sourceEvent.key;
                if (key == "Shift") {
                    shiftPressed = false;
                    return;
                }
                key_pressed = null;
            },
        ))

        /*********************************************/
        /* Player Movements Management :             */
        /*********************************************/

        const atPlayer = () => {
            const predicate = (mesh: AbstractMesh) => mesh != Game.player.model.mesh;
            const ray = Game.cameras["PlayerCamera"].getForwardRay(100);
            const hit = Game.scene.pickWithRay(ray, predicate);

            if (!hit || !hit.pickedMesh) return "Decors";

            const pickedMesh = hit.pickedMesh;

            const KINDS: Kind[] = [
                "Decors", "Obstacles", "SlipperyObjects", "GrippableObjects", "End"
            ];

            // DEBUG ::
            console.log(pickedMesh);

            for (let kind of KINDS) {
                if (Game.mapMeshes[kind].includes(pickedMesh))
                    return kind;
            }

            return "Decors";
        }

        const switchMoves = (key: string, shiftPressed: boolean) => {
            switch (key) {
                case "ArrowUp"   : return Game.player.anim.climbUp();
                case "ArrowDown" : return Game.player.anim.climbDown();
                case "ArrowLeft" : return Game.player.anim.moveLeft(shiftPressed);
                case "ArrowRight": return Game.player.anim.moveRight(shiftPressed);
            }
        }

        let isMoving = true;
        let isFalling = false;
        let isSliding = false;

        const player_mesh: AbstractMesh = Game.player.model.mesh;

        const isHoldable = (s:string) => {
            return ["SlipperyObjects","GrippableObjects"].includes(s);
        };

        Game.scene.onBeforeRenderObservable.add(() => {
            if (isFalling) {
                Game.player.anim.hang();
                if (key_pressed == "ArrowUp")
                    isFalling = !isHoldable(atPlayer());
                player_mesh.position.y -= 1;
                return;
            }

            if (isSliding) {
                Game.player.anim.hang();

                if (key_pressed && !["ArrowUp", "ArrowDown"].includes(key_pressed)) {
                    switchMoves(key_pressed, shiftPressed);
                    isMoving = true;
                }

                const kind = atPlayer();
                if(isHoldable(kind)) {
                    isSliding = false;
                    return;
                }

                if (kind == "Decors") {
                    isFalling = true;
                    isSliding = false;
                    return;
                }

                player_mesh.position.y -= 0.5;
                return;
            }

            if (key_pressed) {
                isMoving = true
                switchMoves(key_pressed, shiftPressed);
                const kind = atPlayer();
                isFalling = kind == "Decors";
                isSliding = kind == "SlipperyObjects";
            } else if (isMoving) {
                isMoving = false
                Game.player.anim.hang();
            }
        });
    }

    public static async buildScene() {
        const scene_builder = new Game_SceneBuilder(Game.scene);
        scene_builder.exec();
        await Game.Inst.initMap();
        Game.Inst.initCameras() // Test
    }

    public static async initPlayer() {
        const player_initialiser = new Game_PlayerInitialiser(
            Game.scene, Game.player
        );
        Game.player.importPlayerModel().then(() => {
            player_initialiser.exec();
            Game.player.setAnim();
            Game.initPlayerActions();
        });
    }


    ////////////////////////////////////////////////////////////////////////////
    // Actions :

    public static async playCutscene() {
        Game.scene.activeCamera = Game.cameras["CinematicCamera"];

        const cam = Game.cameras["CinematicCamera"];
        const fps = 60;
        const camAnim = new Animation(
            "camAnim",
            "position",
            fps,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT,
            true
        );

        camAnim.setKeys([
            { frame: 0, value: new Vector3(-100, 220, -80) },
            { frame: 3 * fps, value: new Vector3(-55, 170, 45) },
            { frame: 3 * fps, value: new Vector3(-75, 170, 30) },
            { frame: 5 * fps, value: new Vector3(-75, 130, 40) },
            { frame: 6 * fps, value: new Vector3(-15, 115, 50) },
            { frame: 6 * fps, value: new Vector3(5, 110, 30) },
            { frame: 7 * fps, value: new Vector3(13, 75, 0) },
            { frame: 8 * fps, value: new Vector3(13, 75, 0) },
            { frame: 8 * fps, value: new Vector3(-7, 100, 30) },
            { frame: 10 * fps, value: new Vector3(-40, 70, 60) },
            { frame: 10 * fps, value: new Vector3(-32, 150, 120) },
            { frame: 11 * fps, value: new Vector3(-32, 150, 120) },
            { frame: 15 * fps, value: new Vector3(-32, 35, 120) },
            { frame: 16 * fps, value: new Vector3(-32, 35, 120) }
        ]);

        cam.animations.push(camAnim);
        await this.scene.beginAnimation(cam, 0, 16 * fps).waitAsync();

        Game.scene.activeCamera = Game.cameras["PlayerCamera"];
    }

    public static play() {
        Game.engine.runRenderLoop(() => Game.scene.render());
    }
}
