import { App, type AppOptions } from "@slack/bolt";
import type { KnownBlock } from "@slack/types";
import {
  deleteScheduledMessages,
  insert,
  select,
} from "./database.ts";
import { onboarding, onboardingStoppedMessage } from "./lang.ts";

export function createApp(options: AppOptions): App {
  const app = new App(options);
  const day = Number(process.env.ONBOARDING_DELAY_UNIT_MS ?? 86_400_000);

  app.event("team_join", async ({ event, client }) => {
    if (event.user.is_bot) {
      return;
    }

    for (const [days, text] of Object.entries(onboarding)) {
      const blocks: KnownBlock[] = [
        {
          type: "section",
          text: { type: "mrkdwn", text },
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

      if (days === "0") {
        await client.chat.postMessage({
          channel: event.user.id,
          text,
          blocks,
        });
        continue;
      }

      const scheduled = await client.chat.scheduleMessage({
        channel: event.user.id,
        text,
        blocks,
        post_at: Math.floor((Date.now() + Number(days) * day) / 1_000),
      });
      if (scheduled.channel && scheduled.scheduled_message_id) {
        insert({
          user_id: event.user.id,
          channel: scheduled.channel,
          scheduled_message_id: scheduled.scheduled_message_id,
        });
      }
    }
  });

  app.action("stop_onboarding", async ({ ack, body, client }) => {
    await ack();

    const userId = body.user.id;
    await Promise.allSettled(
      select(userId).map((message) =>
        client.chat.deleteScheduledMessage(message),
      ),
    );
    deleteScheduledMessages(userId);
    await client.chat.postMessage({
      channel: userId,
      text: onboardingStoppedMessage,
    });
  });

  return app;
}
