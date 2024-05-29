import {
    Scene,
    Engine,
    Vector3,
    CubeTexture,
    HemisphericLight,
    SceneLoader,
    ActionManager,
    ExecuteCodeAction,
    ArcRotateCamera,
    FreeCamera,
    Animation,
    Sound
  } from "@babylonjs/core";
  import "@babylonjs/loaders";
  
  export class Game {
    scene: Scene;
    engine: Engine;
    camera!: FreeCamera;
    playerCamera!: ArcRotateCamera;
  
    constructor(private canvas: HTMLCanvasElement) {
      this.engine = new Engine(this.canvas, true);

      this.engine.displayLoadingUI();

      this.scene = this.CreateScene();

      this.CreateCharacter();

      this.CreateEnvironment();

      this.CreateCutscene();
  
      this.engine.runRenderLoop(() => {
        
        this.scene.render();
      });
    }
  
    CreateScene(): Scene {
      const scene = new Scene(this.engine);

      this.camera = new FreeCamera("camera", new Vector3(-100, 220, -80), this.scene);
      this.camera.minZ = 0.5;
      this.camera.speed = 0.5;
      this.camera.rotation._y = Math.PI;

      const envTex = CubeTexture.CreateFromPrefilteredData(
        "../assets/environment/environment.env",
        scene
      );
  
      scene.environmentTexture = envTex;
  
      scene.createDefaultSkybox(envTex, true);
  
      scene.environmentIntensity = 0.5;

      const hemiLight = new HemisphericLight(
        "hemiLight",
        new Vector3(0, 1, 0),
        this.scene
      );
  
      hemiLight.intensity = 0.75;

      return scene;
    }

    async CreateEnvironment(): Promise<void> {
      await SceneLoader.ImportMeshAsync("", "../assets/models/", "map.glb");
      
      const backgroundMusic = new Sound(
        "backgroundMusic",
        "./assets/audio/olympics.mp3",
        this.scene,
        null,
        {
          volume: 0,
          autoplay: true,
        }
      );
  
      backgroundMusic.setVolume(0.75, 30);

      this.engine.hideLoadingUI();
    }

  
    async CreateCharacter(): Promise<void> {

      const arcAlpha = 1.5046653238154635 + (1.6172777427591525 - 1.159866067925365);
      const arcBeta = 1.5296884191499718 + (1.2714331445491482 - 1.2535226809366065);
      const arcRadius = 44.649908575154164 + (47.23366662045099 - 44.649908575154164);

      this.playerCamera = new ArcRotateCamera("arcRotateCamera",arcAlpha,  arcBeta, arcRadius, new Vector3(0, 0, 0), this.scene);
     

      const model = await SceneLoader.ImportMeshAsync(
        "",
        "../assets/models/",
        "climber.glb",
        this.scene
      );
  
      let player = model.meshes[0];
      player.scaling.setAll(5);
      player.position.x = -20;
      player.position.z = 1;

      this.playerCamera.setTarget(player);

      const hang = this.scene.getAnimationGroupByName("1_hang")!;
      const hangBraced = this.scene.getAnimationGroupByName("2_hangBraced")!;
      const bracedHang = this.scene.getAnimationGroupByName("3_bracedHang")!;
      const climbUp = this.scene.getAnimationGroupByName("4_climbingUp")!;
      const climbDown = this.scene.getAnimationGroupByName("5_climbingDown")!;
      const shimmyRight = this.scene.getAnimationGroupByName("6_shimmyRight")!;
      const shimmyLeft = this.scene.getAnimationGroupByName("7_shimmyLeft")!;
      const hopRight = this.scene.getAnimationGroupByName("8_hopRight")!;
      const hopLeft = this.scene.getAnimationGroupByName("9_hopLeft")!;

      

      let keyStatus: { [key: string]: boolean } = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Shift: false
    };

      this.scene.actionManager = new ActionManager(this.scene);

      this.scene.actionManager.registerAction( new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (event) => {
        let key = event.sourceEvent.key;
        if (key in keyStatus) {
          keyStatus[key] = true;
        }
      }));

      this.scene.actionManager.registerAction( new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (event) => {
        let key = event.sourceEvent.key;
        if (key in keyStatus) {
          keyStatus[key] = false;
        }
      }))

      let moving = false;
      let activeAnim;
      let animSpeed = 0.1;

      this.scene.onBeforeRenderObservable.add(() => {
        if(keyStatus.ArrowUp || keyStatus.ArrowDown || keyStatus.ArrowLeft || keyStatus.ArrowRight) {
          moving = true;
          if(keyStatus.ArrowUp && !(keyStatus.ArrowDown || keyStatus.ArrowLeft || keyStatus.ArrowRight)) {
            climbUp.start(true, 1, climbUp.from, climbUp.to, false);
            player.moveWithCollisions(player.up.scaleInPlace(0.2));
          }
          if(keyStatus.ArrowDown && !(keyStatus.ArrowUp || keyStatus.ArrowLeft || keyStatus.ArrowRight)) {
            climbDown.start(true, 1, hang.from, climbDown.to, false);
            player.moveWithCollisions(player.up.scaleInPlace(-0.2));
          }
          if(keyStatus.ArrowRight && !(keyStatus.ArrowUp || keyStatus.ArrowDown || keyStatus.ArrowLeft)) {
            activeAnim = keyStatus.Shift ? hopLeft : shimmyLeft;
            animSpeed = keyStatus.Shift ? 0.2 : 0.1;
            activeAnim.start(false, 1, activeAnim.from, activeAnim.to, false);
            player.moveWithCollisions(player.right.scaleInPlace(animSpeed));
          }
          if(keyStatus.ArrowLeft && !(keyStatus.ArrowUp || keyStatus.ArrowDown || keyStatus.ArrowRight)) {
            activeAnim = keyStatus.Shift ? hopRight : shimmyRight;
            animSpeed = keyStatus.Shift ? 0.2 : 0.1;
            activeAnim.start(true, 1, activeAnim.from, activeAnim.to, false);
            player.moveWithCollisions(player.right.scaleInPlace(-animSpeed));
          }
        }
        else if(moving) {
          hang.start(true, 1, hang.from, hang.to, true);
          climbUp.stop();
          climbDown.stop();
          shimmyLeft.stop();
          shimmyRight.stop();
          hopRight.stop();
          hopLeft.stop();
          bracedHang.stop();
          hangBraced.stop();
          moving = false;
        }
      });

    }

    async CreateCutscene(): Promise<void> {
      const camKeys = [];
      const fps = 60;
      const camAnim = new Animation(
        "camAnim",
        "position",
        fps,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
        true
      );


      camKeys.push({ frame: 0, value: new Vector3(-100, 220, -80) });
      camKeys.push({ frame: 5 * fps, value: new Vector3(-55, 170, 45) });
      camKeys.push({ frame: 5 * fps, value: new Vector3(-75, 170, 30) });
      camKeys.push({ frame: 7 * fps, value: new Vector3(-75, 130, 40) });
      camKeys.push({ frame: 10 * fps, value: new Vector3(-15, 115, 50) });
      camKeys.push({ frame: 10 * fps, value: new Vector3(5, 110, 30) });
      camKeys.push({ frame: 12 * fps, value: new Vector3(13, 75, 0) });
      camKeys.push({ frame: 13 * fps, value: new Vector3(13, 75, 0) });
      camKeys.push({ frame: 15 * fps, value: new Vector3(-7, 100, 30) });
      camKeys.push({ frame: 17 * fps, value: new Vector3(-40, 70, 60) });
      camKeys.push({ frame: 20 * fps, value: new Vector3(-32, 150, 120) });
      camKeys.push({ frame: 21 * fps, value: new Vector3(-32, 150, 120) });
      camKeys.push({ frame: 25 * fps, value: new Vector3(-32, 35, 120) });
      camKeys.push({ frame: 26 * fps, value: new Vector3(-32, 35, 120) });
  
      camAnim.setKeys(camKeys);
  
      this.camera.animations.push(camAnim);

  
      await this.scene.beginAnimation(this.camera, 0, 26 * fps).waitAsync();

      console.log(camAnim);
      this.EndCutscene();
    }
  
    EndCutscene(): void {
      this.scene.activeCamera = this.playerCamera;
    }
  }