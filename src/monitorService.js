import { parseUnits } from 'ethers';
import config from './config.js';
import { fetchUsdcBalanceDetails } from './balanceService.js';
import { sendSlackAlert } from './alertService.js';

function toBaseUnitsThreshold(decimals) {
  try {
    return parseUnits(config.minUsdcThreshold.toString(), decimals);
  } catch (error) {
    console.error('Failed to parse MIN_USDC_THRESHOLD', error);
    throw error;
  }
}

async function runBalanceCheck() {
  const details = await fetchUsdcBalanceDetails();
  const thresholdBaseUnits = toBaseUnitsThreshold(details.decimals);

  if (details.rawBalance < thresholdBaseUnits) {
    await sendSlackAlert({
      targetAddress: details.targetAddress,
      formattedBalance: details.formattedBalance,
    });
  }
}

export function startBalanceMonitor() {
  const intervalMs = config.balanceCheckIntervalMinutes * 60 * 1000;

  const execute = async () => {
    try {
      await runBalanceCheck();
    } catch (error) {
      console.error('Balance monitor run failed', error);
    }
  };

  execute();
  setInterval(execute, intervalMs);
}
