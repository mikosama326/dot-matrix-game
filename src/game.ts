import { secondsPerTick, TICK_RATE_PROGRESSION } from "./constants.ts";
import { type Producer, type Consumer } from "./entities/actor.ts";

export class GameState {
  dotCount = 20;
  isPaused = false;
  showBounds = false;
  producers: Producer[] = [];
  consumers: Consumer[] = [];
  GLOBAL_PHASE = 0;

  dotsProducedCurrentSecond = 0;
  dotsConsumedCurrentSecond = 0;
  totalDotsProduced = 0;
  totalDotsConsumed = 0;
  dotTick = 1;
  dotProductionRate = 0;
  dotConsumptionRate = 0;

  readonly TICK_RATE = TICK_RATE_PROGRESSION[TICK_RATE_PROGRESSION.length - 1];

  init(): void {
    this.dotCount = 20;
    this.isPaused = false;
    this.showBounds = false;
    this.producers = [];
    this.consumers = [];
    this.GLOBAL_PHASE = 0;
    this.dotsProducedCurrentSecond = 0;
    this.dotsConsumedCurrentSecond = 0;
    this.totalDotsProduced = 0;
    this.totalDotsConsumed = 0;
    this.dotTick = 1;
    this.dotProductionRate = 0;
    this.dotConsumptionRate = 0;
  }

  update(deltaTime: number): void {
    // Update all producers
    for (let i = 0; i < this.producers.length; i++) {
      const dotsProduced = this.producers[i].update(deltaTime);
      this.dotsProducedCurrentSecond += dotsProduced;
      this.totalDotsProduced += dotsProduced;
    }

    // Update all consumers
    for (let i = 0; i < this.consumers.length; i++) {
      const dotsConsumed = this.consumers[i].update(deltaTime);
      this.dotCount += dotsConsumed;
      this.dotsConsumedCurrentSecond += dotsConsumed;
      this.totalDotsConsumed += dotsConsumed;
    }

    this.dotTick -= deltaTime;

    while (this.dotTick <= 0) {
      this.dotProductionRate = this.dotsProducedCurrentSecond;
      this.dotConsumptionRate = this.dotsConsumedCurrentSecond;

      this.dotsProducedCurrentSecond = 0;
      this.dotsConsumedCurrentSecond = 0;

      this.dotTick += secondsPerTick(1);
    }

    this.GLOBAL_PHASE++;
    this.GLOBAL_PHASE %= this.TICK_RATE;
  }
}

export const gameState = new GameState();
