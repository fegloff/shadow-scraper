import axios from "axios";

// https://api-v2.pendle.finance/core/docs#/Dashboard/DashboardController_getUserPositions
const client = axios.create({
  baseURL: "https://api-v2.pendle.finance"
});

interface PositionValue {
  valuation: number;
  balance: string;
}

interface LPPositionValue extends PositionValue {
  activeBalance: string;
}

export interface PendlePosition {
  marketId: string;
  pt: PositionValue;
  yt: PositionValue;
  lp: LPPositionValue;
}

export interface PendlePositionsInfo {
  chainId: number;
  totalOpen: number;
  totalClosed: number;
  totalSy: number;
  openPositions: PendlePosition[];
  closedPositions: PendlePosition[];
  syPositions: Array<{ syId: string; balance: string }>;
  updatedAt: string;
}

export interface PendleValue {
  usd: number;
  acc: number;
}

export interface PendleRewardAsset {
  id: string;
  chainId: number;
  address: string;
  symbol: string;
  decimals: number;
  expiry: string;
  accentColor: string;
  price: PendleValue;
  priceUpdatedAt: string;
  name: string;
}

export interface PendleEstimatedReward {
  asset: PendleRewardAsset;
  amount: number;
}

export interface PendleMarketDataResponse {
  timestamp: string;

  liquidity: PendleValue;
  tradingVolume: PendleValue;

  underlyingInterestApy: number;
  underlyingRewardApy: number;
  underlyingApy: number;
  impliedApy: number;
  ytFloatingApy: number;
  swapFeeApy: number;
  voterApy: number;
  ptDiscount: number;
  pendleApy: number;
  arbApy: number;
  lpRewardApy: number;
  aggregatedApy: number;
  maxBoostedApy: number;

  estimatedDailyPoolRewards: PendleEstimatedReward[];

  totalPt: number;
  totalSy: number;
  totalLp: number;
  totalActiveSupply: number;

  assetPriceUsd: number;
}

export const getPendlePositions = async (walletAddress: string) => {
  const { data } = await client.get<{
    positions: PendlePositionsInfo[];
  }>(`/core/v1/dashboard/positions/database/${walletAddress}?filterUsd=0.1`);
  return data.positions;
};

export const getPendleMarketData = async (
  marketAddress: string,
  timestampISO?: string
): Promise<PendleMarketDataResponse> => {
  const url = new URL(
    `/core/v2/146/markets/${marketAddress}/data`,
    client.defaults.baseURL
  );
  if (timestampISO) url.searchParams.append("timestamp", timestampISO);

  const { data } = await client.get<PendleMarketDataResponse>(url.toString());
  return data;
};
