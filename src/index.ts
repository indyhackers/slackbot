import { App } from "@slack/bolt";
import { makeConfig } from "./config.ts";
import { registerOnboarding } from "./onboarding.ts";

const config = makeConfig();
const app = new App({
  token: config.SLACK_BOT_TOKEN,
  appToken: config.SLACK_APP_TOKEN,
  socketMode: true,
});

registerOnboarding(app, config.ONBOARDING_INTERVAL_MS);

await app.start();
app.logger.info("Indy Hackers Slack bot connected");

let stopping = false;

async function stop(signal: NodeJS.Signals) {
  if (stopping) {
    return;
  }

  stopping = true;
  app.logger.info(`received ${signal}; stopping Indy Hackers Slack bot`);

  try {
    await app.stop();
  } catch (error) {
    app.logger.error("failed to stop Indy Hackers Slack bot", error);
    process.exitCode = 1;
  }
}

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => stop(signal));
}
