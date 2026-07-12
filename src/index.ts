import { format } from "node:util";

import { createApp } from "./app.ts";
import { connectedMessage, stopFailedMessage, stoppingMessage } from "./lang.ts";

const app = createApp({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

await app.start();
console.log(connectedMessage);

let stopping = false;

async function stop(signal: NodeJS.Signals): Promise<void> {
  if (stopping) {
    return;
  }

  stopping = true;
  console.log(format(stoppingMessage, signal));

  try {
    await app.stop();
  } catch (error) {
    console.error(stopFailedMessage, error);
    process.exitCode = 1;
  }
}

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => stop(signal));
}
