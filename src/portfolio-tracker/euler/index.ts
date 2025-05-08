import {ethers} from "ethers";
import {PortfolioItem} from "../types";
import {getEulerDeposits} from "../../api/euler-subgraph";
import Decimal from "decimal.js";
import {calculateAPR, calculateDaysDifference, portfolioItemFactory, roundToSignificantDigits} from "../helpers";
import moment from "moment";
import {getEulerMerklRewards} from "../../api/euler-api";
import {CoinGeckoTokenIdsMap, getTokenPrice} from "../../api/coingecko";
import EulerEVaultABI from '../../abi/EulerEVault.json'
import FiatTokenV2_ABI from '../../abi/FiatTokenV2_2_Euler.json'

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");

export const getEulerInfo = async (
  walletAddress: string,
  vaultAddress = '0x196F3C7443E940911EE2Bb88e019Fd71400349D9'
) => {
  const vault = new ethers.Contract(vaultAddress, EulerEVaultABI, provider);
  const assetAddress = await vault.asset() as string
  const assetContract = new ethers.Contract(assetAddress, FiatTokenV2_ABI, provider);
  const rewardAsset0 = await assetContract.symbol() as string
  const depositAsset0 = rewardAsset0
  const decimals = Number(await assetContract.decimals() as bigint)
  const sharesBalance = await vault.balanceOf(walletAddress)
  const assetsAmount = await vault.convertToAssets(sharesBalance) as bigint

  const deposits = await getEulerDeposits(walletAddress)
  const firstDeposit = deposits[deposits.length - 1]
  let totalDepositAmount = deposits.reduce((acc, item) => {
    return acc + Number(item.assets) / Math.pow(10, decimals)
  }, 0)
  const depositAmount0 = String(totalDepositAmount)

  const portfolioItems: PortfolioItem[] = []
  if(assetsAmount > 0n) {
    const depositTimestamp = firstDeposit
      ? Number(firstDeposit.blockTimestamp) * 1000
      : 0
    const depositValue0 = depositAmount0
    const rewardAmount0 = new Decimal(assetsAmount.toString()).div(10 ** decimals)
      .sub(new Decimal(depositAmount0))
      .toString()
    const rewardValue0 = rewardAmount0

    let rewardAsset1 = '0'
    let rewardAmount1 = '0'
    let rewardValue1 = '0'
    const merklRewards = await getEulerMerklRewards(walletAddress)
    if(merklRewards.length > 0) {
      const [baseReward] = merklRewards
      const rewardDecimals = baseReward.reward.decimals
      rewardAsset1 = baseReward.reward.symbol
      rewardAmount1 = new Decimal(baseReward.accumulated)
        .div(10 ** rewardDecimals)
        .toString()
      rewardValue1 = String(Number(rewardAmount1) * baseReward.tokenPrice)
    }

    const currentBlockNumber = await provider.getBlockNumber()
    const depositBlockNumber = firstDeposit ? firstDeposit.blockNumber : '0'
    const portfolioItem: PortfolioItem = {
      ...portfolioItemFactory(),
      type: 'Swap pool',
      name: 'euler',
      address: vaultAddress,
      depositTime: moment(depositTimestamp).format('YY/MM/DD HH:MM:SS'),
      depositAsset0: depositAsset0,
      depositAsset1: '',
      depositAmount0: roundToSignificantDigits(depositAmount0),
      depositAmount1: '',
      depositValue0: roundToSignificantDigits(depositValue0),
      depositValue1: '',
      depositValue: roundToSignificantDigits(depositValue0),
      rewardAsset0,
      rewardAsset1,
      rewardAmount0: roundToSignificantDigits(rewardAmount0),
      rewardAmount1: roundToSignificantDigits(rewardAmount1),
      rewardValue0: roundToSignificantDigits(rewardValue0),
      rewardValue1: rewardValue1 ? roundToSignificantDigits(rewardValue1) : '',
      rewardValue: roundToSignificantDigits(
        String(Number(rewardValue0 || 0) + Number(rewardValue1 || 0))
      ),
      totalDays: calculateDaysDifference(new Date(depositTimestamp), new Date(), 4),
      totalBlocks: (currentBlockNumber - Number(depositBlockNumber)).toString(),
      depositLink: `https://app.euler.finance/vault/${vaultAddress}?network=sonic`
    }

    const baseApr = calculateAPR(
      Number(portfolioItem.depositValue),
      Number(portfolioItem.rewardValue0),
      Number(portfolioItem.totalDays)
    )

    let merklRewardApr = rewardValue1 ? calculateAPR(
      Number(portfolioItem.depositValue),
      Number(portfolioItem.rewardValue1),
      Number(portfolioItem.totalDays)
    ) : 0
    // Rewards are available only for 1 month, convert annualized rate into 1 month rate
    merklRewardApr = merklRewardApr / 12

    portfolioItem.apr = roundToSignificantDigits((baseApr + merklRewardApr).toString())

    portfolioItems.push(portfolioItem)
  }

  return portfolioItems
}
