import { type ResearchNode } from "./researchState";

export const RESEARCH_NODES: ResearchNode[] = [
  {
    id: "4x4",
    name: "Bigger (4x4)",
    description: "Bigger producers and consumers.",
    cost: {
      totalDots: 120,
      dotsPerSecond: 2,
    },
    unlocks: {
      shopItemIds: ["producer-4x4", "consumer-4x4"],
    },
  },
  {
    id: "8x4",
    name: "Rectangle (8x4)",
    description: "Whoa. A rectangle. Crazy.",
    cost: {
      totalDots: 450,
      dotsPerSecond: 4,
    },
    prerequisites: ["4x4"],
    unlocks: {
      shopItemIds: ["producer-8x4", "consumer-8x4"],
    },
  },
  {
    id: "circle-4x4",
    name: "Circle (4x4)",
    description: "Draw a circle of dots.",
    cost: {
      totalDots: 650,
      dotsPerSecond: 5,
    },
    prerequisites: ["4x4"],
    unlocks: {
      shopItemIds: ["circle-producer-4x4", "circle-consumer-4x4"],
    },
  },
  {
    id: "reverse",
    name: "Reverse",
    description: "Take it back now ya'll",
    cost: {
      totalDots: 900,
      dotsPerSecond: 6,
    },
    prerequisites: ["4x4"],
    unlocks: {
      shopItemIds: ["reverse-producer-4x4", "reverse-consumer-4x4"],
    },
  },
  {
    id: "8x8",
    name: "Even Bigger (8x8)",
    description: "Yeah. They're even bigger!",
    cost: {
      totalDots: 6000,
      dotsPerSecond: 20,
    },
    prerequisites: ["8x4"],
    unlocks: {
      shopItemIds: ["producer-8x8", "consumer-8x8"],
    },
  },
  {
    id: "circle-8x8",
    name: "Bigger Circle (8x8)",
    description: "A bigger circle.",
    cost: {
      totalDots: 9000,
      dotsPerSecond: 25,
    },
    prerequisites: ["8x8", "circle-4x4"],
    unlocks: {
      shopItemIds: ["circle-producer-8x8", "circle-consumer-8x8"],
    },
  },
];
