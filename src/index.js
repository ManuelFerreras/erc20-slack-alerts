import express from 'express';
import config from './config.js';
import { verifySlackRequest } from './slackVerification.js';
import { fetchFormattedUsdcBalance } from './balanceService.js';
import { startBalanceMonitor } from './monitorService.js';

const app = express();

const rawBodyMiddleware = express.raw({
  type: 'application/x-www-form-urlencoded',
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/slack/commands/balance', rawBodyMiddleware, async (req, res) => {
  const timestamp = req.headers['x-slack-request-timestamp'];
  const signature = req.headers['x-slack-signature'];
  const rawBody = req.rawBody || req.body?.toString?.('utf8') || '';

  const isValid = verifySlackRequest({
    signingSecret: config.slackSigningSecret,
    requestTimestamp: timestamp,
    requestSignature: signature,
    rawBody,
  });

  if (!isValid) {
    return res.status(401).send('Invalid Slack signature');
  }

  const params = new URLSearchParams(rawBody);
  const command = params.get('command');

  if (command !== '/balance') {
    return res.status(400).send('Unsupported command');
  }

  try {
    const { targetAddress, formattedBalance } = await fetchFormattedUsdcBalance();

    return res.json({
      response_type: 'ephemeral',
      text: 'USDC balance on Polygon',
      attachments: [
        {
          text: `Address: ${targetAddress}\nBalance: ${formattedBalance} USDC`,
        },
      ],
    });
  } catch (error) {
    console.error('Balance command failed', error);
    return res.json({
      response_type: 'ephemeral',
      text: "Sorry, I couldn't fetch the balance right now. Please try again later.",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server listening on port ${config.port}`);
});

startBalanceMonitor();
