import { PortfolioItem } from "../types";
import { ethers } from "ethers";
import { calculateAPR, calculateDaysDifference, portfolioItemFactory, roundToSignificantDigits } from "../helpers";
import moment from "moment";
import Decimal from "decimal.js";
import { getSiloDeposits } from "../../api/silo-subgraph";
import SiloABI from '../../abi/Silo.json';
import BoringVaultABI from '../../abi/BoringVault.json';
import { CoinGeckoTokenIdsMap, getTokenPrice } from '../../api/coingecko';


const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const siloVaults = [
  {
    name: 'Silo-LBTC · scBTC',
    address: '0x0dfa6b53c05b07e29b49a878fc96153cc03c3e72',
    marketPath: 'lbtc-scbtc-32',
    subgraphUrl: 'https://api.studio.thegraph.com/query/112027/silo-lbtc/version/latest'
  },
  {
    name: 'Silo-LBTC · scBTC',
    address: '0x0A94e18bdbCcD048198806d7FF28A1B1D2590724',
    marketPath: 'lbtc-scbtc-32',
    subgraphUrl: 'https://api.studio.thegraph.com/query/112027/silo-scbtc/version/latest'
  },
  {
    name: 'Silo-xSolvBTC · SolvBTC',
    address: '0x52Fc9E0a68b6a4C9b57b9D1d99fB71449A99DCd8',
    marketPath: 'xsolvbtc-solvbtc-13',
    subgraphUrl: 'https://api.studio.thegraph.com/query/112027/silo-xsolvbtc/version/latest'
  },
  {
    name: 'Silo-xSolvBTC · SolvBTC',
    address: '0x87178fe8698C7eDa8aA207083C3d66aEa569aB98',
    marketPath: 'xsolvbtc-solvbtc-13',
    subgraphUrl: 'https://api.studio.thegraph.com/query/112027/silo-solvbtc/version/latest'
  },
  {
    name: 'Silo-scUSD',
    address: '0xe6605932e4a686534D19005BB9dB0FBA1F101272',
    marketPath: 'scusd',
    subgraphUrl: 'https://api.studio.thegraph.com/query/108274/silofinance/version/latest'
  }
];

export const getSiloInfo = async (walletAddress: string): Promise<PortfolioItem[]> => {
  const portfolioItems: PortfolioItem[] = [];

  for (const siloVault of siloVaults) {
    const silo = new ethers.Contract(siloVault.address, SiloABI, provider);
    const assetAddress = await silo.asset() as string;
    const assetContract = new ethers.Contract(assetAddress, BoringVaultABI, provider);
    const rewardAsset0 = await assetContract.symbol();
    const depositAsset0 = rewardAsset0;
    const decimals = Number(await assetContract.decimals());
    const sharesBalance = await silo.balanceOf(walletAddress);
    const assetsAmount = await silo.convertToAssets(sharesBalance) as bigint;

    const deposits = await getSiloDeposits(walletAddress, siloVault.subgraphUrl);
    const firstDeposit = deposits[deposits.length - 1];
    let totalDepositAmount = deposits.reduce((acc, item) => {
      return acc + Number(item.assets) / Math.pow(10, decimals);
    }, 0);
    const depositAmount0 = String(totalDepositAmount);

    if (assetsAmount > 0n) {
      const depositTimestamp = firstDeposit
        ? Number(firstDeposit.blockTimestamp) * 1000
        : 0;
            const tokenSymbol = rewardAsset0.toLowerCase();
      const tokenId = CoinGeckoTokenIdsMap[tokenSymbol];
      const tokenPrice = tokenId ? await getTokenPrice(tokenId) : 0;

      const rewardAmount0 = new Decimal(assetsAmount.toString())
        .div(10 ** decimals)
        .sub(new Decimal(depositAmount0))
        .toString();

      const rewardValue0 = new Decimal(rewardAmount0).mul(tokenPrice).toString();
      const depositValue0 = new Decimal(depositAmount0).mul(tokenPrice).toString();


      const currentBlockNumber = await provider.getBlockNumber();
      const depositBlockNumber = firstDeposit ? firstDeposit.blockNumber : '0';

      const portfolioItem: PortfolioItem = {
        ...portfolioItemFactory(),
        type: 'Swap pool',
        name: siloVault.name,
        address: siloVault.address,
        depositTime: moment(depositTimestamp).format('YY/MM/DD HH:MM:SS'),
        depositAsset0,
        depositAsset1: '',
        depositAmount0: roundToSignificantDigits(depositAmount0),
        depositAmount1: '',
        depositValue0: roundToSignificantDigits(depositValue0),
        depositValue1: '',
        depositValue: roundToSignificantDigits(depositValue0),
        rewardAsset0,
        rewardAsset1: '',
        rewardAmount0: roundToSignificantDigits(rewardAmount0),
        rewardAmount1: '',
        rewardValue0: roundToSignificantDigits(rewardValue0),
        rewardValue1: '',
        rewardValue: roundToSignificantDigits(rewardValue0),
        totalDays: calculateDaysDifference(new Date(depositTimestamp), new Date(), 4),
        totalBlocks: (currentBlockNumber - Number(depositBlockNumber)).toString(),
        depositLink: `https://app.silo.finance/markets/sonic/${siloVault.marketPath}`
      };

      const apr = calculateAPR(
        Number(portfolioItem.depositValue),
        Number(portfolioItem.rewardValue),
        Number(portfolioItem.totalDays)
      );
      portfolioItem.apr = roundToSignificantDigits(apr.toString());

      portfolioItems.push(portfolioItem);
    }
  }

  return portfolioItems;
};
