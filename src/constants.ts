// Grid dimensions
export const GRID_WIDTH = 48;
export const GRID_HEIGHT = 32;

// Simulation
export const TICK_RATE_PROGRESSION = [2, 5, 10, 20, 30, 60];
export const UPGRADE_TICK_RATE_COST = [50, 100, 200, 500, 1000, 2000];

export function secondsPerTick(tickRate: number): number {
  return 1 / tickRate;
}