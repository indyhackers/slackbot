import { DatabaseSync } from "node:sqlite";

import { App, type AppOptions } from "@slack/bolt";
import type { KnownBlock } from "@slack/types";
import { onboardingMessages, onboardingStoppedMessage } from "./lang.ts";

export function createApp(options: AppOptions): App {
  const app = new App(options);
  const database = new DatabaseSync(
    process.env.SLACKBOT_DB_PATH ?? "slackbot.db",
  );
  database.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_messages (
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      scheduled_message_id TEXT PRIMARY KEY
    ) STRICT
  `);
  const day = Number(process.env.ONBOARDING_DELAY_UNIT_MS ?? 86_400_000);

  app.event("team_join", async ({ event, client }) => {
    if (event.user.is_bot) {
      return;
    }

    for (const message of onboardingMessages) {
      const blocks: KnownBlock[] = [
        {
          type: "section",
          text: { type: "mrkdwn", text: message.text },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              action_id: "stop_onboarding",
              text: { type: "plain_text", text: "stop onboarding" },
            },
          ],
        },
      ];

      if (message.day === 0) {
        await client.chat.postMessage({
          channel: event.user.id,
          text: message.text,
          blocks,
        });
        continue;
      }

      const scheduled = await client.chat.scheduleMessage({
        channel: event.user.id,
        text: message.text,
        blocks,
        post_at: Math.floor((Date.now() + message.day * day) / 1_000),
      });
      if (scheduled.channel && scheduled.scheduled_message_id) {
        database
          .prepare(
            "INSERT INTO scheduled_messages VALUES (?, ?, ?)",
          )
          .run(event.user.id, scheduled.channel, scheduled.scheduled_message_id);
      }
    }
  });

  app.action("stop_onboarding", async ({ ack, body, client }) => {
    await ack();

    const userId = body.user.id;
    const scheduledMessages = database
      .prepare(
        "SELECT channel, scheduled_message_id FROM scheduled_messages WHERE user_id = ?",
      )
      .all(userId);
    await Promise.allSettled(
      scheduledMessages.map((message) =>
        client.chat.deleteScheduledMessage({
          channel: String(message.channel),
          scheduled_message_id: String(message.scheduled_message_id),
        }),
      ),
    );
    database
      .prepare("DELETE FROM scheduled_messages WHERE user_id = ?")
      .run(userId);
    await client.chat.postMessage({
      channel: userId,
      text: onboardingStoppedMessage,
    });
  });

  return app;
}
