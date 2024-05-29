import './style.css';

import { Game } from './Game';


let start = document.getElementById("start")!;

let menu = document.querySelector("nav")!;


function main() {
  menu.classList.add("notplaying")

  const renderCanvas = document.getElementById(
    'renderCanvas'
  ) as HTMLCanvasElement;
  if (!renderCanvas) {
    return;
  }

  new Game(renderCanvas);
}


start.addEventListener("click", main);
