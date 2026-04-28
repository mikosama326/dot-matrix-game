import { CircleConsumer, CircleProducer, Consumer, Producer, ReverseConsumer, ReverseProducer } from "../entities/actor.ts";

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

const createCircleProducer: ProducerShopItem["createActor"] = (beginX, beginY, width, height, phase) =>
  new CircleProducer(beginX, beginY, width, height, phase);

const createCircleConsumer: ConsumerShopItem["createActor"] = (beginX, beginY, width, height, phase) =>
  new CircleConsumer(beginX, beginY, width, height, phase);

const createReverseProducer: ProducerShopItem["createActor"] = (beginX, beginY, width, height, phase) =>
  new ReverseProducer(beginX, beginY, width, height, phase);

const createReverseConsumer: ConsumerShopItem["createActor"] = (beginX, beginY, width, height, phase) =>
  new ReverseConsumer(beginX, beginY, width, height, phase);

export const SHOP_ITEMS: ShopItem[] = [
  { id: "producer-2x2", name: "Producer", kind: "producer", width: 2, height: 2, cost: 10, createActor: createProducer },
  { id: "consumer-2x2", name: "Consumer", kind: "consumer", width: 2, height: 2, cost: 10, createActor: createConsumer },
  { id: "producer-4x4", name: "Producer", kind: "producer", width: 4, height: 4, cost: 100, createActor: createProducer },
  { id: "consumer-4x4", name: "Consumer", kind: "consumer", width: 4, height: 4, cost: 100, createActor: createConsumer },
  { id: "circle-producer-4x4", name: "Circle Producer", kind: "producer", width: 4, height: 4, cost: 100, createActor: createCircleProducer },
  { id: "circle-consumer-4x4", name: "Circle Consumer", kind: "consumer", width: 4, height: 4, cost: 100, createActor: createCircleConsumer },
  { id: "reverse-producer-4x4", name: "Reverse Producer", kind: "producer", width: 4, height: 4, cost: 100, createActor: createReverseProducer },
  { id: "reverse-consumer-4x4", name: "Reverse Consumer", kind: "consumer", width: 4, height: 4, cost: 100, createActor: createReverseConsumer },
  { id: "producer-8x4", name: "Producer", kind: "producer", width: 8, height: 4, cost: 400, createActor: createProducer },
  { id: "consumer-8x4", name: "Consumer", kind: "consumer", width: 8, height: 4, cost: 400, createActor: createConsumer },
  { id: "producer-8x8", name: "Producer", kind: "producer", width: 8, height: 8, cost: 5000, createActor: createProducer },
  { id: "consumer-8x8", name: "Consumer", kind: "consumer", width: 8, height: 8, cost: 5000, createActor: createConsumer },
  { id: "circle-producer-8x8", name: "Circle Producer", kind: "producer", width: 8, height: 8, cost: 5000, createActor: createCircleProducer },
  { id: "circle-consumer-8x8", name: "Circle Consumer", kind: "consumer", width: 8, height: 8, cost: 5000, createActor: createCircleConsumer },
];
