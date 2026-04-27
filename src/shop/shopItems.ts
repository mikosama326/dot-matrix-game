export type BuildKind = "producer" | "consumer";

export type ShopItem = {
  id: string;
  name: string;
  kind: BuildKind;
  width: number;
  height: number;
  cost: number;
};

export const SHOP_ITEMS: ShopItem[] = [
  { id: "producer-2x2", name: "Producer", kind: "producer", width: 2, height: 2, cost: 5 },
  { id: "consumer-2x2", name: "Consumer", kind: "consumer", width: 2, height: 2, cost: 10 },
  { id: "producer-4x4", name: "Producer", kind: "producer", width: 4, height: 4, cost: 100 },
  { id: "consumer-4x4", name: "Consumer", kind: "consumer", width: 4, height: 4, cost: 100 },
  { id: "producer-8x4", name: "Producer", kind: "producer", width: 8, height: 4, cost: 400 },
  { id: "consumer-8x4", name: "Consumer", kind: "consumer", width: 8, height: 4, cost: 400 },
  { id: "producer-8x8", name: "Producer", kind: "producer", width: 8, height: 8, cost: 5000 },
  { id: "consumer-8x8", name: "Consumer", kind: "consumer", width: 8, height: 8, cost: 5000 },
];