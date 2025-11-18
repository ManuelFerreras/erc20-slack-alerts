import cron from "node-cron";
import config from "./config.js";

const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";
const SLACK_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";

const RINGO_PROMPT = `
You are **Ringo**, the mascot and voice of **Ringo**, a P2P predictions app that lives on X (Twitter).  
Ringo is an **angry, spicy chicken**: competitive, sarcastic in a fun way, high-energy, and obsessed with making people place bold predictions against each other.

Your job is to generate **ONE** short message every morning to hype up the Ringo team at the start of the day.

IMPORTANT:
- Act as if your **creativity/temperature is set to the maximum**.
- Every time you answer, the message must feel **completely fresh and different** from previous ones: different metaphors, different angles, different mini-stories, different rhythm. Avoid repeating phrases, structures, or punchlines.

Guidelines for the message:
- Voice: motivational, spicy, slightly trash-talky but always positive and supportive.
- Style: dynamic, fun, startup-warrior mindset. Think “we’re building the future of prediction markets”.
- Persona details to weave in:
  - You are a spicy, angry chicken.
  - You live in X, constantly listening to tweets and turning them into prediction battles between users.
  - You love risk, conviction, and shipping fast.
- Length: 3–6 sentences max.
- Tone: pump the team up to build, ship, and break limits TODAY.
- Optional: 1–3 emojis that fit the vibe (🔥 🐔 ⚡️ 💥 etc.), but don’t overdo it.
- No hashtags, no links, no corporate jargon.
- Make it in English and sound as native as possible, not robotic.
- Current stage: early-stage, hungry startup building a product people LOVE to use.

Now, generate **only the message itself**, nothing else.
`.trim();

async function generateDailyHypeMessage() {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: config.dailyHypeModel,
      temperature: 1,
      messages: [
        {
          role: "system",
          content: RINGO_PROMPT,
        },
        {
          role: "user",
          content: "Give today's hype message following the persona rules.",
        },
      ],
    }),
  });

  if (!response.ok) {
    let details = "";
    try {
      const payload = await response.json();
      details = payload.error?.message || JSON.stringify(payload);
    } catch (error) {
      details = `Failed to parse error payload: ${error.message}`;
    }
    throw new Error(`OpenAI API request failed: ${details}`);
  }

  const payload = await response.json();
  const message = payload?.choices?.[0]?.message?.content?.trim();

  if (!message) {
    throw new Error("OpenAI API returned an empty response");
  }

  return message;
}

async function postDailyHypeToSlack(text) {
  const response = await fetch(SLACK_POST_MESSAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${config.slackBotToken}`,
    },
    body: JSON.stringify({
      channel: config.dailyHypeChannelId,
      text,
    }),
  });

  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(
      payload.error || "Unknown Slack API error while posting hype"
    );
  }
  return payload;
}

async function runDailyHypeJob(trigger = "manual") {
  const hypeText = await generateDailyHypeMessage();
  await postDailyHypeToSlack(hypeText);
  console.log(`[daily-hype] Sent hype message via ${trigger}`);
}

let jobInstance;
let isRunning = false;

async function guardRun(trigger) {
  if (isRunning) {
    console.warn(
      "[daily-hype] Previous run still executing, skipping new trigger"
    );
    return;
  }

  isRunning = true;
  try {
    await runDailyHypeJob(trigger);
  } catch (error) {
    console.error("[daily-hype] Failed to send hype message", error);
  } finally {
    isRunning = false;
  }
}

export function startDailyHypeScheduler() {
  if (jobInstance) {
    return jobInstance;
  }

  const cronExpression = `${config.dailyHypeUtcMinute} ${config.dailyHypeUtcHour} * * *`;
  jobInstance = cron.schedule(
    cronExpression,
    () => {
      guardRun("scheduled");
    },
    { timezone: "UTC" }
  );

  console.log(
    `[daily-hype] Scheduler registered for ${cronExpression} UTC using model ${config.dailyHypeModel}`
  );

  return jobInstance;
}

export async function sendDailyHypeNow() {
  await guardRun("manual");
}
