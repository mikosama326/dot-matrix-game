export class Grid {
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

import { GRID_WIDTH,GRID_HEIGHT } from "./constants";
export const grid = new Grid(GRID_WIDTH, GRID_HEIGHT);