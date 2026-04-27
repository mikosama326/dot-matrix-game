import { TICK_RATE_PROGRESSION, UPGRADE_TICK_RATE_COST } from "../constants.ts";
import { type Consumer, type Producer } from "../entities/actor.ts";
import { gameState } from "../game.ts";

type Entity =
  | { type: "producer"; entity: Producer; index: number }
  | { type: "consumer"; entity: Consumer; index: number };

export class ContextMenu {
  private hideTimeout: number | null = null;
  private readonly panel: HTMLDivElement;
  private readonly anchorElement: HTMLElement;

  constructor(
    panel: HTMLDivElement,
    anchorElement: HTMLElement
  ) {
    this.panel = panel;
    this.anchorElement = anchorElement;

    this.panel.addEventListener("mouseenter", () => {
      this.cancelHide();
    });

    this.panel.addEventListener("mouseleave", () => {
      this.scheduleHide();
    });
  }

  showForCell(gridX: number, gridY: number, screenX: number, screenY: number): void {
    const entities = this.getEntitiesAtGridCell(gridX, gridY);

    if (entities.length === 0) {
      this.scheduleHide();
      return;
    }

    this.show(entities, screenX, screenY);
  }

  scheduleHide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = setTimeout(() => {
      this.hide();
      this.hideTimeout = null;
    }, 120);
  }

  private cancelHide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  private hide(): void {
    this.panel.style.display = "none";
  }

  private show(entities: Entity[], screenX: number, screenY: number): void {
    this.panel.innerHTML = this.renderEntities(entities);
    this.panel.style.display = "block";
    this.positionAt(screenX, screenY);
    this.cancelHide();
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

        return `
          <div class="entity-info">
            <div class="entity-header">${typeName} #${idx + 1}</div>
            <div class="entity-details">
              <div>Speed: ${currentTickRate}/s ${canUpgrade ? `-> ${nextTickRate}/s` : "(max)"}</div>
              <button class="upgrade-btn" data-entity-type="${entity.type}" data-entity-index="${entity.index}" ${upgradeDisabled ? "disabled" : ""}>
                Upgrade (${upgradeCost} dots)
              </button>
              <button class="delete-btn" data-entity-type="${entity.type}" data-entity-index="${entity.index}">Delete</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  private positionAt(screenX: number, screenY: number): void {
    const anchorRect = this.anchorElement.getBoundingClientRect();
    const offsetX = 8;
    const offsetY = 8;

    this.panel.style.left = `${screenX - anchorRect.left + offsetX}px`;
    this.panel.style.top = `${screenY - anchorRect.top + offsetY}px`;
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

        if (entityType === "producer") {
          gameState.producers.splice(entityIndex, 1);
        } else {
          gameState.consumers.splice(entityIndex, 1);
        }

        this.hide();
      });
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
}
