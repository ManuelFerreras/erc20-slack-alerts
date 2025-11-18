# Polygon USDC Balance Slack Bot

A minimal Express app that serves a Slack slash command `/balance`. Slack calls `/slack/commands/balance`, the app verifies the request with Slack's signing secret, looks up a hardcoded Polygon wallet's USDC balance via ethers, and replies with an ephemeral Slack message.

## Requirements

- Node.js 18+
- Slack workspace with permissions to create a slash command
- Polygon RPC endpoint (Alchemy, Infura, etc.)

## Environment Variables

| Variable                         | Description                                         |
| -------------------------------- | --------------------------------------------------- |
| `PORT`                           | HTTP port (defaults to `3000`).                     |
| `SLACK_SIGNING_SECRET`           | Slack app signing secret for verifying requests.    |
| `POLYGON_RPC_URL`                | Polygon RPC URL (HTTPS).                            |
| `USDC_CONTRACT_ADDRESS`          | USDC contract address on Polygon.                   |
| `TARGET_ADDRESS`                 | The Polygon wallet whose balance will be shown.     |
| `SLACK_BOT_TOKEN`                | Bot token with `chat:write` scope to post alerts.   |
| `ALERT_CHANNEL_ID`               | Channel ID where low-balance alerts will be posted. |
| `MIN_USDC_THRESHOLD`             | Minimum USDC balance (decimal) before alerts fire.  |
| `BALANCE_CHECK_INTERVAL_MINUTES` | Frequency (minutes) for automatic checks.           |

Create a `.env` file locally with the values above (Railway users: set them in the project variables UI).

## Setup

```bash
npm install
npm run dev # or npm start
```

The server listens on `0.0.0.0:$PORT` and exposes:

- `GET /health` → `{ "status": "ok" }`
- `POST /slack/commands/balance` → Slack slash command handler

## Slack Slash Command & Alerts Configuration

1. In your Slack app configuration, create a slash command `/balance`.
2. Set the Request URL to `https://<your-domain>/slack/commands/balance`.
3. Copy the Slack signing secret into `SLACK_SIGNING_SECRET`.
4. Create or reuse a bot token with `chat:write`, store it in `SLACK_BOT_TOKEN`, and set `ALERT_CHANNEL_ID` to the channel where alerts should post.
5. Set `MIN_USDC_THRESHOLD` (e.g., `2500`) and `BALANCE_CHECK_INTERVAL_MINUTES` (e.g., `10`) to control alerting sensitivity.
6. Install the app to your workspace and test `/balance` in a channel.

### Automatic Low-Balance Alerts

The server runs a background job every `BALANCE_CHECK_INTERVAL_MINUTES`. If the wallet’s USDC balance falls below `MIN_USDC_THRESHOLD`, it posts a warning to `ALERT_CHANNEL_ID`. The interval and threshold are environment-driven so you can tune them without redeploying.

## Railway Deployment

1. Push this repo to GitHub and create a new Railway project from it.
2. Set the environment variables in Railway's **Variables** tab (`PORT` is provided automatically; still keep the default logic locally).
3. Deploy; Railway will run `npm install` and `npm start` per `package.json`.

## Usage

Type `/balance` in Slack. If the request verifies and the Polygon RPC call succeeds you will see:

```
USDC balance on Polygon
Address: 0x...
Balance: 1,234.5678 USDC
```

If the Polygon request fails, the bot replies with a friendly error and logs details to stdout for debugging.
