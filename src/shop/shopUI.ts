import { SHOP_ITEMS } from "./shopItems.ts";
import { type ShopItem } from "./shopItems.ts";
import { TICK_RATE_PROGRESSION, UPGRADE_TICK_RATE_COST } from "../constants.ts";
import { gameState } from "../game.ts";
import { grid } from "../grid.ts";
import { RESEARCH_NODES } from "../research/researchItems.ts";
import { type ResearchNode } from "../research/researchState.ts";

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

type ResearchEntry = {
  node: ResearchNode;
  card: HTMLDivElement;
  status: HTMLSpanElement;
  progressFill: HTMLDivElement;
  progressText: HTMLSpanElement;
  actionButton: HTMLButtonElement;
};

type ShopTab = "shop" | "research";

export class ShopUI {
  selectedItem: SelectedShopItem | null = null;
  shopEntries: ShopEntry[] = [];
  researchEntries: ResearchEntry[] = [];

  private shopEl: HTMLDivElement;
  private activeTab: ShopTab = "shop";
  private selectedLevels = new Map<string, number>();

  constructor(shopEl: HTMLDivElement) {
    this.shopEl = shopEl;
  }

  render(): void {
    this.shopEl.innerHTML = "";
    this.shopEntries = [];
    this.researchEntries = [];

    const tabs = document.createElement("div");
    tabs.className = "shop-tabs";

    const shopTabButton = this.createTabButton("Shop", "shop");
    const researchTabButton = this.createTabButton("Research", "research");
    tabs.append(shopTabButton, researchTabButton);

    const panels = document.createElement("div");
    panels.className = "shop-tab-panels";

    const shopPanel = document.createElement("div");
    shopPanel.className = "shop-tab-panel";
    shopPanel.dataset.tabPanel = "shop";

    const researchPanel = document.createElement("div");
    researchPanel.className = "shop-tab-panel research-panel";
    researchPanel.dataset.tabPanel = "research";

    this.shopEl.append(tabs, panels);
    panels.append(shopPanel, researchPanel);

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

      placeButton.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse") return;

        if (!this.selectItemForPlacement(item)) return;

        e.preventDefault();
      });

      placeButton.addEventListener("dragstart", (e) => {
        if (!this.selectItemForPlacement(item)) {
          e.preventDefault();
          return;
        }

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
      shopPanel.appendChild(row);

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

    this.renderResearchPanel(researchPanel);
    this.updateActiveTab();
    this.updateButtonStates();
  }

  updateButtonStates(): void {
    for (const entry of this.shopEntries) {
      const level = this.getSelectedLevel(entry.item.id);
      const cost = this.getPlacementCost(entry.item, level);
      const tickRate = TICK_RATE_PROGRESSION[level];
      const isUnlocked = gameState.researchSystem.isItemUnlocked(entry.item.id);

      entry.itemName.textContent = `${entry.item.name} ${entry.item.width}x${entry.item.height}`;
      entry.itemCost.textContent = isUnlocked ? `${cost} dots` : "Locked";
      entry.placeButton.disabled = !isUnlocked || gameState.dotCount < cost;
      entry.levelText.textContent = `Lv ${level + 1}`;
      entry.speedText.textContent = `${tickRate}/s`;
      entry.minusButton.disabled = !isUnlocked || level <= 0;
      entry.plusButton.disabled = !isUnlocked || level >= TICK_RATE_PROGRESSION.length - 1;
      entry.placeButton.classList.toggle("selected", this.selectedItem?.item.id === entry.item.id);
      entry.placeButton.classList.toggle("locked", !isUnlocked);
    }

    this.updateResearchStates();
  }

  cancelSelection(): void {
    this.selectedItem = null;
    this.updateButtonStates();
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
      this.cancelSelection();
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

  private selectItemForPlacement(item: ShopItem): boolean {
    const level = this.getSelectedLevel(item.id);
    const cost = this.getPlacementCost(item, level);

    if (!gameState.researchSystem.isItemUnlocked(item.id) || gameState.dotCount < cost) {
      this.cancelSelection();
      return false;
    }

    this.selectedItem = {
      item,
      level,
      cost,
      width: item.width,
      height: item.height,
    };
    this.updateButtonStates();
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

  private createTabButton(label: string, tab: ShopTab): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "shop-tab-btn";
    button.type = "button";
    button.textContent = label;
    button.dataset.tab = tab;

    button.addEventListener("click", () => {
      this.activeTab = tab;
      this.cancelSelection();
      this.updateActiveTab();
    });

    return button;
  }

  private updateActiveTab(): void {
    const tabButtons = this.shopEl.querySelectorAll<HTMLButtonElement>(".shop-tab-btn");
    const panels = this.shopEl.querySelectorAll<HTMLDivElement>(".shop-tab-panel");

    for (const button of tabButtons) {
      button.classList.toggle("active", button.dataset.tab === this.activeTab);
    }

    for (const panel of panels) {
      panel.hidden = panel.dataset.tabPanel !== this.activeTab;
    }
  }

  private renderResearchPanel(panel: HTMLDivElement): void {
    const tree = document.createElement("div");
    tree.className = "research-tree";

    for (const researchNode of RESEARCH_NODES) {
      const card = document.createElement("div");
      card.className = "research-node";

      const title = document.createElement("div");
      title.className = "research-node-title";

      const name = document.createElement("span");
      name.textContent = researchNode.name;

      const status = document.createElement("span");
      status.className = "research-node-status";

      title.append(name, status);

      const description = document.createElement("div");
      description.className = "research-node-description";
      description.textContent = researchNode.description ?? "";

      const meta = document.createElement("div");
      meta.className = "research-node-meta";
      meta.textContent = this.getResearchMetaText(researchNode);

      const progress = document.createElement("div");
      progress.className = "research-progress";

      const progressFill = document.createElement("div");
      progressFill.className = "research-progress-fill";
      progress.appendChild(progressFill);

      const footer = document.createElement("div");
      footer.className = "research-node-footer";

      const progressText = document.createElement("span");
      progressText.className = "research-progress-text";

      const actionButton = document.createElement("button");
      actionButton.className = "research-start-btn";
      actionButton.type = "button";
      actionButton.addEventListener("click", () => {
        if (gameState.researchSystem.start(researchNode.id)) {
          this.updateButtonStates();
        }
      });

      footer.append(progressText, actionButton);
      card.append(title, description, meta, progress, footer);
      tree.appendChild(card);

      this.researchEntries.push({
        node: researchNode,
        card,
        status,
        progressFill,
        progressText,
        actionButton,
      });
    }

    panel.appendChild(tree);
  }

  private updateResearchStates(): void {
    const activeNode = gameState.researchSystem.getActiveNode();

    for (const entry of this.researchEntries) {
      const isCompleted = gameState.researchSystem.isCompleted(entry.node.id);
      const isActive = activeNode?.id === entry.node.id;
      const isAvailable = gameState.researchSystem.isAvailable(entry.node.id);
      const isBlocked = !isCompleted && !isActive && !isAvailable;
      const progress = gameState.researchSystem.getProgress(entry.node.id);
      const progressRatio = gameState.researchSystem.getProgressRatio(entry.node.id);
      const total = entry.node.cost.totalDots;

      entry.card.classList.toggle("completed", isCompleted);
      entry.card.classList.toggle("active", isActive);
      entry.card.classList.toggle("available", isAvailable);
      entry.card.classList.toggle("blocked", isBlocked);

      entry.status.textContent = this.getResearchStatusText(entry.node);
      entry.progressFill.style.width = `${Math.round(progressRatio * 100)}%`;
      entry.progressText.textContent = total <= 0 ? "Complete" : `${progress} / ${total} dots`;

      if (isCompleted) {
        entry.actionButton.textContent = "Complete";
        entry.actionButton.disabled = true;
      } else if (isActive) {
        entry.actionButton.textContent = "Researching";
        entry.actionButton.disabled = true;
      } else if (isAvailable) {
        entry.actionButton.textContent = activeNode ? "Busy" : "Start";
        entry.actionButton.disabled = activeNode !== undefined;
      } else {
        entry.actionButton.textContent = "Locked";
        entry.actionButton.disabled = true;
      }
    }
  }

  private getResearchStatusText(node: ResearchNode): string {
    if (gameState.researchSystem.isCompleted(node.id)) return "Complete";
    if (gameState.researchSystem.activeNodeID === node.id) return "Active";
    if (gameState.researchSystem.isAvailable(node.id)) return "Available";
    return "Locked";
  }

  private getResearchMetaText(node: ResearchNode): string {
    const parts = [`Cost: ${node.cost.totalDots} dots`, `Rate: ${node.cost.dotsPerSecond}/tick`];
    const prerequisites = node.prerequisites ?? [];
    const unlockedItems = node.unlocks?.shopItemIds ?? [];

    if (prerequisites.length > 0) {
      parts.push(`Requires: ${prerequisites.map((id) => this.getResearchLabel(id)).join(", ")}`);
    }

    if (unlockedItems.length > 0) {
      parts.push(`Unlocks: ${unlockedItems.map((id) => this.getItemLabel(id)).join(", ")}`);
    }

    return parts.join(" | ");
  }

  private getResearchLabel(nodeId: string): string {
    const node = RESEARCH_NODES.find((researchNode) => researchNode.id === nodeId);

    return node?.name ?? nodeId;
  }

  private getItemLabel(itemId: string): string {
    const item = SHOP_ITEMS.find((shopItem) => shopItem.id === itemId);

    return item ? `${item.name} ${item.width}x${item.height}` : itemId;
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
