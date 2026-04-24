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
        <button id="bounds-btn" class="pause-btn">Hide Bounds</button>
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
            Welcome to Dot Matrix! This is a simple resource management game where you can place producers and consumers on a grid. Producers generate dots, while consumers consume them and add to your dot count. Spend your dots to buy more producers and consumers, upgrade their speed, and experiment with different layouts to maximize your dot production!
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

/* =========================
   WORLD
========================= */

const GRID_WIDTH = 48;
const GRID_HEIGHT = 32;

class Grid {
  width: number;
  height: number;
  cells: Uint8Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = new Uint8Array(width * height);
  }

  index(x: number, y: number) {
    return y * this.width + x;
  }

  get(x: number, y: number) {
    return this.cells[this.index(x, y)];
  }

  set(x: number, y: number, value: number) {
    this.cells[this.index(x, y)] = value;
  }

  fill(value: number) {
    this.cells.fill(value);
  }

  clear() {
    this.cells.fill(0);
  }

  countFilledCells() {
    let count = 0;
    for(let i = 0; i < this.cells.length; i++)
    {
      if(this.cells[i] > 0)
        count++;
    }
    return count;
  }
}

const grid = new Grid (GRID_WIDTH, GRID_HEIGHT);

const tickRateProgression = [2, 5, 10, 20, 30, 60];

function secondsPerTick(tickRate: number): number {
  return 1 / tickRate;
}

/* =========================
   PRODUCER
========================= */

class Producer {
  beginX : number;
  beginY : number;
  width : number;
  height : number;
  currentTickRateIndex : number;
  private currentX: number;
  private currentY: number;
  private tickCounter: number;
  private phase: number;

  constructor(beginX:number, beginY:number, width:number, height:number, phase: number)
  {
    this.beginX = beginX;
    this.beginY = beginY;
    this.width = width;
    this.height = height;

    this.currentX = beginX;
    this.currentY = beginY;
    this.currentTickRateIndex = 0;
    this.tickCounter = 0; // producers start producing immediately, so no initial delay
    this.phase = phase; // this will be used when saving and loading.
  }

  reset()
  {
    this.currentX = this.beginX;
    this.currentY = this.beginY;
  }

  upgradeTickRate()
  {
    if(this.currentTickRateIndex < tickRateProgression.length - 1)
    {
      this.currentTickRateIndex++;
    }
    this.tickCounter = secondsPerTick(tickRateProgression[this.currentTickRateIndex]);
  }

  update(deltaTime: number)
  {
    this.tickCounter -= deltaTime;

    while (this.tickCounter <= 0) {
      this.update_internal();
      this.tickCounter += secondsPerTick(tickRateProgression[this.currentTickRateIndex]);
    }
  }

  update_internal()
  {
    grid.set(this.currentX, this.currentY, 1);

    this.currentX++;
    if(this.currentX >= this.beginX + this.width)
    {
      this.currentX = this.beginX;
      this.currentY++;
      if(this.currentY >= this.beginY + this.height)
      {
        this.reset();
      }
    }
  }
}


/* =========================
   CONSUMER
========================= */

class Consumer {
  beginX : number;
  beginY : number;
  width : number;
  height : number;
  currentTickRateIndex : number;
  private currentX: number;
  private currentY: number;
  private tickCounter: number;
  private phase: number; // this will be used when saving and loading.

  constructor(beginX:number, beginY:number, width:number, height:number, phase: number)
  {
    this.beginX = beginX;
    this.beginY = beginY;
    this.width = width;
    this.height = height;
    this.phase = phase; // this will be used when saving and loading.

    this.currentX = beginX;
    this.currentY = beginY;
    this.currentTickRateIndex = 0;
    this.tickCounter = 0; // consumers start consuming immediately, so no initial delay
  }

  reset()
  {
    this.currentX = this.beginX;
    this.currentY = this.beginY;
  }

  upgradeTickRate()
  {
    if(this.currentTickRateIndex < tickRateProgression.length - 1)
    {
      this.currentTickRateIndex++;
    }
    this.tickCounter = secondsPerTick(tickRateProgression[this.currentTickRateIndex]);
  }

  update(deltaTime: number)
  {
    this.tickCounter -= deltaTime;

    while (this.tickCounter <= 0) {
      this.update_internal();
      this.tickCounter += secondsPerTick(tickRateProgression[this.currentTickRateIndex]);
    }
  }

  private update_internal()
  {
    if(grid.get(this.currentX,this.currentY) > 0)
      {
        dotCount++;
      }
      grid.set(this.currentX, this.currentY, 0);

      this.currentX++;
      if(this.currentX >= this.beginX + this.width)
      {
        this.currentX = this.beginX;
        this.currentY++;
        if(this.currentY >= this.beginY + this.height)
        {
          this.reset();
        }
      }
  }
  
}


/* =========================
   SIMULATION UPDATE
========================= */
let dotCount = 20;
let isPaused = false;
let showBounds = true;
const producers: Producer[] = [];
const consumers: Consumer[] = [];

// ticks per second for simulation
const TICK_RATE = 60;//tickRateProgression[tickRateProgression.length - 1]; // max tick rate from progression

function update(deltaTime: number): void {
  // update all producers
  for(let i = 0; i < producers.length; i++)
  {
    producers[i].update(deltaTime);
  }

  // update all consumers
  for(let i = 0 ; i < consumers.length; i++)
  {
    consumers[i].update(deltaTime);
  }
}

/* =========================
   SHOP / UI
========================= */

type BuildKind = "producer" | "consumer";

type ShopItem = {
  id: string;
  name: string;
  kind: BuildKind;
  width: number;
  height: number;
  cost: number;
};

const shopItems: ShopItem[] = [
  { id: "producer-2x2", name: "Producer", kind: "producer", width: 2, height: 2, cost: 5 },
  { id: "consumer-2x2", name: "Consumer", kind: "consumer", width: 2, height: 2, cost: 10 },
  { id: "producer-4x4", name: "Producer", kind: "producer", width: 4, height: 4, cost: 100 },
  { id: "consumer-4x4", name: "Consumer", kind: "consumer", width: 4, height: 4, cost: 100 },
  { id: "producer-8x4", name: "Producer", kind: "producer", width: 8, height: 4, cost: 400 },
  { id: "consumer-8x4", name: "Consumer", kind: "consumer", width: 8, height: 4, cost: 400 },
  { id: "producer-8x8", name: "Producer", kind: "producer", width: 8, height: 8, cost: 5000 },
  { id: "consumer-8x8", name: "Consumer", kind: "consumer", width: 8, height: 8, cost: 5000 },
];

let selectedShopItem: ShopItem | null = null;
let hoveredGridCell: { x: number; y: number } | null = null;
let shopButtons: { button: HTMLButtonElement; item: ShopItem }[] = [];

function renderShop(): void {
  shopEl.innerHTML = "";
  shopButtons = []; // Clear the array!
  
  for (const item of shopItems) {
    const button = document.createElement("button");
    button.textContent = `${item.name} ${item.width}x${item.height} - ${item.cost} dots`;
    button.disabled = dotCount < item.cost;

    if (selectedShopItem?.id === item.id) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      selectedShopItem = item;
      updateShopButtons(); // Just update UI, don't re-render
    });

    shopButtons.push({ button, item });
    shopEl.appendChild(button);
  }
}

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
  for (let i = 0; i < producers.length; i++) {
    const producer = producers[i];
    if (gridX >= producer.beginX && gridX < producer.beginX + producer.width &&
        gridY >= producer.beginY && gridY < producer.beginY + producer.height) {
      entities.push({ type: "producer", entity: producer, index: i });
    }
  }

  // Check consumers
  for (let i = 0; i < consumers.length; i++) {
    const consumer = consumers[i];
    if (gridX >= consumer.beginX && gridX < consumer.beginX + consumer.width &&
        gridY >= consumer.beginY && gridY < consumer.beginY + consumer.height) {
      entities.push({ type: "consumer", entity: consumer, index: i });
    }
  }

  return entities;
}

const UPGRADE_TICK_RATE_COST = 50;

function showContextPanel(entities: Entity[], screenX: number, screenY: number): void {
  if (entities.length === 0) {
    contextPanel.style.display = "none";
    return;
  }

  let html = "";
  entities.forEach((entity, idx) => {
    const typeName = entity.type === "producer" ? "Producer" : "Consumer";
    const currentTickRate = tickRateProgression[entity.entity.currentTickRateIndex];
    const nextTickRateIndex = entity.entity.currentTickRateIndex + 1;
    const canUpgrade = nextTickRateIndex < tickRateProgression.length;
    const nextTickRate = canUpgrade ? tickRateProgression[nextTickRateIndex] : currentTickRate;

    html += `
      <div class="entity-info">
        <div class="entity-header">${typeName} #${idx + 1}</div>
        <div class="entity-details">
          <div>Speed: ${currentTickRate}/s ${canUpgrade ? `→ ${nextTickRate}/s` : "(max)"}</div>
          <button class="upgrade-btn" data-entity-type="${entity.type}" data-entity-index="${entity.index}" ${!canUpgrade || dotCount < UPGRADE_TICK_RATE_COST ? "disabled" : ""}>
            Upgrade (${UPGRADE_TICK_RATE_COST} dots)
          </button>
          <button class="delete-btn" data-entity-type="${entity.type}" data-entity-index="${entity.index}">Delete</button>
        </div>
      </div>
    `;
  });

  contextPanel.innerHTML = html;
  contextPanel.style.display = "block";
  contextPanel.style.left = screenX + "px";
  contextPanel.style.top = screenY + "px";

  // Add event listeners to buttons
  contextPanel.querySelectorAll(".upgrade-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const entityType = (btn as HTMLButtonElement).dataset.entityType as "producer" | "consumer";
      const entityIndex = parseInt((btn as HTMLButtonElement).dataset.entityIndex!);

      if (entityType === "producer") {
        if (dotCount >= UPGRADE_TICK_RATE_COST) {
          producers[entityIndex].upgradeTickRate();
          dotCount -= UPGRADE_TICK_RATE_COST;
          showContextPanel(entities, screenX, screenY); // Refresh display
        }
      } else {
        if (dotCount >= UPGRADE_TICK_RATE_COST) {
          consumers[entityIndex].upgradeTickRate();
          dotCount -= UPGRADE_TICK_RATE_COST;
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
        producers.splice(entityIndex, 1);
      } else {
        consumers.splice(entityIndex, 1);
      }
      
      contextPanel.style.display = "none";
    });
  });
}

canvas.addEventListener("click", (event) => {
  if (!selectedShopItem) return;
  if (dotCount < selectedShopItem.cost) return;

  const pos = screenToGrid(event.clientX, event.clientY);

  // Optional: prevent placement outside bounds
  if (
    pos.x < 0 ||
    pos.y < 0 ||
    pos.x + selectedShopItem.width > grid.width ||
    pos.y + selectedShopItem.height > grid.height
  ) {
    return;
  }

  dotCount -= selectedShopItem.cost;

  if (selectedShopItem.kind === "producer") {
    producers.push(
      new Producer(pos.x, pos.y, selectedShopItem.width, selectedShopItem.height, GLOBAL_PHASE)
    );
  } else {
    consumers.push(
      new Consumer(pos.x, pos.y, selectedShopItem.width, selectedShopItem.height, GLOBAL_PHASE)
    );
  }

  selectedShopItem = null; // or keep selected for repeat placement
  renderShop();
});

canvas.addEventListener("mousemove", (event) => {
  hoveredGridCell = screenToGrid(event.clientX, event.clientY);
  
  // Show context panel if hovering over entities (and not placing a new item)
  if (!selectedShopItem && hoveredGridCell) {
    const entities = getEntitiesAtGridCell(hoveredGridCell.x, hoveredGridCell.y);
    if (entities.length > 0) {
      showContextPanel(entities, event.clientX, event.clientY);
    } else {
      contextPanel.style.display = "none";
    }
  }
});

canvas.addEventListener("mouseleave", () => {
  hoveredGridCell = null;
  contextPanel.style.display = "none";
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  selectedShopItem = null;
  renderShop();
});

renderShop();

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
  if (!showBounds) return;

  const cellWidth = canvas.clientWidth / grid.width;
  const cellHeight = canvas.clientHeight / grid.height;

  ctx.lineWidth = 1;

  for (const producer of producers) {
    ctx.strokeStyle = "#55ff88";
    ctx.strokeRect(
      producer.beginX * cellWidth,
      producer.beginY * cellHeight,
      producer.width * cellWidth,
      producer.height * cellHeight
    );
  }

  for (const consumer of consumers) {
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
  if (selectedShopItem && hoveredGridCell) {
    const cellWidth = canvas.clientWidth / grid.width;
    const cellHeight = canvas.clientHeight / grid.height;

    ctx.strokeStyle = dotCount >= selectedShopItem.cost ? "#ffffff" : "#ff5555";
    ctx.lineWidth = 2;

    ctx.strokeRect(
      hoveredGridCell.x * cellWidth,
      hoveredGridCell.y * cellHeight,
      selectedShopItem.width * cellWidth,
      selectedShopItem.height * cellHeight
    );
  }
}

function updateShopButtons(): void {
  for (const { button, item } of shopButtons) {
    button.disabled = dotCount < item.cost;
    
    // Update selected class
    if (selectedShopItem?.id === item.id) {
      button.classList.add("selected");
    } else {
      button.classList.remove("selected");
    }
  }
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

  statsEl.textContent = `Dots: ${dotCount}`;

  drawHoveredShopItem();
}


/* =========================
   MAIN LOOP
========================= */

let lastTime = 0;
let accumulator = 0;
const TICK_INTERVAL = secondsPerTick(TICK_RATE);
let GLOBAL_PHASE = 0;

function frame(time: number): void {
  if (lastTime === 0) {
    lastTime = time;
  }

  const deltaSeconds = (time - lastTime) / 1000;
  lastTime = time;

  accumulator += deltaSeconds;

  while (accumulator >= TICK_INTERVAL) {
    if (!isPaused) {
      update(deltaSeconds);
      GLOBAL_PHASE++;
      GLOBAL_PHASE %= TICK_RATE;
    }
    accumulator -= TICK_INTERVAL;
  }

  render();
  updateShopButtons();
  requestAnimationFrame(frame);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});

pauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
});

boundsBtn.addEventListener("click", () => {
  showBounds = !showBounds;
  boundsBtn.textContent = showBounds ? "Hide Bounds" : "Show Bounds";
});

// Initialize
resizeCanvas();
renderShop();
requestAnimationFrame(frame);