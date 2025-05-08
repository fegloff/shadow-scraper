import {CoinGeckoTokenIdsMap, getTokenPrices} from "../api/coingecko";
import Decimal from 'decimal.js'
import {PortfolioItem, PositionReward} from "./types";

export const setUSDValues = async (
  items: PortfolioItem[]
) => {
  return items
  // const exchangeTokenIds = items.map(item => {
  //   const key = item.asset.toLowerCase()
  //   return CoinGeckoTokenIdsMap[key]
  // }).filter(_ => _)
  //
  // const tokenPrices = await getTokenPrices(exchangeTokenIds)
  //
  // return items.map(item => {
  //   const key = item.asset.toLowerCase()
  //   const isXShadow = key.includes('xSHADOW'.toLowerCase())
  //   const tokenId = CoinGeckoTokenIdsMap[key]
  //   if(tokenId || isXShadow) {
  //     if(tokenPrices[tokenId] || isXShadow) {
  //       const price = isXShadow
  //         ? (tokenPrices['shadow-2'].usd / 2)
  //         : tokenPrices[tokenId]['usd']
  //       if(price) {
  //         const value = new Decimal(item.balance)
  //           .mul(price)
  //           .toDecimalPlaces(6)
  //           .toString()
  //         return {
  //           ...item,
  //           price: `$${price}`,
  //           value: `$${value}`
  //         }
  //       }
  //     }
  //   }
  //   return {
  //     ...item,
  //     price: '0',
  //     value: '0'
  //   }
  // })
}

export const calculateAPR = (
  depositedTotalUSD: number,
  totalRewardsUSD: number,
  daysElapsed: number
) => {
  if (depositedTotalUSD < 0) {
    throw new Error("Deposited total must be positive.");
  }

  if (daysElapsed <= 0) {
    throw new Error("End date must be after the pool launch date.");
  }

  const returnRate = totalRewardsUSD / depositedTotalUSD;
  const annualizedRate = returnRate * (365 / daysElapsed);
  const apr = annualizedRate * 100;

  return Number(apr.toFixed(2));
}

export const portfolioItemFactory = (): PortfolioItem => {
  return {
    name: '',
    address: '',
    depositTime: '',
    depositAsset0: '',
    depositAsset1: '',
    depositAmount0: '',
    depositAmount1: '',
    depositValue0: '',
    depositValue1: '',
    depositValue: '',
    rewardAsset0: '',
    rewardAsset1: '',
    rewardAmount0: '',
    rewardAmount1: '',
    rewardValue0: '',
    rewardValue1: '',
    rewardValue: '',
    totalDays: '',
    totalBlocks: '',
    apr: '',
    type: '',
    depositLink: ''
  }
}

export const mergeRewards = (
  rewards1: PositionReward[],
  rewards2: PositionReward[],
): PositionReward[] => {
  const rewardMap = new Map<string, PositionReward>();

  rewards1.forEach(reward => {
    rewardMap.set(reward.asset, { ...reward });
  });

  rewards2.forEach(reward => {
    const existing = rewardMap.get(reward.asset);
    if (existing) {
      existing.amount = (new Decimal(existing.amount).add(new Decimal(reward.amount))).toFixed();
      existing.value = (new Decimal(existing.value).add(new Decimal(reward.value))).toFixed();
    } else {
      rewardMap.set(reward.asset, { ...reward });
    }
  });

  return Array.from(rewardMap.values());
}

export const roundToSignificantDigits = (
  numStr: string,
  n = 6
) => {
  if (!numStr || isNaN(Number(numStr)) || !Number.isInteger(n) || n <= 0) {
    throw new Error('Invalid input: numStr must be a valid number string and n must be a positive integer');
  }

  const num = Number(numStr);

  if (num === 0) {
    return '0.' + '0'.repeat(n); // Returns "0.000..." with n zeros after decimal
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const magnitude = Math.floor(Math.log10(absNum));

  const scale = Math.pow(10, n - magnitude - 1);

  const rounded = Math.round(absNum * scale) / scale;

  const result = isNegative ? -rounded : rounded;

  // Convert to full decimal string
  if (magnitude >= 0) {
    // For numbers >= 1
    const decimalPlaces = n - magnitude - 1;
    return result.toFixed(Math.max(0, decimalPlaces));
  } else {
    // For numbers < 1
    const decimalPlaces = Math.abs(magnitude) + n - 1;
    return result.toFixed(decimalPlaces);
  }
}

export const calculateDaysDifference = (
  date1: Date,
  date2: Date,
  significantDigits: number
) => {
  if (!(date1 instanceof Date) || !(date2 instanceof Date) ||
    isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    throw new Error('Invalid input: Both arguments must be valid Date objects');
  }
  const msDiff = Math.abs(date2.getTime() - date1.getTime());
  const daysDiff = msDiff / (1000 * 60 * 60 * 24);
  return roundToSignificantDigits(daysDiff.toString(), significantDigits);
}


export const includesSubstrings = (
  str: string, substrings: string[]
) => {
  return substrings.some(substring => str.toLowerCase().includes(substring.toLowerCase()));
}
