export interface Transaction {
  id: string
  blockNumber: string
  timestamp: string
  from: string
  to: string
}

export interface ClPool {
  id: string
  gauge: Gauge
  gaugeV2: Gauge
  createdAtTimestamp: string
  createdAtBlockNumber: string
  token0: Token
  token1: Token
  symbol: string
  liquidity: string
  feeGrowthGlobal0X128: string
  feeGrowthGlobal1X128: string
}

export interface Token {
  id: string
  symbol: string
  name: string
  decimals: string
  totalSupply: string
  volume: string
  volumeUSD: string
  feesUSD: string
  txCount: string
  poolCount: string
  totalValueLocked: string
  priceUSD: string
}

export interface ClMint {
  id: string
  transaction: Transaction
  pool: ClPool
  token0: Token
  token1: Token
  owner: string
  origin: string
  amount: string
  amount0: string
  amount1: string
  amountUSD: string
  tickLower: string
  tickUpper: string
  logIndex: string
}

export interface MappedClMint {
  id: string
  txHash: string
  blockNumber: number
  timestamp: number
  pool: string
  userAddress: string
  token0: string
  token1: string
  amount0: string
  amount1: string
}

export interface ClMintExtended extends ClMint {
  type: 'mint'
}

export interface ClBurn {
  id: string
  transaction: Transaction
  pool: ClPool
  token0: Token
  token1: Token
  owner: string
  origin: string
  amount: string
  amount0: string
  amount1: string
  amountUSD: string
  tickLower: string
  tickUpper: string
  logIndex: string
}

export interface MappedClBurn {
  id: string
  txHash: string
  blockNumber: number
  timestamp: number
  pool: string
  userAddress: string
  token0: string
  token1: string
  amount0: string
  amount1: string
}

export interface ClBurnExtended extends ClBurn {
  type: 'burn'
}

export interface ClSwap {
  id: string
  transaction: Transaction
  pool: ClPool
  token0: Token
  token1: Token
  sender: string
  recipient: string
  origin: string
  amount0: string
  amount1: string
  amountUSD: string
  sqrtPriceX96: string
  tick: string
  logIndex: string
}

export interface ClSwapExtended extends ClSwap {
  type: 'swap'
}

export type EventType = 'mint' | 'burn' | 'swap'

export interface Tick {
  id: string
  poolAddress: string
  tickIdx: string
  pool: ClPool
  liquidityGross: string
  liquidityNet: string
  price0: string
  price1: string
  volumeToken0: string
  volumeToken1: string
  volumeUSD: string
  untrackedVolumeUSD: string
  feesUSD: string
  collectedFeesToken0: string
  collectedFeesToken1: string
  collectedFeesUSD: string
  createdAtTimestamp: string
  createdAtBlockNumber: string
  liquidityProviderCount: string
  feeGrowthOutside0X128: string
  feeGrowthOutside1X128: string
}

export interface ClPosition {
  id: string
  owner: string
  pool: ClPool
  token0: Token
  token1: Token
  tickLower: Tick
  tickUpper: Tick
  liquidity: string
  depositedToken0: string
  depositedToken1: string
  transaction: Transaction
  feeGrowthInside0LastX128: string
  feeGrowthInside1LastX128: string
}

export interface ClPositionMint {
  id: string
  position: ClPosition
  transaction: Transaction
  timestamp: string
  pool: ClPool
  amount0: string
  amount1: string
  liquidity: string
  logIndex: string
}

export interface Gauge {
  id: string
  clPool: ClPool
}

export interface GaugeRewardClaim {
  id: string
  gauge: Gauge
  transaction: Transaction
  nfpPositionHash: string
  rewardToken: Token
  rewardAmount: string
  timestamp: string
}
