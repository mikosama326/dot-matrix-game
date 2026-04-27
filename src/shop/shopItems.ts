import { Consumer, Producer } from "../entities/actor.ts";

type ShopItemBase = {
  id: string;
  name: string;
  width: number;
  height: number;
  cost: number;
};

export type ProducerShopItem = ShopItemBase & {
  kind: "producer";
  createActor: (beginX: number, beginY: number, width: number, height: number, phase: number) => Producer;
};

export type ConsumerShopItem = ShopItemBase & {
  kind: "consumer";
  createActor: (beginX: number, beginY: number, width: number, height: number, phase: number) => Consumer;
};

export type ShopItem = ProducerShopItem | ConsumerShopItem;

const createProducer: ProducerShopItem["createActor"] = (beginX, beginY, width, height, phase) =>
  new Producer(beginX, beginY, width, height, phase);

const createConsumer: ConsumerShopItem["createActor"] = (beginX, beginY, width, height, phase) =>
  new Consumer(beginX, beginY, width, height, phase);

export const SHOP_ITEMS: ShopItem[] = [
  { id: "producer-2x2", name: "Producer", kind: "producer", width: 2, height: 2, cost: 5, createActor: createProducer },
  { id: "consumer-2x2", name: "Consumer", kind: "consumer", width: 2, height: 2, cost: 10, createActor: createConsumer },
  { id: "producer-4x4", name: "Producer", kind: "producer", width: 4, height: 4, cost: 100, createActor: createProducer },
  { id: "consumer-4x4", name: "Consumer", kind: "consumer", width: 4, height: 4, cost: 100, createActor: createConsumer },
  { id: "producer-8x4", name: "Producer", kind: "producer", width: 8, height: 4, cost: 400, createActor: createProducer },
  { id: "consumer-8x4", name: "Consumer", kind: "consumer", width: 8, height: 4, cost: 400, createActor: createConsumer },
  { id: "producer-8x8", name: "Producer", kind: "producer", width: 8, height: 8, cost: 5000, createActor: createProducer },
  { id: "consumer-8x8", name: "Consumer", kind: "consumer", width: 8, height: 8, cost: 5000, createActor: createConsumer },
];
