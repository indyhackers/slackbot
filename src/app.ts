import { App } from "@slack/bolt";

import type { SlackConfig } from "./config.ts";

export function createApp(config: SlackConfig): App {
  return new App({
    token: config.botToken,
    appToken: config.appToken,
    socketMode: true,
  });
}
