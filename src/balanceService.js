import { Contract, JsonRpcProvider, formatUnits } from 'ethers';
import config from './config.js';

const USDC_DECIMALS_FALLBACK = 6;
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const provider = new JsonRpcProvider(config.polygonRpcUrl);
const contract = new Contract(config.usdcContractAddress, ERC20_ABI, provider);
const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

async function fetchBalanceDetails() {
  try {
    const [rawBalance, decimals] = await Promise.all([
      contract.balanceOf(config.targetAddress),
      contract.decimals().catch(() => USDC_DECIMALS_FALLBACK),
    ]);

    const resolvedDecimals = typeof decimals === 'number' ? decimals : USDC_DECIMALS_FALLBACK;
    const balanceString = formatUnits(rawBalance, resolvedDecimals);
    const balanceNumber = Number(balanceString);
    const formatted = Number.isNaN(balanceNumber)
      ? balanceString
      : numberFormatter.format(balanceNumber);

    return {
      targetAddress: config.targetAddress,
      rawBalance,
      decimals: resolvedDecimals,
      formattedBalance: formatted,
      balanceAsString: balanceString,
    };
  } catch (error) {
    console.error('Failed to fetch USDC balance', error);
    throw error;
  }
}

export async function fetchFormattedUsdcBalance() {
  const { targetAddress, formattedBalance } = await fetchBalanceDetails();
  return { targetAddress, formattedBalance };
}

export async function fetchUsdcBalanceDetails() {
  return fetchBalanceDetails();
}
