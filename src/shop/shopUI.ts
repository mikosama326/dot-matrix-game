import { SHOP_ITEMS } from "./shopItems.ts";
import { type ShopItem } from "./shopItems.ts";
import { TICK_RATE_PROGRESSION, UPGRADE_TICK_RATE_COST } from "../constants.ts";
import { gameState } from "../game.ts";
import { grid } from "../grid.ts";

type SelectedShopItem = {
  item: ShopItem;
  level: number;
  cost: number;
  width: number;
  height: number;
};

type ShopEntry = {
  item: ShopItem;
  placeButton: HTMLButtonElement;
  itemName: HTMLSpanElement;
  itemCost: HTMLSpanElement;
  levelText: HTMLSpanElement;
  speedText: HTMLSpanElement;
  minusButton: HTMLButtonElement;
  plusButton: HTMLButtonElement;
};

export class ShopUI {
  selectedItem: SelectedShopItem | null = null;
  shopEntries: ShopEntry[] = [];

  private shopEl: HTMLDivElement;
  private selectedLevels = new Map<string, number>();

  constructor(shopEl: HTMLDivElement) {
    this.shopEl = shopEl;
  }

  render(): void {
    this.shopEl.innerHTML = "";
    this.shopEntries = [];

    for (const item of SHOP_ITEMS) {
      const row = document.createElement("div");
      row.className = "shop-item";

      const placeButton = document.createElement("button");
      placeButton.className = "shop-place-btn";
      placeButton.draggable = true;

      const preview = this.createItemPreview(item);
      const itemName = document.createElement("span");
      itemName.className = "shop-item-name";

      const itemCost = document.createElement("span");
      itemCost.className = "shop-item-cost";

      const levelControls = document.createElement("div");
      levelControls.className = "shop-level-controls";

      const minusButton = document.createElement("button");
      minusButton.className = "shop-level-btn shop-level-btn-minus";
      minusButton.type = "button";
      minusButton.textContent = "-";

      const levelReadout = document.createElement("div");
      levelReadout.className = "shop-level-readout";

      const levelText = document.createElement("span");
      levelText.className = "shop-level-text";

      const speedText = document.createElement("span");
      speedText.className = "shop-speed-text";

      const plusButton = document.createElement("button");
      plusButton.className = "shop-level-btn shop-level-btn-plus";
      plusButton.type = "button";
      plusButton.textContent = "+";

      minusButton.addEventListener("click", () => {
        this.changeSelectedLevel(item.id, -1);
        this.updateButtonStates();
      });

      plusButton.addEventListener("click", () => {
        this.changeSelectedLevel(item.id, 1);
        this.updateButtonStates();
      });

      placeButton.addEventListener("dragstart", (e) => {
        const level = this.getSelectedLevel(item.id);
        const cost = this.getPlacementCost(item, level);

        if (gameState.dotCount < cost) {
          e.preventDefault();
          return;
        }

        this.selectedItem = {
          item,
          level,
          cost,
          width: item.width,
          height: item.height,
        };
        (e.dataTransfer as DataTransfer).effectAllowed = "move";
        (e.dataTransfer as DataTransfer).setDragImage(new Image(), 0, 0);
      });

      placeButton.addEventListener("dragend", (e) => {
        if ((e.dataTransfer as DataTransfer).dropEffect === "none") {
          this.selectedItem = null;
        }
      });

      levelReadout.append(levelText, speedText);
      levelControls.append(minusButton, levelReadout, plusButton);
      row.append(placeButton, levelControls);
      this.shopEl.appendChild(row);

      this.shopEntries.push({
        item,
        placeButton,
        itemName,
        itemCost,
        levelText,
        speedText,
        minusButton,
        plusButton,
      });
      placeButton.append(itemName, preview, itemCost);
    }

    this.updateButtonStates();
  }

  updateButtonStates(): void {
    for (const entry of this.shopEntries) {
      const level = this.getSelectedLevel(entry.item.id);
      const cost = this.getPlacementCost(entry.item, level);
      const tickRate = TICK_RATE_PROGRESSION[level];

      entry.itemName.textContent = `${entry.item.name} ${entry.item.width}x${entry.item.height}`;
      entry.itemCost.textContent = `${cost} dots`;
      entry.placeButton.disabled = gameState.dotCount < cost;
      entry.levelText.textContent = `Lv ${level + 1}`;
      entry.speedText.textContent = `${tickRate}/s`;
      entry.minusButton.disabled = level <= 0;
      entry.plusButton.disabled = level >= TICK_RATE_PROGRESSION.length - 1;
    }
  }

  tryPlaceItem(gridX: number, gridY: number): boolean {
    if (!this.selectedItem) return false;
    if (gameState.dotCount < this.selectedItem.cost) return false;

    if (
      gridX < 0 ||
      gridY < 0 ||
      gridX + this.selectedItem.width > grid.width ||
      gridY + this.selectedItem.height > grid.height
    ) {
      this.selectedItem = null;
      return false;
    }

    const selectedItem = this.selectedItem;
    const item = selectedItem.item;
    gameState.dotCount -= selectedItem.cost;

    if (item.kind === "producer") {
      const producer = item.createActor(gridX, gridY, item.width, item.height, gameState.GLOBAL_PHASE);
      producer.setTickRateIndex(selectedItem.level);
      gameState.producers.push(producer);
    } else {
      const consumer = item.createActor(gridX, gridY, item.width, item.height, gameState.GLOBAL_PHASE);
      consumer.setTickRateIndex(selectedItem.level);
      gameState.consumers.push(consumer);
    }

    this.selectedItem = null;
    this.render();
    return true;
  }

  private getSelectedLevel(itemId: string): number {
    return this.selectedLevels.get(itemId) ?? 0;
  }

  private changeSelectedLevel(itemId: string, delta: number): void {
    const nextLevel = Math.max(
      0,
      Math.min(this.getSelectedLevel(itemId) + delta, TICK_RATE_PROGRESSION.length - 1)
    );
    this.selectedLevels.set(itemId, nextLevel);
  }

  private getPlacementCost(item: ShopItem, level: number): number {
    let cost = item.cost;

    for (let i = 0; i < level; i++) {
      cost += UPGRADE_TICK_RATE_COST[i];
    }

    return cost;
  }

  private createItemPreview(item: ShopItem): HTMLSpanElement {
    const preview = document.createElement("span");
    preview.className = `shop-item-preview ${item.kind}`;
    preview.style.setProperty("--item-width", String(item.width));
    preview.style.setProperty("--item-height", String(item.height));
    preview.dataset.size = `${item.width}x${item.height}`;
    preview.setAttribute("aria-hidden", "true");

    for (let i = 0; i < item.width * item.height; i++) {
      const cell = document.createElement("span");
      cell.className = "shop-item-preview-cell";
      preview.appendChild(cell);
    }

    return preview;
  }
}
