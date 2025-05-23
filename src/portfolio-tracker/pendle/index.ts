import { ethers } from "ethers";
import moment from "moment";
import Decimal from "decimal.js";

import { PortfolioItem } from "../types";
import { portfolioItemFactory, roundToSignificantDigits, calculateAPR, calculateDaysDifference } from "../helpers";
import { getTokenPrice } from "../../api/coingecko";
import { getPendleMarketData, getPendlePositions } from "../../api/pendle";
import pendleMarketABI from "../../abi/PendleMarketV3.json";
import pendleRouterABI from "../../abi/PendleRouterV4.json";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
const routerAddress = "0x888888888889758f76e7103c6cbf23abbf58f946";
const rewardTokenAddress = "0xf1ef7d2d4c0c881cd634481e0586ed5d2871a74b";
const rewardTokenSymbol = "pendle";

const markets = [
  {
    name: "aUSDC",
    marketAddress: "0x3f5ea53d1160177445b1898afbb16da111182418",
    ptAddress: "0x930441Aa7Ab17654dF5663781CA0C02CC17e6643"
  },
  {
    name: "USDC (Silo-20)",
    marketAddress: "0xacfad541698437f6ef0e728c56a50ce35c73cc3e",
    ptAddress: "0x77d8f09053c28faf1e00df6511b23125d438616f"
  }
];

export const getPendleInfo = async (wallet: string): Promise<PortfolioItem[]> => {
    const results: PortfolioItem[] = [];
  
    for (const { name, marketAddress, ptAddress } of markets) {
      try {
        const [lp, pt] = await Promise.all([
          getPendleLPInfo(wallet, marketAddress),
          getPendlePTInfo(wallet, marketAddress, ptAddress)
        ]);
  
        const rewardValue1 = lp.depositValue
          .mul(lp.feeAPR.div(100))
          .plus(lp.depositValue.mul(pt.apr.div(100)));
  
        const totalRewardValue = lp.rewardValue.plus(rewardValue1);
        const apr = lp.apr.plus(pt.apr);
  
        results.push({
          ...portfolioItemFactory(),
          name: `pendle (${name})`,
          address: marketAddress,
          depositTime: moment(lp.depositTime).format("YY/MM/DD HH:mm:ss"),
          depositAsset0: `${name}`,
          depositAsset1: "",
          depositAmount0: roundToSignificantDigits(lp.depositValue.toString()), // assume 'aUSDC' deposit amount from 'aUSDC LP' deposit amount to simplify calculation
          depositAmount1: "",
          depositValue0: roundToSignificantDigits(lp.depositValue.toString()),
          depositValue1: "",
          depositValue: roundToSignificantDigits(lp.depositValue.toString()),
          rewardAsset0: "PENDLE",
          rewardAsset1: "USD",
          rewardAmount0: roundToSignificantDigits(lp.rewardAmount.toString()),
          rewardAmount1: roundToSignificantDigits(rewardValue1.toString()),
          rewardValue0: roundToSignificantDigits(lp.rewardValue.toString()),
          rewardValue1: roundToSignificantDigits(rewardValue1.toString()),
          rewardValue: roundToSignificantDigits(totalRewardValue.toString()),
          totalDays: calculateDaysDifference(lp.depositTime, new Date(), 4),
          totalBlocks: lp.totalBlocks.toString(),
          apr: roundToSignificantDigits(apr.toString()),
          type: "Swap pool",
          depositLink: `https://app.pendle.finance/trade/pools/${marketAddress}`
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Skipping market ${name} due to error: ${message}`);
        continue;
      }
    }
  
    return results;
  };
  

async function getPendleLPInfo(wallet: string, marketAddress: string) {
  const [marketData, userValuation] = await Promise.all([
    getPendleMarketData(marketAddress),
    getPendleLPValuation(wallet, marketAddress)
  ]);

  const tradingVolumeUSD = new Decimal(marketData.tradingVolume.usd);
  const liquidityUSD = new Decimal(marketData.liquidity.usd);

  const { lpValueUSD, lpRawBalance } = userValuation;

  const market = new ethers.Contract(marketAddress, pendleMarketABI, provider);
  const router = new ethers.Contract(routerAddress, pendleRouterABI, provider);
  const rewardState = await market.rewardState(rewardTokenAddress);
  const userInfo = await market.userReward(rewardTokenAddress, wallet);
  const lpBalance = await market.balanceOf(wallet);
  const marketState = await market.readState(routerAddress);

  const globalIndex = new Decimal(rewardState.index.toString());
  const userIndex = new Decimal(userInfo.index.toString());
  const accrued = new Decimal(userInfo.accrued.toString());
  const userLP = new Decimal(lpBalance.toString());
  const rewardDelta = globalIndex.minus(userIndex).mul(userLP).div(1e18);
  const realTimeReward = accrued.add(rewardDelta);
  const rewardTokenPrice = new Decimal(await getTokenPrice(rewardTokenSymbol));

  const now = Math.floor(Date.now() / 1000);
  const logs = await router.queryFilter(router.filters.AddLiquiditySingleToken(wallet, marketAddress), 0, "latest");
  const lastBlock = logs.length ? await provider.getBlock(logs[logs.length - 1].blockNumber) : null;
  const firstBlock = logs.length ? await provider.getBlock(logs[0].blockNumber) : null;
  const latestBlockNumber = await provider.getBlockNumber();
  const totalBlocks = firstBlock ? latestBlockNumber - firstBlock.number : 0;

  const incentiveDays = lastBlock ? new Decimal(now - lastBlock.timestamp).div(86400) : new Decimal(1);
  const feeDays = firstBlock ? new Decimal(now - firstBlock.timestamp).div(86400) : new Decimal(1);
  const depositTime = new Date((firstBlock?.timestamp || now) * 1000);

  const feeRate = decodeFeeRate(marketState.lnFeeRateRoot);
  const feeAPR = getFeeAPR(tradingVolumeUSD, liquidityUSD, lpValueUSD, feeRate);
  const { apy: incentiveAPY, rewardValueUSD } = getIncentiveAPY(realTimeReward.div(1e18), rewardTokenPrice, lpValueUSD, incentiveDays);
  const apr = incentiveAPY.plus(feeAPR);

  return {
    apr,
    feeAPR,
    depositTime,
    depositAmount: lpRawBalance,
    depositValue: lpValueUSD,
    rewardAmount: realTimeReward.div(1e18),
    rewardValue: rewardValueUSD,
    daysActive: feeDays,
    totalBlocks,
  };
}

async function getPendlePTInfo(wallet: string, marketAddress: string, ptAddress: string) {
  const marketData = await getPendleMarketData(marketAddress);
  const iface = new ethers.Interface(pendleMarketABI);

  const logs = await provider.getLogs({
    address: marketAddress,
    topics: [ethers.id("Mint(address,uint256,uint256,uint256)")],
    fromBlock: 0,
    toBlock: "latest"
  });

  for (const log of logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && (parsed.args[0] as string).toLowerCase() === wallet.toLowerCase()) {
        const netSy = BigInt(parsed.args[2]);
        const netPt = BigInt(parsed.args[3]);
        const ptContract = new ethers.Contract(ptAddress, ["function expiry() view returns (uint256)"], provider);
        const expiry = Number(await ptContract.expiry());

        const snapshot = Math.floor(new Date(marketData.timestamp).getTime() / 1000);
        const ptShare = Number(netPt) / (Number(netPt + netSy));
        const timeToMaturity = (expiry - snapshot) / (365 * 86400);
        const rawApy = Math.pow(1 + marketData.ptDiscount, 1 / timeToMaturity) - 1;
        const fixedApy = rawApy * ptShare;

        return {
          apr: new Decimal(fixedApy * 100),
          depositValue: new Decimal(Number(netPt + netSy) / 1e6)
        };
      }
    } catch {
      continue;
    }
  }

  return {
    apr: new Decimal(0),
    depositValue: new Decimal(0)
  };
}

const decodeFeeRate = (lnFeeRateRoot: bigint): Decimal => {
  const SCALE = new Decimal("1e18");
  const lnRoot = new Decimal(lnFeeRateRoot.toString()).div(SCALE);
  const ln = lnRoot.pow(2);
  return Decimal.exp(ln).minus(1);
};

const getFeeAPR = (
  tradingVolumeUSD: Decimal,
  liquidityUSD: Decimal,
  lpValueUSD: Decimal,
  feeRate: Decimal
): Decimal => {
  const userShare = lpValueUSD.div(liquidityUSD);
  const dailyFees = tradingVolumeUSD.mul(feeRate).mul(userShare);
  const apr = calculateAPR(
    lpValueUSD.toNumber(),
    dailyFees.mul(365).toNumber(),
    365
  );
  return new Decimal(apr);
  
};

const getIncentiveAPY = (
  rewardAccrued: Decimal,
  tokenPrice: Decimal,
  lpValueUSD: Decimal,
  daysActive: Decimal
): { apy: Decimal; rewardValueUSD: Decimal } => {
  const rewardValueUSD = rewardAccrued.mul(tokenPrice);
  const apy = new Decimal(calculateAPR(
    lpValueUSD.toNumber(),
    rewardValueUSD.toNumber(),
    daysActive.toNumber()
  ));
  return { apy, rewardValueUSD };
};

async function getPendleLPValuation(wallet: string, marketAddress: string) {
    const positions = await getPendlePositions(wallet);
    const pos = positions[0]?.openPositions.find((p) =>
      p.marketId.toLowerCase().includes(marketAddress.toLowerCase())
    );
  
    if (!pos) throw new Error("No LP position found for user in Pendle market");
  
    return {
      lpValueUSD: new Decimal(pos.lp.valuation),
      lpRawBalance: new Decimal(pos.lp.balance),
    };
  }
  