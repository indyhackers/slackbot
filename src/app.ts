import { App, type AppOptions } from "@slack/bolt";
import { welcomeMessage } from "./lang.ts";

export function createApp(options: AppOptions): App {
  const app = new App(options);

  app.event("team_join", async ({ event, client }) => {
    if (!event.user.is_bot) {
      await client.chat.postMessage({
        channel: event.user.id,
        text: welcomeMessage,
      });
    }
  });

  return app;
}
