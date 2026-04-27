import "./style.css";

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
            To get started, select add a 2x2 producer from the shop and place it on the grid. Then add a 2x2 consumer and place it so they overlap. That'll start getting you dots to progress through the game.
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

const contextPanel = document.querySelector<HTMLDivElement>("#context-panel")!;
if(!contextPanel) {
  throw new Error("Could not find context panel");
}

let contextPanelHideTimeout: number | null = null;

/* =========================
   WORLD
========================= */
import { grid } from "./grid.ts";
import { Producer, Consumer } from "./entities/actor.ts";
import { secondsPerTick, TICK_RATE_PROGRESSION, UPGRADE_TICK_RATE_COST} from "./constants.ts";

/* =========================
   SIMULATION UPDATE
========================= */
import { gameState } from "./game.ts";

/* =========================
   SHOP / UI
========================= */

import { ShopUI } from "./shop/shopUI.ts";

let hoveredGridCell: { x: number; y: number } | null = null;

let shop: ShopUI;

// Initialize shop with callbacks to add entities to game state
shop = new ShopUI(
  shopEl,
  (producer) => gameState.producers.push(producer),
  (consumer) => gameState.consumers.push(consumer)
);


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

type Entity = { type: "producer"; entity: Producer; index: number } | { type: "consumer"; entity: Consumer; index: number };

function getEntitiesAtGridCell(gridX: number, gridY: number): Entity[] {
  const entities: Entity[] = [];

  // Check producers
  for (let i = 0; i < gameState.producers.length; i++) {
    const producer = gameState.producers[i];
    if (gridX >= producer.beginX && gridX < producer.beginX + producer.width &&
        gridY >= producer.beginY && gridY < producer.beginY + producer.height) {
      entities.push({ type: "producer", entity: producer, index: i });
    }
  }

  // Check consumers
  for (let i = 0; i < gameState.consumers.length; i++) {
    const consumer = gameState.consumers[i];
    if (gridX >= consumer.beginX && gridX < consumer.beginX + consumer.width &&
        gridY >= consumer.beginY && gridY < consumer.beginY + consumer.height) {
      entities.push({ type: "consumer", entity: consumer, index: i });
    }
  }

  return entities;
}

function hideContextPanel(): void {
  contextPanel.style.display = "none";
}

function scheduleContextPanelHide(): void {
  if (contextPanelHideTimeout) {
    clearTimeout(contextPanelHideTimeout);
  }
  contextPanelHideTimeout = setTimeout(() => {
    hideContextPanel();
    contextPanelHideTimeout = null;
  }, 120); // 120ms delay
}

function cancelContextPanelHide(): void {
  if (contextPanelHideTimeout) {
    clearTimeout(contextPanelHideTimeout);
    contextPanelHideTimeout = null;
  }
}

function showContextPanel(entities: Entity[], screenX: number, screenY: number): void {
  if (entities.length === 0) {
    contextPanel.style.display = "none";
    return;
  }

  let html = "";
  entities.forEach((entity, idx) => {
    const typeName = entity.type === "producer" ? "Producer" : "Consumer";
    const currentTickRate = TICK_RATE_PROGRESSION[entity.entity.currentTickRateIndex];
    const nextTickRateIndex = entity.entity.currentTickRateIndex + 1;
    const canUpgrade = nextTickRateIndex < TICK_RATE_PROGRESSION.length;
    const nextTickRate = canUpgrade ? TICK_RATE_PROGRESSION[nextTickRateIndex] : currentTickRate;

    html += `
      <div class="entity-info">
        <div class="entity-header">${typeName} #${idx + 1}</div>
        <div class="entity-details">
          <div>Speed: ${currentTickRate}/s ${canUpgrade ? `→ ${nextTickRate}/s` : "(max)"}</div>
          <button class="upgrade-btn" data-entity-type="${entity.type}" data-entity-index="${entity.index}" ${!canUpgrade || gameState.dotCount < UPGRADE_TICK_RATE_COST[entity.entity.currentTickRateIndex] ? "disabled" : ""}>
            Upgrade (${UPGRADE_TICK_RATE_COST[entity.entity.currentTickRateIndex]} dots)
          </button>
          <button class="delete-btn" data-entity-type="${entity.type}" data-entity-index="${entity.index}">Delete</button>
        </div>
      </div>
    `;
  });

  contextPanel.innerHTML = html;
  contextPanel.style.display = "block";
  
  // Convert viewport-relative coordinates to canvas-wrap-relative coordinates
  const canvasWrap = canvas.parentElement;
  if (canvasWrap) {
    const canvasWrapRect = canvasWrap.getBoundingClientRect();
    const relativeX = screenX - canvasWrapRect.left;
    const relativeY = screenY - canvasWrapRect.top;
    
    const offsetX = 8;
    const offsetY = 8;
    contextPanel.style.left = (relativeX + offsetX) + "px";
    contextPanel.style.top = (relativeY + offsetY) + "px";
  }
  
  // Cancel any pending hide when showing
  cancelContextPanelHide();

  // Add event listeners to buttons
  contextPanel.querySelectorAll(".upgrade-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const entityType = (btn as HTMLButtonElement).dataset.entityType as "producer" | "consumer";
      const entityIndex = parseInt((btn as HTMLButtonElement).dataset.entityIndex!);

      if (entityType === "producer") {
        if (gameState.dotCount >= UPGRADE_TICK_RATE_COST[gameState.producers[entityIndex].currentTickRateIndex]) {
          gameState.producers[entityIndex].upgradeTickRate();
          gameState.dotCount -= UPGRADE_TICK_RATE_COST[gameState.producers[entityIndex].currentTickRateIndex];
          showContextPanel(entities, screenX, screenY); // Refresh display
        }
      } else {
        if (gameState.dotCount >= UPGRADE_TICK_RATE_COST[gameState.consumers[entityIndex].currentTickRateIndex]) {
          gameState.consumers[entityIndex].upgradeTickRate();
          gameState.dotCount -= UPGRADE_TICK_RATE_COST[gameState.consumers[entityIndex].currentTickRateIndex];
          showContextPanel(entities, screenX, screenY); // Refresh display
        }
      }
    });
  });

  contextPanel.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const entityType = (btn as HTMLButtonElement).dataset.entityType as "producer" | "consumer";
      const entityIndex = parseInt((btn as HTMLButtonElement).dataset.entityIndex!);

      if (entityType === "producer") {
        gameState.producers.splice(entityIndex, 1);
      } else {
        gameState.consumers.splice(entityIndex, 1);
      }
      
      contextPanel.style.display = "none";
    });
  });
}

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

canvas.addEventListener("mousemove", (event) => {
  hoveredGridCell = screenToGrid(event.clientX, event.clientY);
  
  // Show context panel if hovering over entities (and not dragging a new item)
  if (!shop.selectedItem && hoveredGridCell) {
    const entities = getEntitiesAtGridCell(hoveredGridCell.x, hoveredGridCell.y);
    if (entities.length > 0) {
      showContextPanel(entities, event.clientX, event.clientY);
    } else {
      scheduleContextPanelHide();
    }
  }
});

canvas.addEventListener("mouseleave", () => {
  hoveredGridCell = null;
  if (!shop.selectedItem) {
    scheduleContextPanelHide();
  }
});

// Add listeners to context panel to keep it visible when hovering over it
contextPanel.addEventListener("mouseenter", () => {
  cancelContextPanelHide();
});

contextPanel.addEventListener("mouseleave", () => {
  scheduleContextPanelHide();
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
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