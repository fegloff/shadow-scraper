import { ethers } from "ethers";
import BeefyVaultABI from '../../abi/BeefyVaultV7.json'
import ERC20_ABI from '../../abi/ERC20.json'
import { calculateAPR, portfolioItemFactory, roundToSignificantDigits } from "../helpers";
import moment from "moment";
import { PortfolioItem } from "../types";
import { getBeefyVaultUSDValue, getPpfsPrice } from "../../api/beefy-api";
import { calculateBeefyAPY } from "./helper";
import { getBeefyDeposits } from "../../api/beefy-subgraph";

const SONIC_RPC_URL = "https://rpc.soniclabs.com";
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const provider = new ethers.JsonRpcProvider(SONIC_RPC_URL);

const vaultArray = [
  // {
  //   name: 'beefy-frxusd',
  //   address:'0x0f61600BAE509820207827b7e3d108ceeeB23C48',
  //   url: 'https://app.beefy.com/vault/swapx-ichi-frxusd-scusd',
  //   type: 'vault'
  // },
  {
    name: 'beefy-wbtc-usdc.e',
    address:'0x920D88cA46041eFdB317c1a4150e8f0515e88D9B',
    url: 'https://app.beefy.com/vault/shadow-cow-sonic-wbtc-usdc.e-vault',
    type: 'vault'
  },
    {
    name: 'beefy-wbtc-scbtc',
    address:'0x7152bf607BD043084f265c649a09A8F90BBdBF1B',
    url: 'https://app.beefy.com/vault/swapx-ichi-wbtc-scbtc',
    type: 'vault'
  },
  
];

/**
 * Beefy is an autocompounding yield optimizer where users deposit LP tokens into vaults 
 * and receive mooTokens in return. The protocol automatically harvests rewards, swaps them, 
 * and reinvests to compound yield. User positions are valued using pricePerFullShare (PPFS), 
 * which represents the ratio between total assets in the vault and mooTokens in circulation.
 * 
 * Harvests occur periodically with fees split between the caller (0.05-0.5%), treasury, 
 * and strategist. APY is calculated based on underlying APR, compounding frequency, and fees.
 */
export const getBeefyInfo = async (walletAddress: string) => {
  const portfolioItems: PortfolioItem[] = [];
  const formattedWalletAddress = ethers.getAddress(walletAddress);
  
  const vaultPromises = vaultArray.map(async (vault) => { 
    // Create contract instances
    const vaultContract = new ethers.Contract(vault.address, BeefyVaultABI, provider);
    const assetAddress = await vaultContract.want();
    const assetContract = new ethers.Contract(assetAddress, ERC20_ABI, provider);

    // Get token details
    const assetSymbol = await assetContract.symbol();
    const assetDecimals = await assetContract.decimals();

    // Get user's mooToken balance (shares)
    const sharesBalance = await vaultContract.balanceOf(formattedWalletAddress);
    
    // If user has no shares, return null
    if (sharesBalance === 0n) {
      return null;
    }

    const currentPPFS = await vaultContract.getPricePerFullShare() as bigint;
    const transactions = await getBeefyDeposits(walletAddress, vault.address);
    
    const firstDeposit = transactions[transactions.length - 1];
    if(!firstDeposit) {
      return null;
    }
    
    const firstDepositTimestamp = new Date(parseInt(firstDeposit.timestamp) * 1000).toISOString();

    // Get PPFS at time of deposit
    const depositPpfsPrice = await getPpfsPrice(vault.address, firstDepositTimestamp, firstDeposit.blockNumber);
    const depositPPFS = depositPpfsPrice ? BigInt(Math.floor(+depositPpfsPrice.ppfsPrice * 1e18)) : 0n;
    
    // Calculate token amounts (in the underlying LP token)
    const currentUnderlyingTokens = (sharesBalance * currentPPFS) / (10n ** 18n);
    const initialUnderlyingTokens = (sharesBalance * depositPPFS) / (10n ** 18n);
    const gainTokens = currentUnderlyingTokens - initialUnderlyingTokens;
    
    // Token amount with proper decimal formatting
    const initialTokensFormatted = Number(initialUnderlyingTokens) / (10 ** Number(assetDecimals));
    const gainTokensFormatted = Number(gainTokens) / (10 ** Number(assetDecimals));
    
    // Get USD values
    const initialDepositUSD = await getBeefyVaultUSDValue(vault.address, initialUnderlyingTokens);
    const currentValueUSD = await getBeefyVaultUSDValue(vault.address, currentUnderlyingTokens);
    const gainUSD = currentValueUSD - initialDepositUSD; // Calculate gains directly from USD values
    
    // Calculate time metrics
    const depositDate = new Date(firstDepositTimestamp);
    const currentDate = new Date();
    const daysElapsed = (currentDate.getTime() - depositDate.getTime()) / (MILLISECONDS_PER_DAY);
    
    // Calculate performance metrics
    
    const apr = calculateAPR(initialDepositUSD, gainUSD, daysElapsed);
    const apy = calculateBeefyAPY(currentUnderlyingTokens, initialUnderlyingTokens, firstDepositTimestamp)
    console.log(`APY for ${vault.name} vault:`, apy, apr)

    const currentBlockNumber = await provider.getBlockNumber();
    const totalBlocks = currentBlockNumber - +firstDeposit.blockNumber;
    
    const portfolioItem: PortfolioItem = {
      ...portfolioItemFactory(),
      type: vault.type,
      name: vault.name,
      address: vault.address,
      depositTime: moment(firstDepositTimestamp).format('YY/MM/DD HH:MM:SS'),
      depositAsset0: assetSymbol,
      depositAsset1: '',
      depositAmount0: roundToSignificantDigits(`${initialTokensFormatted}`), // Token amount
      depositAmount1: '',
      depositValue0: roundToSignificantDigits(`${initialDepositUSD}`, 2), // USD value
      depositValue1: '',
      depositValue: roundToSignificantDigits(`${initialDepositUSD}`, 2),
      rewardAsset0: assetSymbol,
      rewardAsset1: '',
      rewardAmount0: roundToSignificantDigits(`${gainTokensFormatted}`), // Gain in tokens
      rewardAmount1: '',
      rewardValue0: roundToSignificantDigits(`${gainUSD}`, 2), // Gain in USD
      rewardValue1: '',
      rewardValue: roundToSignificantDigits(`${gainUSD}`, 2),
      totalDays: roundToSignificantDigits(`${daysElapsed}`, 4),
      totalBlocks: `${totalBlocks}`,
      apr: roundToSignificantDigits(apr.toString()),
      depositLink: vault.url
    };

    return portfolioItem;
  });

  const results = await Promise.all(vaultPromises);

  results.forEach(item => {
    if (item) portfolioItems.push(item);
  });

  return portfolioItems;
};
