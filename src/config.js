import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'SLACK_SIGNING_SECRET',
  'POLYGON_RPC_URL',
  'USDC_CONTRACT_ADDRESS',
  'TARGET_ADDRESS',
  'SLACK_BOT_TOKEN',
  'ALERT_CHANNEL_ID',
  'MIN_USDC_THRESHOLD',
  'BALANCE_CHECK_INTERVAL_MINUTES',
];

const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const port = parseInt(process.env.PORT || '3000', 10);
const minThreshold = Number(process.env.MIN_USDC_THRESHOLD);
const intervalMinutes = parseInt(process.env.BALANCE_CHECK_INTERVAL_MINUTES, 10);

if (Number.isNaN(port) || port <= 0) {
  console.error('PORT must be a positive integer');
  process.exit(1);
}

if (Number.isNaN(minThreshold) || minThreshold <= 0) {
  console.error('MIN_USDC_THRESHOLD must be a positive number');
  process.exit(1);
}

if (Number.isNaN(intervalMinutes) || intervalMinutes <= 0) {
  console.error('BALANCE_CHECK_INTERVAL_MINUTES must be a positive integer');
  process.exit(1);
}

const config = {
  port,
  slackSigningSecret: process.env.SLACK_SIGNING_SECRET,
  polygonRpcUrl: process.env.POLYGON_RPC_URL,
  usdcContractAddress: process.env.USDC_CONTRACT_ADDRESS,
  targetAddress: process.env.TARGET_ADDRESS,
  slackBotToken: process.env.SLACK_BOT_TOKEN,
  alertChannelId: process.env.ALERT_CHANNEL_ID,
  minUsdcThreshold: minThreshold,
  balanceCheckIntervalMinutes: intervalMinutes,
};

export default config;
