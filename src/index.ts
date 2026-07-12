import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";

const app = createApp(loadConfig());

await app.start();
console.log("Indy Hackers Slack bot connected");
