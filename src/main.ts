//# Local :
import "./UI/style.css";
import { Game } from "./game.ts";


//-----------------------------------------------------------------------------------


// DOM's Shortcuts :
const START_BTN = document.getElementById("start")!;
const MENU = document.querySelector("nav")!;

async function startGame() {
  MENU.classList.add("notplaying");

  Game.engine.displayLoadingUI();
  await Game.buildScene();
  await Game.initPlayer();
  Game.engine.hideLoadingUI();

  Game.playCutscene();

  Game.play();
}

START_BTN.addEventListener("click", startGame);
