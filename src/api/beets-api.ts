import { ethers } from "ethers";
import ERC20_ABI from "../abi/ERC20.json";
import { CoinGeckoTokenIdsMap, getTokenPrice, getTokenPriceDate } from "./coingecko";
import { calculateAPR } from "../portfolio-tracker/helpers";

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const RATE_PROVIDER_CONTRACT_ADDRESS : { [key: string]: string }  = {
  'wasonicsolvbtcbbn': '0x00dE97829D01815346e58372be55aeFD84CA2457',
  'wasonicsolvbtc': '0xa6C292D06251dA638Be3B58f1473E03d99C26FF0'
}

const GAUGE_ABI = [
  {
    stateMutability: "view",
    type: "function",
    name: "claimable_reward",
    inputs: [
      { name: "_user", type: "address" },
      { name: "_reward_token", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "claimed_reward",
    inputs: [
      { name: "_addr", type: "address" },
      { name: "_token", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "reward_count",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "reward_tokens",
    inputs: [{ name: "arg0", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "arg0", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

const RATE_PROVIDER_ABI = [
  {
    "inputs": [{"internalType": "contract IERC4626", "name": "_erc4626", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "erc4626",
    "outputs": [{"internalType": "contract IERC4626", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fixedPointOne",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRate",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function getUserGaugeRewards(
  gaugeAddress: string,
  userAddress: string
) {
  const gaugeContract = new ethers.Contract(gaugeAddress, GAUGE_ABI, provider);

  const [userBalance, rewardCount] = await Promise.all([
    gaugeContract.balanceOf(userAddress),
    gaugeContract.reward_count()
  ]);

  const rewardTokenPromises = [];
  for (let i = 0; i < Number(rewardCount); i++) {
   
    rewardTokenPromises.push(gaugeContract.reward_tokens(i));
  }
  const rewardTokenAddresses = await Promise.all(rewardTokenPromises);
 
  const rewardPromises = rewardTokenAddresses.map(async (rewardTokenAddress, i) => {

    const tokenContract = new ethers.Contract(
      rewardTokenAddress,
      ERC20_ABI,
      provider
    );

    const [
      tokenSymbol,
      tokenDecimals,
      tokenName,
      claimableAmount,
      claimedAmount
    ] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.name(),
      gaugeContract.claimable_reward(userAddress, rewardTokenAddress),
      gaugeContract.claimed_reward(userAddress, rewardTokenAddress)
    ]);

    const claimableBN = BigInt(claimableAmount);
    const claimedBN = BigInt(claimedAmount);
    const totalEarned = claimableBN + claimedBN;

    const claimableFormatted = ethers.formatUnits(
      claimableAmount,
      tokenDecimals
    );
    const claimedFormatted = ethers.formatUnits(claimedAmount, tokenDecimals);
    const totalFormatted = ethers.formatUnits(totalEarned, tokenDecimals);
    
    const tokenUSDPrice = await getUnderlyingTokenUSDPrice(
      tokenSymbol.toLowerCase()
    );
    const rewardValue = +claimableFormatted * tokenUSDPrice;

    return {
      tokenAddress: rewardTokenAddress,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: tokenDecimals,
      claimable: claimableFormatted,
      claimed: claimedFormatted,
      totalEarned: totalFormatted,
      claimableRaw: claimableAmount.toString(),
      claimedRaw: claimedAmount.toString(),
      tokenUSDPrice: tokenUSDPrice,
      rewardValue: rewardValue,
    };
  });

  const rewards = await Promise.all(rewardPromises);

  return {
    userBalance: ethers.formatEther(userBalance),
    rewards,
  };
}

export const getTokenReward = (token: any, totalGain: number, currentPositionValue: number): { rewardValue: number, rewardAmount: number, symbol: string} => {
  const tokenValuePercentage = token.value / currentPositionValue;
  const tokenRewardValue = totalGain * tokenValuePercentage;
  const tokenRewardAmount = tokenRewardValue / token.price
  
  return {
    rewardValue: tokenRewardValue,
    rewardAmount: tokenRewardAmount,
    symbol: token.symbol
  }
}


export const getUnderlyingTokenUSDPrice = async (symbol: string, timestamp?: number) => {
  const id = await CoinGeckoTokenIdsMap[symbol.toLowerCase()];
  if (timestamp) {
    return getTokenPriceDate(id, timestamp)
  }
  return await getTokenPrice(id);
};

/*
 * Rate provider contract bridges Balancer v3 with ERC4626 yield-bearing tokens.
 * It standardizes the exchange rate by asking the underlying vault: 
 * "How many underlying assets is 1 share worth now?" 
 * This rate increases over time as the underlying protocol earns yield.
 */
export async function calculateV3Yield(
  initialDeposit: any,
) {
  const tokenYields = [];

  for (let i = 0; i < initialDeposit.amounts.length; i++) {
    const initialAmount = parseFloat(initialDeposit.amounts[i]);
    const token = initialDeposit.pool.tokens[i];

    if (initialAmount === 0) {
      tokenYields.push({
        rewardAmount: "0",
        rewardValue: "0",
        symbol: token.symbol.toLowerCase(),
      });
      continue;
    }

    // Get rate provider address for this token
    const tokenSymbol = token.symbol.toLowerCase();
    const rateProviderAddress: string = RATE_PROVIDER_CONTRACT_ADDRESS[tokenSymbol];
    
    if (!rateProviderAddress) {
      // If no rate provider, treat as regular token (no yield)
      tokenYields.push({
        rewardAmount: "0",
        rewardValue: "0",
        symbol: token.symbol.toLowerCase(),
      });
      continue;
    }

    // Get current rate from rate provider
    const rateProviderContract = new ethers.Contract(
      rateProviderAddress,
      RATE_PROVIDER_ABI,
      provider
    );
    
    const currentRate = await rateProviderContract.getRate();
    
    const rateAppreciation = parseFloat(ethers.formatUnits(currentRate, 18));
    
    // Calculate yield earned: if rate went from 1.0 to 1.05, then each deposited token
    // earned 0.05 tokens in yield. Formula: originalAmount × (currentRate - 1.0) = yieldEarned
    // Example: 100 tokens × (1.05 - 1.0) = 100 × 0.05 = 5 tokens of yield
    const yieldAmount = initialAmount * (rateAppreciation - 1);
    
    // Get current token price to calculate USD value
    const currentTokenPrice = await getUnderlyingTokenUSDPrice(token.symbol);
    const yieldValue = yieldAmount * currentTokenPrice;
        
    const tokenYield = {
      rewardAmount: yieldAmount.toString(),
      rewardValue: yieldValue.toString(),
      symbol: token.symbol.toLowerCase(),
    };
    
    tokenYields.push(tokenYield);
  }

  return {
    token0Yield: tokenYields[0] || null,
    token1Yield: tokenYields[1] || null,
  };
}
