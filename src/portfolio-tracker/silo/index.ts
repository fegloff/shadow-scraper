import {PortfolioItem} from "../types";
import {ethers} from "ethers";
import {calculateAPR, calculateDaysDifference, portfolioItemFactory, roundToSignificantDigits} from "../helpers";
import moment from "moment/moment";
import Decimal from "decimal.js";
import {getSiloDeposits} from "../../api/silo-subgraph";
import SiloABI from '../../abi/Silo.json'
import BoringVaultABI from '../../abi/BoringVault.json'

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

const siloVaults = [{
  name: '',
  address: '0xe6605932e4a686534D19005BB9dB0FBA1F101272'
}]

export const getSiloInfo = async (
  walletAddress: string
) => {
  const portfolioItems: PortfolioItem[] = []

  for (const siloVault of siloVaults) {
    const silo = new ethers.Contract(siloVault.address, SiloABI, provider);
    const assetAddress = await silo.asset() as string
    const assetContract = new ethers.Contract(assetAddress, BoringVaultABI, provider);
    const rewardAsset0 = await assetContract.symbol() as string
    const depositAsset0 = rewardAsset0
    const decimals = Number(await assetContract.decimals() as bigint)
    const sharesBalance = await silo.balanceOf(walletAddress)
    const assetsAmount = await silo.convertToAssets(sharesBalance) as bigint

    const deposits = await getSiloDeposits(walletAddress)
    const firstDeposit = deposits[deposits.length - 1]
    let totalDepositAmount = deposits.reduce((acc, item) => {
      return acc + Number(item.assets) / Math.pow(10, decimals)
    }, 0)
    const depositAmount0 = String(totalDepositAmount)

    if(assetsAmount > 0n) {
      const depositTimestamp = firstDeposit
        ? Number(firstDeposit.blockTimestamp) * 1000
        : 0
      const depositValue0 = depositAmount0
      const rewardAmount0 = new Decimal(assetsAmount.toString()).div(10 ** decimals)
        .sub(new Decimal(depositAmount0))
        .toString()
      const rewardValue0 = rewardAmount0

      const currentBlockNumber = await provider.getBlockNumber()
      const depositBlockNumber = firstDeposit ? firstDeposit.blockNumber : '0'

      const portfolioItem: PortfolioItem = {
        ...portfolioItemFactory(),
        type: 'Swap pool',
        name: 'silo',
        address: siloVault.address,
        depositTime: moment(depositTimestamp).format('YY/MM/DD HH:MM:SS'),
        depositAsset0: depositAsset0,
        depositAsset1: '',
        depositAmount0: roundToSignificantDigits(depositAmount0),
        depositAmount1: '',
        depositValue0: roundToSignificantDigits(depositValue0),
        depositValue1: '',
        depositValue: roundToSignificantDigits(depositValue0),
        rewardAsset0: rewardAsset0,
        rewardAsset1: '',
        rewardAmount0: roundToSignificantDigits(rewardAmount0),
        rewardAmount1: '',
        rewardValue0: roundToSignificantDigits(rewardValue0),
        rewardValue1: '',
        rewardValue: roundToSignificantDigits(rewardValue0),
        totalDays: calculateDaysDifference(new Date(depositTimestamp), new Date(), 4),
        totalBlocks: (currentBlockNumber - Number(depositBlockNumber)).toString(),
        depositLink: `https://v2.silo.finance/vaults/sonic/${siloVault.address}?action=deposit`
      }

      const apr = calculateAPR(
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
