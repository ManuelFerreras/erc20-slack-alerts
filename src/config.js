import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
  "SLACK_SIGNING_SECRET",
  "POLYGON_RPC_URL",
  "USDC_CONTRACT_ADDRESS",
  "TARGET_ADDRESS",
  "SLACK_BOT_TOKEN",
  "ALERT_CHANNEL_ID",
  "MIN_USDC_THRESHOLD",
  "BALANCE_CHECK_INTERVAL_MINUTES",
  "OPENAI_API_KEY",
  "DAILY_HYPE_CHANNEL_ID",
  "DAILY_HYPE_UTC_HOUR",
  "DAILY_HYPE_UTC_MINUTE",
];

const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`
  );
  process.exit(1);
}

const port = parseInt(process.env.PORT || "3000", 10);
const minThreshold = Number(process.env.MIN_USDC_THRESHOLD);
const intervalMinutes = parseInt(
  process.env.BALANCE_CHECK_INTERVAL_MINUTES,
  10
);
const hypeHour = parseInt(process.env.DAILY_HYPE_UTC_HOUR, 10);
const hypeMinute = parseInt(process.env.DAILY_HYPE_UTC_MINUTE, 10);
const rawWeekdays = (process.env.DAILY_HYPE_WEEKDAYS || "*").trim();

if (Number.isNaN(port) || port <= 0) {
  console.error("PORT must be a positive integer");
  process.exit(1);
}

if (Number.isNaN(minThreshold) || minThreshold <= 0) {
  console.error("MIN_USDC_THRESHOLD must be a positive number");
  process.exit(1);
}

if (Number.isNaN(intervalMinutes) || intervalMinutes <= 0) {
  console.error("BALANCE_CHECK_INTERVAL_MINUTES must be a positive integer");
  process.exit(1);
}

if (Number.isNaN(hypeHour) || hypeHour < 0 || hypeHour > 23) {
  console.error("DAILY_HYPE_UTC_HOUR must be an integer between 0 and 23");
  process.exit(1);
}

if (Number.isNaN(hypeMinute) || hypeMinute < 0 || hypeMinute > 59) {
  console.error("DAILY_HYPE_UTC_MINUTE must be an integer between 0 and 59");
  process.exit(1);
}

function parseWeekdays(value) {
  if (value === "*" || value === "") {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  const parts = value.split(",").map((part) => part.trim());
  if (!parts.length) {
    throw new Error("DAILY_HYPE_WEEKDAYS must be comma-separated integers 0-6");
  }

  const parsed = parts.map((part) => {
    const day = Number(part);
    if (Number.isNaN(day) || day < 0 || day > 6) {
      throw new Error("DAILY_HYPE_WEEKDAYS supports integers between 0 and 6");
    }
    return day;
  });

  return Array.from(new Set(parsed)).sort((a, b) => a - b);
}

let hypeWeekdays;
try {
  hypeWeekdays = parseWeekdays(rawWeekdays);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const hypeWeekdayCronField =
  hypeWeekdays.length === 7 ? "*" : hypeWeekdays.join(",");

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
  openAiApiKey: process.env.OPENAI_API_KEY,
  dailyHypeChannelId: process.env.DAILY_HYPE_CHANNEL_ID,
  dailyHypeUtcHour: hypeHour,
  dailyHypeUtcMinute: hypeMinute,
  dailyHypeWeekdays: hypeWeekdays,
  dailyHypeWeekdayCronField: hypeWeekdayCronField,
  dailyHypeModel: process.env.DAILY_HYPE_MODEL || "gpt-4o-mini",
};

export default config;
