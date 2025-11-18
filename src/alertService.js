import config from "./config.js";

const SLACK_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";

export async function sendSlackAlert({ targetAddress, formattedBalance }) {
  const message = `⚠️ *Low USDC balance detected for Credits account* ⚠️\nCurrent balance: *${formattedBalance} USDC* _(alert threshold ${config.minUsdcThreshold} USDC)_\nDeposit at address: *${targetAddress}*`;

  try {
    const response = await fetch(SLACK_POST_MESSAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${config.slackBotToken}`,
      },
      body: JSON.stringify({
        channel: config.alertChannelId,
        text: message,
      }),
    });

    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Unknown Slack API failure");
    }
    return payload;
  } catch (error) {
    console.error("Failed to send Slack alert", error);
    throw error;
  }
}
