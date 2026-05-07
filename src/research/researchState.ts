import { type GameState } from "../game";
import { SHOP_ITEMS } from "../shop/shopItems";
import { RESEARCH_NODES } from "./researchItems";

export type ResearchNode = {
  id: string;
  name: string;
  description?: string;
  cost: {
    totalDots: number;
    dotsPerSecond: number;
  }
  prerequisites?: string[];
  unlocks?: {
    shopItemIds?: string[];
    features?: string[];
  };
};

export class ResearchSystem
{
    activeNodeID: string | null = null;
    completedNodeIds = new Set<string>();
    progressByNodeId = new Map<string, number>();
    unlockedShopItems = new Set<string>();
    
    constructor()
    {
        const researchUnlockedShopItems = new Set<string>();

        for (const node of RESEARCH_NODES) {
            for (const shopItemId of node.unlocks?.shopItemIds ?? []) {
                researchUnlockedShopItems.add(shopItemId);
            }
        }

        for (const item of SHOP_ITEMS) {
            if (!researchUnlockedShopItems.has(item.id)) {
                this.unlockedShopItems.add(item.id);
            }
        }
    }

    start(nodeId: string): boolean
    {
        if (this.activeNodeID !== null) return false;
        if (!this.isAvailable(nodeId)) return false;

        this.activeNodeID = nodeId;
        this.progressByNodeId.set(nodeId, this.getProgress(nodeId));
        return true;
    }

    update(gameState: GameState)
    {
        if (this.activeNodeID === null) return;

        const node = this.getNode(this.activeNodeID);
        if (!node || this.isCompleted(node.id)) {
            this.activeNodeID = null;
            return;
        }

        const progress = this.getProgress(node.id);
        const remainingCost = node.cost.totalDots - progress;

        if (remainingCost <= 0) {
            this.completeResearch(node.id);
            this.activeNodeID = null;
            return;
        }

        if (node.cost.dotsPerSecond <= 0) return;

        // check for stalled research
        if (gameState.dotCount <= 0) return;
        if(node.cost.dotsPerSecond > gameState.dotCount) return;

        const dotsSpent = Math.min(node.cost.dotsPerSecond, remainingCost, gameState.dotCount);
        gameState.dotCount -= dotsSpent;

        const nextProgress = progress + dotsSpent;
        this.progressByNodeId.set(node.id, nextProgress);

        if (nextProgress >= node.cost.totalDots) {
            this.completeResearch(node.id);
            this.activeNodeID = null;
        }
    }

    completeResearch(nodeId: string)
    {
        if (this.isCompleted(nodeId)) return;

        this.completedNodeIds.add(nodeId);

        // unlock items in the node also
        const node = this.getNode(nodeId);
        if (node?.unlocks?.shopItemIds) {
            for (const shopItemId of node.unlocks.shopItemIds) {
                this.unlockedShopItems.add(shopItemId);
            }
        }

        if (node) {
            this.progressByNodeId.set(node.id, node.cost.totalDots);
        }
    }

    isAvailable(nodeId: string): boolean
    {
        const node = this.getNode(nodeId);
        if (!node) return false;
        if (this.isCompleted(node.id)) return false;

        return (node.prerequisites ?? []).every((prerequisiteId) => this.isCompleted(prerequisiteId));
    }

    isCompleted(nodeId: string): boolean
    {
        return this.completedNodeIds.has(nodeId);
    }

    isItemUnlocked(shopItemId: string): boolean
    {
        return this.unlockedShopItems.has(shopItemId);
    }

    getActiveNode(): ResearchNode | undefined
    {
        return this.activeNodeID === null ? undefined : this.getNode(this.activeNodeID);
    }

    getNode(nodeId: string): ResearchNode | undefined
    {
        return RESEARCH_NODES.find((node) => node.id === nodeId);
    }

    getProgress(nodeId: string): number
    {
        return this.progressByNodeId.get(nodeId) ?? 0;
    }

    getProgressRatio(nodeId: string): number
    {
        const node = this.getNode(nodeId);
        if (!node) return 0;
        if (node.cost.totalDots <= 0) return this.isCompleted(nodeId) ? 1 : 0;

        return Math.min(1, this.getProgress(nodeId) / node.cost.totalDots);
    }
}
