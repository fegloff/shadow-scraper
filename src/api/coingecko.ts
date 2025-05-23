import axios from "axios";

export const CoinGeckoTokenIdsMap: Record<string, string> = {
  'swpx': 'swapx-2',
  'usdt': 'tether',
  'usdc.e': 'sonic-bridged-usdc-e-sonic',
  'ws': 'wrapped-sonic',
  'scusd': 'rings-scusd',
  'shadow': 'shadow-2',
  'x33': 'shadow-liquid-staking-token',
  'frxusd': 'frax-usd',
  'weth': 'weth',
  'pendle': 'pendle',
  'wbtc': 'wrapped-bitcoin',
  'scbtc': 'rings-scbtc', // for beets 'scbtc': 'wrapped-bitcoin'
  'solvbtc': 'solv-btc',
  'lbtc': 'lombard-staked-btc',
  'xsolvbtc': 'solv-protocol-solvbtc-bbn',
  'beets': 'beets',
  'gems': 'gems' // https://web3.okx.com/token/sonic/0x5555b2733602ded58d47b8d3d989e631cbee5555
}

// hardcode values for test purposes
export const CoinGeckoRates: Record<string, number> = {
  'swapx-2': 0.1329,
  'shadow-2': 55.84,
  'shadow-liquid-staking-token': 49.01,
  'wrapped-sonic': 0.4952,
  'sonic': 0.4952,
  'sonic-bridged-usdc-e-sonic': 1,
  'rings-scusd': 1,
  'tether': 1,
  'frax-usd': 1,
  'weth': 2298.87,
  'pendle': 3.80,
  'wrapped-bitcoin': 108949,
  'rings-scbtc': 108949,
  'lombard-staked-btc': 108949,
  'gems': 32.52,
  'solv-protocol-solvbtc-bbn': 111637.53,
  'solv-btc': 111590.65,
}

// hardcoded historical rates
export const CoinGeckoHistoricalRates: Record<string, Record<string, number>> = {
  'rings-scbtc': {
    '16-05-2025': 103393.983167005,
    '15-05-2025': 103331.502813178
  },
  'lombard-staked-btc': {
    '16-05-2025': 103515.8513815589,
    '15-05-2025': 103102.080844769
  },
};

interface CoinGeckoPriceResponse {
  [key: string]: {
    [key: string]: number
  }
}

const tokenPriceCache: Record<string, number> = {}

// Coingecko API docs: https://www.coingecko.com/en/api/documentation
export const getTokenPrices = async (tokens: string[])=> {
  const ids = tokens.join(',')
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  const { data } = await axios.get<CoinGeckoPriceResponse>(url)
  return data
}

export const getTokenPrice = async (
  tokenId: string,
  fromCache = true
)=> {
  if(fromCache) {
    if (tokenPriceCache[tokenId]) {
      return tokenPriceCache[tokenId]
    }
    if(CoinGeckoRates[tokenId]) {
      return CoinGeckoRates[tokenId]
    }
  }
  console.log('Coingecko API: Get token price', tokenId)
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
  const {data} = await axios.get<CoinGeckoPriceResponse>(url)
  const value = data[tokenId]['usd']

  tokenPriceCache[tokenId] = value
  return value
}

export const getTokenPriceDate = async (
  tokenId: string,
  timestamp: number,
  fromCache = true
)=> {

  const coinGeckoDate = new Date(timestamp * 1000)
    .toLocaleDateString('en-GB')
    .replace(/\//g, '-');
  if(fromCache) {
   if (CoinGeckoHistoricalRates[tokenId]?.[coinGeckoDate]) {
      console.log(`Using cached historical price for ${tokenId} on ${coinGeckoDate}:`, CoinGeckoHistoricalRates[tokenId][coinGeckoDate]);
      return CoinGeckoHistoricalRates[tokenId][coinGeckoDate];
    }
  }
  console.log(`Coingecko API: Get token price (${coinGeckoDate})`, tokenId)
  const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/history?date=${coinGeckoDate}`
  const { data } = await axios.get<any>(url)
  const value = data.market_data?.current_price?.usd || 0;
  return value
}

export interface CoinGeckoToken {
  id: string
  symbol: string
  name: string
}

export const getTokensList = async ()=> {
  const url = `https://api.coingecko.com/api/v3/coins/list`
  const { data } = await axios.get<CoinGeckoToken[]>(url)
  return data
}

