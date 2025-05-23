import Decimal from "decimal.js";
import {getPositions, getGaugeRewardClaims} from "../../api";
import {ethers} from "ethers";
import {
  calculateAPR, calculateDaysDifference,
  mergeRewards,
  portfolioItemFactory,
  roundToSignificantDigits
} from "../helpers";
import {CoinGeckoTokenIdsMap, getTokenPrice} from "../../api/coingecko";
import GaugeV3ABI from '../../abi/GaugeV3.json';
import ERC20ABI from '../../abi/ERC20.json';
import moment from 'moment'
import {ClPosition, GaugeRewardClaim} from "../../types";
import {PortfolioItem, PositionReward} from "../types";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

// https://ethereum.stackexchange.com/questions/101955/trying-to-make-sense-of-uniswap-v3-fees-feegrowthinside0lastx128-feegrowthglob

const getClaimedRewardBySymbol = async (
  position: ClPosition,
  rewardClaims: GaugeRewardClaim[],
  rewardSymbol: string
): Promise<PositionReward> => {
  const { pool } = position

  let amount = new Decimal(0)
  let value = new Decimal(0)

  const poolRewards = rewardClaims
    .filter((item) => {
      return item.gauge.clPool.symbol.toLowerCase() === pool.symbol.toLowerCase()
        && item.rewardToken.symbol.toLowerCase() === rewardSymbol.toLowerCase()
        && Number(item.transaction.timestamp) >= Number(position.transaction.timestamp)
    })

    for (const reward of poolRewards) {
      const { rewardToken, rewardAmount } = reward;
      const symbol = rewardToken.symbol.toLowerCase();
      let tokenPrice = 0;

      if (symbol === 'xshadow') {
        tokenPrice = (await getTokenPrice('shadow-2')) / 2;
      } else {
        const exchangeTokenId = CoinGeckoTokenIdsMap[symbol];
        if (exchangeTokenId) {
          tokenPrice = await getTokenPrice(exchangeTokenId);
        } else {
          tokenPrice = await getTokenPrice(symbol, true);
        }
      }

      const rewardValue = Decimal(rewardAmount).mul(tokenPrice);
      value = value.add(rewardValue);
      amount = amount.add(new Decimal(rewardAmount));
    }


  return {
    asset: rewardSymbol,
    amount: amount.toFixed(),
    value: value.toFixed()
  }
}

export const getShadowInfo = async (
  userAddress: string
) => {
  const positions = await getPositions({
    filter: {
      liquidity_gt: 0,
      owner: userAddress
    }
  })

  const rewardClaims = await getGaugeRewardClaims({
    filter: {
      transaction_from: userAddress,
      gauge_isAlive: true
    },
    sort: {
      orderBy: 'transaction__blockNumber',
      orderDirection: 'desc'
    }
  })

  const portfolioItems: PortfolioItem[] = []

  for (const position of positions) {
    const { id: positionId, pool } = position

    const gaugeContract = new ethers.Contract(pool.gaugeV2.id, GaugeV3ABI, provider);

    const launchTimestamp = Number(position.transaction.timestamp) * 1000

    const { depositedToken0, depositedToken1 } = position
    const exchangeToken0Id = CoinGeckoTokenIdsMap[pool.token0.symbol.toLowerCase()]
    const exchangeToken1Id = CoinGeckoTokenIdsMap[pool.token1.symbol.toLowerCase()]

    // Calculate deposited amount
    let apr = 0
    let totalDepositedValue = 0
    let deposit0Value = 0
    let deposit1Value = 0
    if(exchangeToken0Id && exchangeToken1Id) {
      const token0Price = await getTokenPrice(exchangeToken0Id)
      const token1Price = await getTokenPrice(exchangeToken1Id)
      deposit0Value = token0Price * Number(depositedToken0)
      deposit1Value = token1Price * Number(depositedToken1)
    }
    totalDepositedValue = deposit0Value + deposit1Value

    // Calculate Rewards
    const claimedRewards: PositionReward[] = []
    const unclaimedRewards: PositionReward[] = []
    const rewardTokens = (await gaugeContract.getRewardTokens()) as string[]

    for(const tokenAddress of rewardTokens) {
      const earned = await gaugeContract.earned(tokenAddress, positionId) as bigint
      const rewardContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
      const rewardSymbol = await rewardContract.symbol();

      // Claimed rewards (from Subgraph)
      const claimedReward = await getClaimedRewardBySymbol(position, rewardClaims, rewardSymbol)
      claimedRewards.push(claimedReward)

      // Unclaimed (pending) rewards (from RPC)
      if(earned > 0) {
        let price = 0
        const symbol = rewardSymbol.toLowerCase();
        const exchangeTokenId = CoinGeckoTokenIdsMap[symbol];
        if(exchangeTokenId) {
          price = await getTokenPrice(exchangeTokenId)
        } else if(symbol === 'xshadow') {
          price = (await getTokenPrice('shadow-2')) / 2
        } else {
          price = await getTokenPrice(symbol, true);
        }

        if(price > 0) {
          const decimals = Number(await rewardContract.decimals())
          const amount = new Decimal(earned.toString()).div(Math.pow(10, decimals))
          const value = amount.mul(price)
          unclaimedRewards.push({
            asset: rewardSymbol,
            amount: amount.toString(),
            value: value.toString()
          })
        }
      }
    }

    const rewards = mergeRewards(claimedRewards, unclaimedRewards)
    const usdcReward = rewards.find(r => r.asset.toLowerCase() === 'usdc.e');
    const xshadowReward = rewards.find(r => r.asset.toLowerCase() === 'xshadow');
    const shadowReward = rewards.find(r => r.asset.toLowerCase() === 'shadow');
    const defaultRewards = [shadowReward, xshadowReward].filter(Boolean);

    const missingRewardCount = 2 - defaultRewards.length;
    if (missingRewardCount > 0) {
      const remaining = rewards.filter(r => !defaultRewards.includes(r)).slice(0, missingRewardCount);
      defaultRewards.push(...remaining);
    }
    const reward0 = usdcReward && xshadowReward ? usdcReward : defaultRewards[0] || { asset: '', amount: '0', value: '0' };
    const reward1 = usdcReward && xshadowReward ? xshadowReward : defaultRewards[1] || { asset: '', amount: '0', value: '0' };


    if(totalDepositedValue > 0) {
      const currentBlockNumber = await provider.getBlockNumber()
      const portfolioItem: PortfolioItem = {
        ...portfolioItemFactory(),
        type: `Swap pool`,
        name: 'shadow',
        address: pool.id,
        depositTime: moment(launchTimestamp).format('YY/MM/DD HH:MM:SS'),
        depositAsset0: position.pool.token0.symbol,
        depositAsset1: position.pool.token1.symbol,
        depositAmount0: roundToSignificantDigits(position.depositedToken0),
        depositAmount1: roundToSignificantDigits(position.depositedToken1),
        depositValue0: roundToSignificantDigits(deposit0Value.toString()),
        depositValue1: roundToSignificantDigits(deposit1Value.toString()),
        depositValue: roundToSignificantDigits(
          (deposit0Value + deposit1Value).toString()
        ),
        rewardAsset0: reward0.asset,
        rewardAsset1: reward1.asset,
        rewardAmount0: roundToSignificantDigits(reward0.amount),
        rewardAmount1: roundToSignificantDigits(reward1.amount),
        rewardValue0: roundToSignificantDigits(reward0.value),
        rewardValue1: roundToSignificantDigits(reward1.value),
        rewardValue: roundToSignificantDigits(
          rewards.reduce((acc, r) => acc + Number(r.value), 0).toString()
        ),
        totalDays: calculateDaysDifference(new Date(launchTimestamp), new Date(), 4),
        totalBlocks: (currentBlockNumber - Number(position.transaction.blockNumber)).toString(),
        depositLink: `https://www.shadow.so/liquidity/${pool.id}`
      }

      apr = calculateAPR(
        Number(portfolioItem.depositValue),
        Number(portfolioItem.rewardValue),
        Number(portfolioItem.totalDays)
      )
      portfolioItem.apr = roundToSignificantDigits(apr.toString())
      portfolioItems.push(portfolioItem)
    }
  }

  return portfolioItems
}
