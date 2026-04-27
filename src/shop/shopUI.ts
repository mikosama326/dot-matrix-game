import { SHOP_ITEMS } from "./shopItems.ts";
import { type ShopItem } from "./shopItems.ts";
import { Producer, Consumer } from "../entities/actor.ts";
import { gameState } from "../game.ts";
import { grid } from "../grid.ts";

export class ShopUI {
  selectedItem: ShopItem | null = null;
  shopButtons: { button: HTMLButtonElement; item: ShopItem }[] = [];

  private shopEl: HTMLDivElement;
  private onPlaceProducer: (producer: Producer) => void;
  private onPlaceConsumer: (consumer: Consumer) => void;

  constructor(
    shopEl: HTMLDivElement,
    onPlaceProducer: (producer: Producer) => void,
    onPlaceConsumer: (consumer: Consumer) => void
  ) {
    this.shopEl = shopEl;
    this.onPlaceProducer = onPlaceProducer;
    this.onPlaceConsumer = onPlaceConsumer;
  }

  render(): void {
    this.shopEl.innerHTML = "";
    this.shopButtons = [];

    for (const item of SHOP_ITEMS) {
      const button = document.createElement("button");
      button.textContent = `${item.name} ${item.width}x${item.height} - ${item.cost} dots`;
      button.disabled = gameState.dotCount < item.cost;
      button.draggable = true;

      button.addEventListener("dragstart", (e) => {
        if (gameState.dotCount < item.cost) {
          e.preventDefault();
          return;
        }
        this.selectedItem = item;
        (e.dataTransfer as DataTransfer).effectAllowed = "move";
        (e.dataTransfer as DataTransfer).setDragImage(new Image(), 0, 0);
      });

      button.addEventListener("dragend", (e) => {
        if ((e.dataTransfer as DataTransfer).dropEffect === "none") {
          this.selectedItem = null;
        }
      });

      this.shopButtons.push({ button, item });
      this.shopEl.appendChild(button);
    }
  }

  updateButtonStates(): void {
    for (const { button, item } of this.shopButtons) {
      button.disabled = gameState.dotCount < item.cost;
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

    gameState.dotCount -= this.selectedItem.cost;

    if (this.selectedItem.kind === "producer") {
      const producer = new Producer(
        gridX,
        gridY,
        this.selectedItem.width,
        this.selectedItem.height,
        gameState.GLOBAL_PHASE
      );
      this.onPlaceProducer(producer);
    } else {
      const consumer = new Consumer(
        gridX,
        gridY,
        this.selectedItem.width,
        this.selectedItem.height,
        gameState.GLOBAL_PHASE
      );
      this.onPlaceConsumer(consumer);
    }

    this.selectedItem = null;
    this.render();
    return true;
  }
}