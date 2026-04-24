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
        </div>

        <aside class="side-panel">
          <h2>How to Play</h2>
          <p>
            Welcome to Dot Matrix! This is a simple resource management game where you can place producers and consumers on a grid. Producers generate dots, while consumers consume them. Your goal is to manage your dots effectively and build a thriving dot ecosystem! Or just draw funny stuff, if you want.
          </p>
          <p>
            To get started, select a producer or consumer from the shop on the right and click on the grid to place it. Producers will start generating dots in their area, while consumers will consume dots from their area. Generate as many dots as you can and have fun experimenting with different layouts!
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

/* =========================
   PRODUCER
========================= */

class Producer {
  beginX : number;
  beginY : number;
  width : number;
  height : number;
  private currentX: number;
  private currentY: number;

  constructor(beginX:number, beginY:number, width:number, height:number)
  {
    this.beginX = beginX;
    this.beginY = beginY;
    this.width = width;
    this.height = height;

    this.currentX = beginX;
    this.currentY = beginY;
  }

  reset()
  {
    this.currentX = this.beginX;
    this.currentY = this.beginY;
  }

  update()
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
        return;
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
  private currentX: number;
  private currentY: number;

  constructor(beginX:number, beginY:number, width:number, height:number)
  {
    this.beginX = beginX;
    this.beginY = beginY;
    this.width = width;
    this.height = height;

    this.currentX = beginX;
    this.currentY = beginY;
  }

  reset()
  {
    this.currentX = this.beginX;
    this.currentY = this.beginY;
  }

  update()
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
        return;
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
const TICK_RATE = 5;

function update(): void {
  // update all producers
  for(let i = 0; i < producers.length; i++)
  {
    producers[i].update();
  }

  // update all consumers
  for(let i = 0 ; i < consumers.length; i++)
  {
    consumers[i].update();
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
  { id: "producer-2x2", name: "Producer2x2", kind: "producer", width: 2, height: 2, cost: 5 },
  { id: "consumer-2x2", name: "Consumer2x2", kind: "consumer", width: 2, height: 2, cost: 10 },
  { id: "producer-4x4", name: "Producer4x4", kind: "producer", width: 4, height: 4, cost: 15 },
  { id: "consumer-4x4", name: "Consumer4x4", kind: "consumer", width: 4, height: 4, cost: 20 },
  { id: "producer-8x4", name: "Producer8x4", kind: "producer", width: 8, height: 4, cost: 400 },
  { id: "consumer-8x4", name: "Consumer8x4", kind: "consumer", width: 8, height: 4, cost: 400 },
  { id: "producer-8x8", name: "Producer8x8", kind: "producer", width: 8, height: 8, cost: 5000 },
  { id: "consumer-8x8", name: "Consumer8x8", kind: "consumer", width: 8, height: 8, cost: 5000 },
];

let selectedShopItem: ShopItem | null = null;
let hoveredGridCell: { x: number; y: number } | null = null;

function renderShop(): void {
  shopEl.innerHTML = "";

  for (const item of shopItems) {
    const button = document.createElement("button");

    button.textContent = `${item.name} ${item.width}x${item.height} - ${item.cost} dots`;
    button.disabled = dotCount < item.cost;

    if (selectedShopItem?.id === item.id) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      selectedShopItem = item;
      renderShop();
    });

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
      new Producer(pos.x, pos.y, selectedShopItem.width, selectedShopItem.height)
    );
  } else {
    consumers.push(
      new Consumer(pos.x, pos.y, selectedShopItem.width, selectedShopItem.height)
    );
  }

  selectedShopItem = null; // or keep selected for repeat placement
  renderShop();
});

canvas.addEventListener("mousemove", (event) => {
  hoveredGridCell = screenToGrid(event.clientX, event.clientY);
});

canvas.addEventListener("mouseleave", () => {
  hoveredGridCell = null;
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  selectedShopItem = null;
  renderShop();
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
  renderShop();
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
const TICK_INTERVAL = 1 / TICK_RATE;

function frame(time: number): void {
  if (lastTime === 0) {
    lastTime = time;
  }

  const deltaSeconds = (time - lastTime) / 1000;
  lastTime = time;

  accumulator += deltaSeconds;

  while (accumulator >= TICK_INTERVAL) {
    if (!isPaused) {
      update();
    }
    accumulator -= TICK_INTERVAL;
    updateShopButtons();
  }

  render();
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