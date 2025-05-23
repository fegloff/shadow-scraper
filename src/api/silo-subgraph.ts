import axios from "axios";

export interface SiloDepositEvent {
  id: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
  sender: string
  assets: string
  shares: string
}

export const getSiloDeposits = async (
  owner: string,
  subgraphUrl: string
) => {
  const { data } = await axios.post<{
    data: {
      deposits: SiloDepositEvent[]
    }
  }>(subgraphUrl, {
    query: `
      {
        deposits(
          first: 1000,
          where: { owner: "${owner}" }
          orderBy: blockNumber
          orderDirection: desc
        ) {
          id
          blockNumber
          blockTimestamp
          transactionHash
          sender
          assets
          shares
        }
      }
    `
  }, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUBGRAPH_API_KEY}`
    }
  });

  return data.data.deposits;
};
