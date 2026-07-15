import { createApp } from "./app.ts";

const app = createApp({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

await app.start();
app.logger.info("Indy Hackers Slack bot connected");

let stopping = false;

async function stop(signal: NodeJS.Signals): Promise<void> {
  if (stopping) {
    return;
  }

  stopping = true;
  console.log(`received ${signal}; stopping Indy Hackers Slack bot`);

  try {
    await app.stop();
  } catch (error) {
    console.error("failed to stop Indy Hackers Slack bot", error);
    process.exitCode = 1;
  }
}

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => stop(signal));
}
