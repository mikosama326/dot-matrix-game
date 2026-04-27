import { TICK_RATE_PROGRESSION, secondsPerTick } from "../constants.ts";
import { grid } from "../grid.ts";

export class Actor {
  beginX : number;
  beginY : number;
  width : number;
  height : number;
  currentTickRateIndex : number;
  protected currentX: number;
  protected currentY: number;
  protected tickCounter: number;
  protected phase: number;

  constructor(beginX:number, beginY:number, width:number, height:number, phase: number)
  {
    this.beginX = beginX;
    this.beginY = beginY;
    this.width = width;
    this.height = height;

    this.currentX = beginX;
    this.currentY = beginY;
    this.currentTickRateIndex = 0;
    this.tickCounter = 0;
    this.phase = phase;
  }

  reset()
  {
    this.currentX = this.beginX;
    this.currentY = this.beginY;
  }

  upgradeTickRate()
  {
    if(this.currentTickRateIndex < TICK_RATE_PROGRESSION.length - 1)
    {
      this.currentTickRateIndex++;
    }
    this.tickCounter = secondsPerTick(TICK_RATE_PROGRESSION[this.currentTickRateIndex]);
  }

  setTickRateIndex(tickRateIndex: number)
  {
    this.currentTickRateIndex = Math.max(
      0,
      Math.min(tickRateIndex, TICK_RATE_PROGRESSION.length - 1)
    );
    this.tickCounter = secondsPerTick(TICK_RATE_PROGRESSION[this.currentTickRateIndex]);
  }
}

export class Producer extends Actor {
  
  constructor(beginX:number, beginY:number, width:number, height:number, phase: number)
  {
    super(beginX, beginY, width, height, phase);
  }
  
  update(deltaTime: number)
  {
    let dotsProduced = 0;
    this.tickCounter -= deltaTime;

    while (this.tickCounter <= 0) {
      dotsProduced += this.update_internal();
      this.tickCounter += secondsPerTick(TICK_RATE_PROGRESSION[this.currentTickRateIndex]);
    }
    return dotsProduced;
  }

  update_internal() : number
  {
    let dotsProduced = 0;
    if(grid.get(this.currentX,this.currentY) === 0)
    {
      grid.set(this.currentX, this.currentY, 1);
      dotsProduced++;
    }

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
    return dotsProduced;
  }
}

export class Consumer extends Actor {

  constructor(beginX:number, beginY:number, width:number, height:number, phase: number)
  {
    super(beginX, beginY, width, height, phase);
  }

  update(deltaTime: number) : number
  {
    let dotsConsumed = 0;
    this.tickCounter -= deltaTime;

    while (this.tickCounter <= 0) {
      this.tickCounter += secondsPerTick(TICK_RATE_PROGRESSION[this.currentTickRateIndex]);
      dotsConsumed += this.update_internal();
    }
    return dotsConsumed;
  }

  private update_internal() : number
  {
    let dotsConsumed = 0;
    if(grid.get(this.currentX,this.currentY) > 0)
    {
      dotsConsumed++;
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
    return dotsConsumed;
  }
}
