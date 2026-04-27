import "./style.css";
import { secondsPerTick } from "./constants.ts";
import { gameState } from "./game.ts";
import { grid } from "./grid.ts";
import { ShopUI } from "./shop/shopUI.ts";
import { ContextMenu } from "./ui/contextMenu.ts";

/* =========================
   APP SHELL
========================= */

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Could not find #app");
}

app.innerHTML = `
  <div class="page">
    <div class="game-shell">
      <div class="top-bar">
        <div class="title">Dot Matrix</div>
        <button id="pause-btn" class="pause-btn">Pause</button>
        <button id="bounds-btn" class="pause-btn">Show Bounds</button>
        <div class="stats" id="stats">Dots: 0</div>
      </div>

      <div class="content">
        <div class="canvas-wrap">
          <canvas id="game-canvas"></canvas>
          <div id="context-panel" class="context-panel" style="display: none;"></div>
        </div>

        <aside class="side-panel">
          <h2>How to Play</h2>
          <p>
            Welcome to Dot Matrix! This is a simple incremental game where you can place producers and consumers on a grid. Producers generate dots, while consumers consume them and add to your dot count. Spend your dots to buy more producers and consumers, upgrade their speed, and experiment with different layouts to maximize your dot production!
          </p>
          <p>
            To get started, drag and drop a 2x2 producer from the shop and place it on the grid. Then add a 2x2 consumer and place it so they overlap. That'll start getting you dots to progress through the game.
          </p>
          <h2>Shop</h2>
          <div id="shop"></div>
        </aside>
      </div>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;
if (!canvas) {
  throw new Error("Could not find canvas");
}

const statsEl = document.querySelector<HTMLDivElement>("#stats")!;
if (!statsEl) {
  throw new Error("Could not find stats element");
}

const ctx = canvas.getContext("2d")!;
if (!ctx) {
  throw new Error("Could not get 2D context");
}

const shopEl = document.querySelector<HTMLDivElement>("#shop")!;
if(!shopEl) {
  throw new Error("Could not get Shop");
}

const pauseBtn = document.querySelector<HTMLButtonElement>("#pause-btn")!;
if(!pauseBtn) {
  throw new Error("Could not find pause button");
}

const boundsBtn = document.querySelector<HTMLButtonElement>("#bounds-btn")!;
if(!boundsBtn) {
  throw new Error("Could not find bounds button");
}

const contextPanelEl = document.querySelector<HTMLDivElement>("#context-panel")!;
if(!contextPanelEl) {
  throw new Error("Could not find context panel");
}

/* =========================
   SHOP / UI
========================= */

let hoveredGridCell: { x: number; y: number } | null = null;

const shop = new ShopUI(shopEl);
const contextMenu = new ContextMenu(contextPanelEl, canvas.parentElement ?? canvas);

function screenToGrid(clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();

  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  const cellWidth = canvas.clientWidth / grid.width;
  const cellHeight = canvas.clientHeight / grid.height;

  return {
    x: Math.floor(localX / cellWidth),
    y: Math.floor(localY / cellHeight),
  };
}

/* =========================
   CANVAS INPUT
========================= */

// Prevent default drag behaviors on canvas
canvas.addEventListener("dragover", (event) => {
  if (shop.selectedItem) {
    event.preventDefault();
    (event.dataTransfer as DataTransfer).dropEffect = "move";
    hoveredGridCell = screenToGrid(event.clientX, event.clientY);
  }
});

canvas.addEventListener("dragenter", (event) => {
  if (shop.selectedItem) {
    event.preventDefault();
  }
});

// Handle dropping items on canvas
canvas.addEventListener("drop", (event) => {
  event.preventDefault();
  
  if (!shop.selectedItem) return;

  const pos = screenToGrid(event.clientX, event.clientY);
  shop.tryPlaceItem(pos.x, pos.y);
});

canvas.addEventListener("click", (event) => {
  if (shop.selectedItem) return;

  const pos = screenToGrid(event.clientX, event.clientY);
  contextMenu.pinForCell(pos.x, pos.y, event.clientX, event.clientY);
});

canvas.addEventListener("mousemove", (event) => {
  hoveredGridCell = screenToGrid(event.clientX, event.clientY);
  
  // Show context panel if hovering over entities (and not dragging a new item)
  if (!shop.selectedItem && hoveredGridCell) {
    contextMenu.showForCell(hoveredGridCell.x, hoveredGridCell.y, event.clientX, event.clientY);
  }
});

canvas.addEventListener("mouseleave", () => {
  hoveredGridCell = null;
  if (!shop.selectedItem) {
    contextMenu.hideIfUnpinned();
  }
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  contextMenu.dismiss();
});

document.addEventListener("click", (event) => {
  if (event.target === canvas || contextMenu.containsTarget(event.target)) {
    return;
  }

  contextMenu.dismiss();
});

document.addEventListener("contextmenu", () => {
  contextMenu.dismiss();
});

/* =========================
   CANVAS / RENDERING
========================= */

function resizeCanvas(): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawGrid(): void {
  const cellWidth = canvas.clientWidth / grid.width;
  const cellHeight = canvas.clientHeight / grid.height;

  // Optional subtle grid background:
  ctx.fillStyle = "#1b1b1b";
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const screenX = x * cellWidth;
      const screenY = y * cellHeight;
      ctx.fillRect(screenX, screenY, cellWidth - 1, cellHeight - 1);
    }
  }
}

function drawDots(): void {
  const cellWidth = canvas.clientWidth / grid.width;
  const cellHeight = canvas.clientHeight / grid.height;
  const dotRadius = Math.min(cellWidth, cellHeight) * 0.3;

  // Draw filled cells as dots.
  ctx.fillStyle = "#ffffff";

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.get(x,y);
      if (cell === 0) continue;

      const centerX = x * cellWidth + cellWidth * 0.5;
      const centerY = y * cellHeight + cellHeight * 0.5;

      ctx.beginPath();
      ctx.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawEntityBounds(): void {
  if (!gameState.showBounds) return;

  const cellWidth = canvas.clientWidth / grid.width;
  const cellHeight = canvas.clientHeight / grid.height;

  ctx.lineWidth = 1;

  for (const producer of gameState.producers) {
    ctx.strokeStyle = "#55ff88";
    ctx.strokeRect(
      producer.beginX * cellWidth,
      producer.beginY * cellHeight,
      producer.width * cellWidth,
      producer.height * cellHeight
    );
  }

  for (const consumer of gameState.consumers) {
    ctx.strokeStyle = "#ffcc55";
    ctx.strokeRect(
      consumer.beginX * cellWidth,
      consumer.beginY * cellHeight,
      consumer.width * cellWidth,
      consumer.height * cellHeight
    );
  }
}

function drawHoveredShopItem(): void {
  const selectedItem = shop.selectedItem;
  if (selectedItem && hoveredGridCell) {
    // Check if the hovered cell is within valid bounds
    if (
      hoveredGridCell.x < 0 ||
      hoveredGridCell.y < 0 ||
      hoveredGridCell.x >= grid.width ||
      hoveredGridCell.y >= grid.height
    ) {
      return;
    }

    const cellWidth = canvas.clientWidth / grid.width;
    const cellHeight = canvas.clientHeight / grid.height;

    ctx.strokeStyle = gameState.dotCount >= selectedItem.cost ? "#ffffff" : "#ff5555";
    ctx.lineWidth = 2;

    ctx.strokeRect(
      hoveredGridCell.x * cellWidth,
      hoveredGridCell.y * cellHeight,
      selectedItem.width * cellWidth,
      selectedItem.height * cellHeight
    );
  }
}

function drawStats(): void {
  let dotText = gameState.dotCount.toString();
  if(gameState.dotCount >= 1000 && gameState.dotCount < 1000000) {
    dotText = (gameState.dotCount / 1000).toFixed(1) + "K";
  }
  else if(gameState.dotCount >= 1000000 && gameState.dotCount < 1000000000) {
    dotText = (gameState.dotCount / 1000000).toFixed(1) + "M";
  }
  else if(gameState.dotCount >= 1000000000 && gameState.dotCount < 1000000000000) {
    dotText = (gameState.dotCount / 1000000000).toFixed(1) + "B";
  }
  statsEl.textContent = `Dots: ${dotText} \t Dot Production/s: ${gameState.dotProductionRate} \t Dot Consumption/s: ${gameState.dotConsumptionRate}`;
}

function render(): void {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, width, height);

  drawGrid();
  drawDots();

  drawEntityBounds();

  drawStats();

  drawHoveredShopItem();
}


/* =========================
   MAIN LOOP
========================= */

let lastTime = 0;
let accumulator = 0;
const TICK_INTERVAL = secondsPerTick(gameState.TICK_RATE);

function frame(time: number): void {
  if (lastTime === 0) {
    lastTime = time;
  }

  const deltaSeconds = (time - lastTime) / 1000;
  lastTime = time;

  accumulator += deltaSeconds;

  while (accumulator >= TICK_INTERVAL) {
    if (!gameState.isPaused) {
      gameState.update(TICK_INTERVAL);
    }
    accumulator -= TICK_INTERVAL;
  }

  render();
  shop.updateButtonStates();
  contextMenu.refresh();
  requestAnimationFrame(frame);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});

pauseBtn.addEventListener("click", () => {
  gameState.isPaused = !gameState.isPaused;
  pauseBtn.textContent = gameState.isPaused ? "Resume" : "Pause";
});

boundsBtn.addEventListener("click", () => {
  gameState.showBounds = !gameState.showBounds;
  boundsBtn.textContent = gameState.showBounds ? "Hide Bounds" : "Show Bounds";
});

resizeCanvas();
shop.render();
requestAnimationFrame(frame);
