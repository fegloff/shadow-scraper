import {GetEventsFilter, GetEventsParams} from "./index";

const buildWhereQuery = (filter: GetEventsFilter) => {
  let where: any = {}
  let transactionWhere = {}
  let gaugeWhere = {}

  if(filter.poolSymbol) {
    where = {
      ...where,
      pool_: {
        symbol: filter.poolSymbol
      }
    }
  }

  if(filter.blockNumber_gt) {
    transactionWhere = {
      ...transactionWhere,
      blockNumber_gt: filter.blockNumber_gt
    }
  }

  if(filter.blockNumber_lte) {
    transactionWhere = {
      ...transactionWhere,
      blockNumber_lte: filter.blockNumber_lte
    }
  }

  if(filter.timestamp_gt) {
    transactionWhere = {
      ...transactionWhere,
      timestamp_gt: filter.timestamp_gt
    }
  }

  if(filter.transaction_from) {
    transactionWhere = {
      ...transactionWhere,
      from: filter.transaction_from
    }
  }

  if(filter.gauge_isAlive) {
    gaugeWhere = {
      ...gaugeWhere,
      isAlive: filter.gauge_isAlive
    }
  }

  if(filter.owner) {
    where = {
      ...where,
      owner: filter.owner
    }
  }

  if(typeof filter.liquidity_gt !== undefined) {
    where = {
      ...where,
      liquidity_gt: filter.liquidity_gt
    }
  }

  where = {
    ...where,
    transaction_: transactionWhere,
  }

  if(Object.keys(gaugeWhere).length > 0) {
    where = {
      ...where,
      gauge_: gaugeWhere
    }
  }

  return buildFilterQuery(where)
}

const buildFilterQuery = (filter: Object) => {
  return JSON.stringify(filter).replace(/"([^(")"]+)":/g,"$1:");
}

export const getMintsQuery = (params: GetEventsParams) => {
  const { first = 1000, skip = 0, filter = {}, sort = {} } = params

  const whereQuery = buildWhereQuery(filter)
  const orderDirection = sort.orderDirection || 'asc'
  const orderBy = sort.orderBy || 'transaction__blockNumber'

  return `{
    clMints(
      first: ${first}
      skip: ${skip}
      orderDirection: ${orderDirection},
      orderBy: ${orderBy},
      where: ${whereQuery}
    ) {
      id
      transaction {
        id
        blockNumber
        timestamp
      }
      owner
      origin
      amount0
      amount1
      amountUSD
      tickLower
      tickUpper
      logIndex
      token0 {
        id
        name
        symbol
      }
      token1 {
        id
        name
        symbol
      }
      pool {
        id
        symbol
      }
    }
  }`
}

export const getBurnsQuery = (params: GetEventsParams) => {
  const { first = 1000, skip = 0, filter = {}, sort = {} } = params

  const whereQuery = buildWhereQuery(filter)
  const orderDirection = sort.orderDirection || 'asc'
  const orderBy = sort.orderBy || 'transaction__blockNumber'

  return `{
    clBurns(
      first: ${first}
      skip: ${skip}
      orderDirection: ${orderDirection},
      orderBy: ${orderBy},
      where: ${whereQuery}
    ) {
      id
      transaction {
        id
        blockNumber
        timestamp
      }
      owner
      origin
      amount0
      amount1
      amountUSD
      tickLower
      tickUpper
      logIndex
      token0 {
        id
        name
        symbol
      }
      token1 {
        id
        name
        symbol
      }
      pool {
        id
        symbol
      }
    }
  }`
}

export const getSwapsQuery = (params: GetEventsParams) => {
  const { first = 1000, skip = 0, filter = {}, sort = {} } = params

  const whereQuery = buildWhereQuery(filter)
  const orderDirection = sort.orderDirection || 'asc'
  const orderBy = sort.orderBy || 'transaction__blockNumber'

  return `{
    clSwaps (
      first: ${first}
      orderDirection: ${orderDirection},
      orderBy: ${orderBy},
      where: ${whereQuery}
    ) {
      id
      transaction {
        id
        blockNumber
        timestamp
      }
      sender
      recipient
      origin
      amount0
      amount1
      amountUSD
      sqrtPriceX96
      tick
      logIndex
      token0 {
        id
        name
        symbol
      }
      token1 {
        id
        name
        symbol
      }
      pool {
        id
        symbol
      }
    }
  }`
}

export const getPositionsQuery = (params: GetEventsParams) => {
  const { first = 1000, skip = 0, filter = {}, sort = {} } = params

  const whereQuery = buildWhereQuery(filter)
  const orderDirection = sort.orderDirection || 'asc'
  const orderBy = sort.orderBy || 'transaction__blockNumber'

  return `{
    clPositions (
      first: ${first}
      orderDirection: ${orderDirection},
      orderBy: ${orderBy},
      where: ${whereQuery}
    ) {
      id
      transaction { id from to blockNumber timestamp }
      depositedToken0
      depositedToken1
      feeGrowthInside0LastX128
      feeGrowthInside1LastX128
      liquidity
      tickLower { feeGrowthOutside0X128 feeGrowthOutside1X128 }
      tickUpper { feeGrowthOutside0X128 feeGrowthOutside1X128 }
      pool {
        id
        gauge { id }
        gaugeV2 { id }
        symbol
        token0 { id symbol decimals }
        token1 { id symbol decimals }
        feeGrowthGlobal0X128
        feeGrowthGlobal1X128
      }
      token0 { id symbol decimals }
      token1 { id symbol decimals }
      tickLower { tickIdx }
      tickUpper { tickIdx }
    }
  }`
}

export const getGaugeRewardClaimsQuery = (params: GetEventsParams) => {
  const { first = 1000, skip = 0, filter = {}, sort = {} } = params

  const whereQuery = buildWhereQuery(filter)
  const orderDirection = sort.orderDirection || 'asc'
  const orderBy = sort.orderBy || 'transaction__blockNumber'

  return `{
    gaugeRewardClaims (
      first: ${first}
      orderDirection: ${orderDirection},
      orderBy: ${orderBy},
      where: ${whereQuery}
    ) {
      id
      gauge {
        clPool {
          id symbol
          token0 { id symbol name } token1 { id symbol name }
        }
      }
      transaction { id from to blockNumber timestamp }
      nfpPositionHash
      rewardToken { id symbol name }
      rewardAmount
      period
      timestamp
    }
  }`
}

export const getClPositionMints = (params: GetEventsParams) => {
  const { first = 1000, skip = 0, filter = {}, sort = {} } = params

  const whereQuery = buildWhereQuery(filter)

  return `{
    clPositionMints(
      first:100,
      where: ${whereQuery}
      orderBy: transaction__timestamp,
      orderDirection:desc
    ) {
      id
      amount0
      amount1
      position {
        id
        depositedToken0
        depositedToken1
        token0 { id symbol decimals }
        token1 { id symbol decimals }
        transaction { id from to blockNumber timestamp }
        pool {
          symbol
          token0 { id symbol decimals }
          token1 { id symbol decimals }
          gaugeV2 { id }
        }
      }
      liquidity
      pool {
        symbol
        token0 { id symbol decimals }
        token1 { id symbol decimals }
        gaugeV2 { id }
      }
      transaction { id from to blockNumber timestamp }
    }
  }`
}

