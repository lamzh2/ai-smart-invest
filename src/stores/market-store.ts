import { create } from "zustand";
import type { IndexData, StockSpot } from "@/types/market";

interface MarketState {
  indices: IndexData[];
  spotData: StockSpot[];
  isMarketOpen: boolean;
  lastUpdated: Date | null;
  isLoading: boolean;
  setIndices: (indices: IndexData[]) => void;
  setSpotData: (data: StockSpot[]) => void;
  setIsMarketOpen: (open: boolean) => void;
  setLastUpdated: (date: Date) => void;
  setLoading: (loading: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  indices: [],
  spotData: [],
  isMarketOpen: false,
  lastUpdated: null,
  isLoading: false,
  setIndices: (indices) => set({ indices }),
  setSpotData: (spotData) => set({ spotData }),
  setIsMarketOpen: (isMarketOpen) => set({ isMarketOpen }),
  setLastUpdated: (lastUpdated) => set({ lastUpdated }),
  setLoading: (isLoading) => set({ isLoading }),
}));
