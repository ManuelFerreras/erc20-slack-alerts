import crypto from 'crypto';

const SIGNATURE_VERSION = 'v0';
const FIVE_MINUTES_IN_SECONDS = 60 * 5;

export function verifySlackRequest({
  signingSecret,
  requestTimestamp,
  requestSignature,
  rawBody,
}) {
  if (!signingSecret || !requestTimestamp || !requestSignature || !rawBody) {
    return false;
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const ts = Number(requestTimestamp);
  if (Number.isNaN(ts) || Math.abs(currentTimestamp - ts) > FIVE_MINUTES_IN_SECONDS) {
    return false;
  }

  const basestring = `${SIGNATURE_VERSION}:${requestTimestamp}:${rawBody}`;
  const hmac = crypto.createHmac('sha256', signingSecret);
  const digest = `${SIGNATURE_VERSION}=${hmac.update(basestring).digest('hex')}`;

  const provided = Buffer.from(requestSignature, 'utf8');
  const expected = Buffer.from(digest, 'utf8');

  if (provided.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(provided, expected);
}
