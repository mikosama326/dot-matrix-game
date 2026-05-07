import { type ResearchNode } from "./researchState";

export const RESEARCH_NODES: ResearchNode[] = [
  {
    id: "4x4",
    name: "Bigger (4x4)",
    description: "Broadens the basic frame into larger square producer and consumer cells.",
    cost: {
      totalDots: 120,
      dotsPerSecond: 2,
    },
    unlocks: {
      shopItemIds: ["producer-4x4", "consumer-4x4"],
    },
  },
  {
    id: "wide-frames",
    name: "Wide Frames",
    description: "Unlocks rectangular frames for denser horizontal layouts.",
    cost: {
      totalDots: 450,
      dotsPerSecond: 4,
    },
    prerequisites: ["expanded-frames"],
    unlocks: {
      shopItemIds: ["producer-8x4", "consumer-8x4"],
    },
  },
  {
    id: "circular-flow",
    name: "Circles",
    description: "Turns square frames into looping patterns that cycle through their area.",
    cost: {
      totalDots: 650,
      dotsPerSecond: 5,
    },
    prerequisites: ["expanded-frames"],
    unlocks: {
      shopItemIds: ["circle-producer-4x4", "circle-consumer-4x4"],
    },
  },
  {
    id: "phase-inversion",
    name: "Phase Inversion",
    description: "Reverses the timing path through a frame for new overlap behavior.",
    cost: {
      totalDots: 900,
      dotsPerSecond: 6,
    },
    prerequisites: ["expanded-frames"],
    unlocks: {
      shopItemIds: ["reverse-producer-4x4", "reverse-consumer-4x4"],
    },
  },
  {
    id: "large-matrices",
    name: "Large Matrices",
    description: "Stabilizes full 8x8 fields for high-capacity production and consumption.",
    cost: {
      totalDots: 6000,
      dotsPerSecond: 20,
    },
    prerequisites: ["wide-frames"],
    unlocks: {
      shopItemIds: ["producer-8x8", "consumer-8x8"],
    },
  },
  {
    id: "large-circular-flow",
    name: "Large Circular Flow",
    description: "Scales circular paths into full 8x8 fields.",
    cost: {
      totalDots: 9000,
      dotsPerSecond: 25,
    },
    prerequisites: ["large-matrices", "circular-flow"],
    unlocks: {
      shopItemIds: ["circle-producer-8x8", "circle-consumer-8x8"],
    },
  },
];
