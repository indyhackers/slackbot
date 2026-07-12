import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";

const app = createApp(loadConfig());

await app.start();
console.log("Indy Hackers Slack bot connected");

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
