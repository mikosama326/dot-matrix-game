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

  update_internal() : number
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

export class CircleProducer extends Producer {
  constructor(beginX:number, beginY:number, width:number, height:number, phase: number)
  {
    super(beginX, beginY, width, height, phase);
  }

  update_internal() : number
  {
    let dotsProduced = 0;

    this.advanceToNextCircleCell();

    if (grid.get(this.currentX, this.currentY) === 0) {
      grid.set(this.currentX, this.currentY, 1);
      dotsProduced++;
    }

    this.advanceScanline();

    return dotsProduced;
  }

  private advanceToNextCircleCell(): void
  {
    while (!isCellInCircle(this.currentX - this.beginX, this.currentY - this.beginY, this.width)) {
      this.advanceScanline();
    }
  }

  private advanceScanline(): void 
  {
    this.currentX++;

    if (this.currentX >= this.beginX + this.width) 
    {
      this.currentX = this.beginX;
      this.currentY++;

      if (this.currentY >= this.beginY + this.height) 
      {
        this.reset();
      }
    }
  }
}

export class CircleConsumer extends Consumer {

  constructor(beginX:number, beginY:number, width:number, height:number, phase: number)
  {
    super(beginX, beginY, width, height, phase);
  }

  update_internal() : number
  {
    let dotsConsumed = 0;

    this.advanceToNextCircleCell();

    if (grid.get(this.currentX, this.currentY) === 1) {
      grid.set(this.currentX, this.currentY, 0);
      dotsConsumed++;
    }

    this.advanceScanline();

    return dotsConsumed;
  }

  private advanceToNextCircleCell(): void
  {
    while (!isCellInCircle(this.currentX - this.beginX, this.currentY - this.beginY, this.width)) {
      this.advanceScanline();
    }
  }

  private advanceScanline(): void 
  {
    this.currentX++;

    if (this.currentX >= this.beginX + this.width) 
    {
      this.currentX = this.beginX;
      this.currentY++;

      if (this.currentY >= this.beginY + this.height) 
      {
        this.reset();
      }
    }
  }
}

export class ReverseProducer extends Producer {
  constructor(beginX:number, beginY:number, width:number, height:number, phase: number)
  {
    super(beginX, beginY, width, height, phase);
    this.currentX = this.beginX + this.width - 1;
    this.currentY = this.beginY + this.height - 1;
  }

  reset(): void {
    this.currentX = this.beginX + this.width - 1;
    this.currentY = this.beginY + this.height - 1;
  }

  update_internal() : number
  {
    let dotsProduced = 0;
    if(grid.get(this.currentX,this.currentY) === 0)
    {
      grid.set(this.currentX, this.currentY, 1);
      dotsProduced++;
    }

    this.currentX--;
    if(this.currentX < this.beginX)
    {
      this.currentX = this.beginX + this.width - 1;
      this.currentY--;
      if(this.currentY < this.beginY)
      {
        this.reset();
      }
    }
    return dotsProduced;
  }
}

export class ReverseConsumer extends Consumer {
  constructor(beginX:number, beginY:number, width:number, height:number, phase: number)
  {
    super(beginX, beginY, width, height, phase);
    this.currentX = this.beginX + this.width - 1;
    this.currentY = this.beginY + this.height - 1;
  }

  reset(): void {
    this.currentX = this.beginX + this.width - 1;
    this.currentY = this.beginY + this.height - 1;
  }

  update_internal() : number
  {
    let dotsConsumed = 0;
    if(grid.get(this.currentX,this.currentY) === 1)
    {
      grid.set(this.currentX, this.currentY, 0);
      dotsConsumed++;
    }

    this.currentX--;
    if(this.currentX < this.beginX)
    {
      this.currentX = this.beginX + this.width - 1;
      this.currentY--;
      if(this.currentY < this.beginY)
      {
        this.reset();
      }
    }
    return dotsConsumed;
  }
}

function isCellInCircle(localX: number, localY: number, size: number): boolean 
{
  const center = (size - 1) / 2;

  const dx = localX - center;
  const dy = localY - center;

  // +0.5 makes edge cells a little more generous so small circles look nicer.
  const radius = size / 2;

  return dx * dx + dy * dy <= radius * radius;
}
