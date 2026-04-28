import { TICK_RATE_PROGRESSION, UPGRADE_TICK_RATE_COST } from "../constants.ts";
import { type Consumer, type Producer } from "../entities/actor.ts";
import { gameState } from "../game.ts";
import { SHOP_ITEMS } from "../shop/shopItems.ts";

type Entity =
  | { type: "producer"; entity: Producer; index: number }
  | { type: "consumer"; entity: Consumer; index: number };

export class ContextMenu {
  private isPinned = false;
  private currentEntities: Entity[] = [];
  private readonly panel: HTMLDivElement;
  private readonly anchorElement: HTMLElement;

  constructor(
    panel: HTMLDivElement,
    anchorElement: HTMLElement
  ) {
    this.panel = panel;
    this.anchorElement = anchorElement;

    this.panel.addEventListener("mouseleave", () => {
      this.hideIfUnpinned();
    });
  }

  showForCell(gridX: number, gridY: number, screenX: number, screenY: number): boolean {
    if (this.isPinned) {
      return true;
    }

    const entities = this.getEntitiesAtGridCell(gridX, gridY);

    if (entities.length === 0) {
      this.hideIfUnpinned();
      return false;
    }

    this.show(entities, screenX, screenY);
    return true;
  }

  refresh(): void {
    if (this.panel.style.display === "none" || this.currentEntities.length === 0) {
      return;
    }

    this.updateUpgradeButtons();
  }

  pinForCell(gridX: number, gridY: number, screenX: number, screenY: number): boolean {
    const entities = this.getEntitiesAtGridCell(gridX, gridY);

    if (entities.length === 0) {
      this.dismiss();
      return false;
    }

    this.isPinned = true;
    this.show(entities, screenX, screenY);
    this.panel.classList.add("pinned");
    return true;
  }

  hideIfUnpinned(): void {
    if (this.isPinned) {
      return;
    }

    this.hide();
  }

  dismiss(): void {
    this.isPinned = false;
    this.panel.classList.remove("pinned");
    this.hide();
  }

  containsTarget(target: EventTarget | null): boolean {
    return target instanceof Node && this.panel.contains(target);
  }

  private hide(): void {
    this.panel.style.display = "none";
    this.currentEntities = [];
  }

  private show(entities: Entity[], screenX: number, screenY: number): void {
    this.currentEntities = entities;
    this.panel.innerHTML = this.renderEntities(entities);
    this.panel.style.display = "block";
    this.positionAt(screenX, screenY);
    this.bindActionButtons(entities, screenX, screenY);
  }

  private getEntitiesAtGridCell(gridX: number, gridY: number): Entity[] {
    const entities: Entity[] = [];

    for (let i = 0; i < gameState.producers.length; i++) {
      const producer = gameState.producers[i];
      if (this.containsCell(producer, gridX, gridY)) {
        entities.push({ type: "producer", entity: producer, index: i });
      }
    }

    for (let i = 0; i < gameState.consumers.length; i++) {
      const consumer = gameState.consumers[i];
      if (this.containsCell(consumer, gridX, gridY)) {
        entities.push({ type: "consumer", entity: consumer, index: i });
      }
    }

    return entities;
  }

  private containsCell(entity: Producer | Consumer, gridX: number, gridY: number): boolean {
    return (
      gridX >= entity.beginX &&
      gridX < entity.beginX + entity.width &&
      gridY >= entity.beginY &&
      gridY < entity.beginY + entity.height
    );
  }

  private renderEntities(entities: Entity[]): string {
    return entities
      .map((entity, idx) => {
        const typeName = entity.type === "producer" ? "Producer" : "Consumer";
        const currentTickRate = TICK_RATE_PROGRESSION[entity.entity.currentTickRateIndex];
        const nextTickRateIndex = entity.entity.currentTickRateIndex + 1;
        const canUpgrade = nextTickRateIndex < TICK_RATE_PROGRESSION.length;
        const nextTickRate = canUpgrade ? TICK_RATE_PROGRESSION[nextTickRateIndex] : currentTickRate;
        const upgradeCost = UPGRADE_TICK_RATE_COST[entity.entity.currentTickRateIndex];
        const upgradeDisabled = !canUpgrade || gameState.dotCount < upgradeCost;
        const refundValue = this.getRefundValue(entity);

        return `
          <div class="entity-info">
            <div class="entity-header">${typeName} #${idx + 1}</div>
            <div class="entity-details">
              <div>Speed: ${currentTickRate}/s ${canUpgrade ? `-> ${nextTickRate}/s` : "(max)"}</div>
              <button class="upgrade-btn" data-entity-type="${entity.type}" data-entity-index="${entity.index}" ${upgradeDisabled ? "disabled" : ""}>
                Upgrade (${upgradeCost} dots)
              </button>
              <button class="delete-btn" data-entity-type="${entity.type}" data-entity-index="${entity.index}">Delete (+${refundValue} dots)</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  private positionAt(screenX: number, screenY: number): void {
    const anchorRect = this.anchorElement.getBoundingClientRect();
    const panelRect = this.panel.getBoundingClientRect();
    const offsetX = 8;
    const offsetY = 8;
    const padding = 8;

    let left = screenX - anchorRect.left + offsetX;
    let top = screenY - anchorRect.top + offsetY;

    const maxLeft = anchorRect.width - panelRect.width - padding;
    const maxTop = anchorRect.height - panelRect.height - padding;

    if (left > maxLeft) {
      left = screenX - anchorRect.left - panelRect.width - offsetX;
    }

    if (top > maxTop) {
      top = screenY - anchorRect.top - panelRect.height - offsetY;
    }

    left = Math.max(padding, Math.min(left, maxLeft));
    top = Math.max(padding, Math.min(top, maxTop));

    this.panel.style.left = `${left}px`;
    this.panel.style.top = `${top}px`;
  }

  private bindActionButtons(entities: Entity[], screenX: number, screenY: number): void {
    this.panel.querySelectorAll(".upgrade-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entityType = (btn as HTMLButtonElement).dataset.entityType as "producer" | "consumer";
        const entityIndex = Number((btn as HTMLButtonElement).dataset.entityIndex);

        this.upgradeEntity(entityType, entityIndex);
        this.show(entities, screenX, screenY);
      });
    });

    this.panel.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entityType = (btn as HTMLButtonElement).dataset.entityType as "producer" | "consumer";
        const entityIndex = Number((btn as HTMLButtonElement).dataset.entityIndex);

        this.deleteEntity(entityType, entityIndex);
        this.dismiss();
      });
    });
  }

  private deleteEntity(entityType: "producer" | "consumer", entityIndex: number): void {
    if (entityType === "producer") {
      const entity = gameState.producers[entityIndex];
      if (!entity) return;

      gameState.dotCount += this.getRefundValue({ type: entityType, entity, index: entityIndex });
      gameState.producers.splice(entityIndex, 1);
    } else {
      const entity = gameState.consumers[entityIndex];
      if (!entity) return;

      gameState.dotCount += this.getRefundValue({ type: entityType, entity, index: entityIndex });
      gameState.consumers.splice(entityIndex, 1);
    }
  }

  private updateUpgradeButtons(): void {
    this.panel.querySelectorAll(".upgrade-btn").forEach((btn) => {
      const button = btn as HTMLButtonElement;
      const entityType = button.dataset.entityType as "producer" | "consumer";
      const entityIndex = Number(button.dataset.entityIndex);
      const entity =
        entityType === "producer"
          ? gameState.producers[entityIndex]
          : gameState.consumers[entityIndex];

      if (!entity) {
        button.disabled = true;
        return;
      }

      const nextTickRateIndex = entity.currentTickRateIndex + 1;
      const canUpgrade = nextTickRateIndex < TICK_RATE_PROGRESSION.length;
      const upgradeCost = UPGRADE_TICK_RATE_COST[entity.currentTickRateIndex];

      button.disabled = !canUpgrade || gameState.dotCount < upgradeCost;
      button.textContent = `Upgrade (${upgradeCost} dots)`;
    });
  }

  private upgradeEntity(entityType: "producer" | "consumer", entityIndex: number): void {
    const entity =
      entityType === "producer"
        ? gameState.producers[entityIndex]
        : gameState.consumers[entityIndex];

    if (!entity) return;

    const upgradeCost = UPGRADE_TICK_RATE_COST[entity.currentTickRateIndex];
    if (gameState.dotCount < upgradeCost) return;

    gameState.dotCount -= upgradeCost;
    entity.upgradeTickRate();
  }

  private getRefundValue(entity: Entity): number {
    let refundValue = this.getBaseCost(entity);

    for (let i = 0; i < entity.entity.currentTickRateIndex; i++) {
      refundValue += UPGRADE_TICK_RATE_COST[i];
    }

    return refundValue;
  }

  private getBaseCost(entity: Entity): number {
    const matchingShopItem = SHOP_ITEMS.find(
      (item) =>
        item.kind === entity.type &&
        item.width === entity.entity.width &&
        item.height === entity.entity.height
    );

    return matchingShopItem?.cost ?? 0;
  }
}
