import { createApp } from "./app.ts";
import { Config } from "./config.ts";

const config = Config.make();
const app = createApp(config);

await app.start();
app.logger.info("Indy Hackers Slack bot connected");

let stopping = false;

async function stop(signal: NodeJS.Signals): Promise<void> {
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
