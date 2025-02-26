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

        const switchMoves = (key: string, shiftPressed: boolean) => {
            switch (key) {
                case "ArrowUp"   : Game.player.anim.climbUp(); break;
                case "ArrowDown" : Game.player.anim.climbDown(); break;
                case "ArrowLeft" : Game.player.anim.moveLeft(shiftPressed); break;
                case "ArrowRight": Game.player.anim.moveRight(shiftPressed); break;
            }
        }

        let isMoving = true;
        Game.scene.onBeforeRenderObservable.add(() => {
            if(key_pressed) {
                isMoving = true
                switchMoves(key_pressed, shiftPressed);
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
        Game.Inst.initCameras();
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
