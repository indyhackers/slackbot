import { App, type AppOptions } from "@slack/bolt";
import type { KnownBlock } from "@slack/types";
import { scheduledMessages } from "./database.ts";
import { onboarding, onboardingStopped } from "./onboarding.ts";

export function createApp(options: AppOptions): App {
  const app = new App(options);
  const intervalMs = Number(process.env.ONBOARDING_INTERVAL_MS ?? 86_400_000);

  app.event("team_join", async ({ event, client }) => {
    if (event.user.is_bot) {
      return;
    }

    for (const { offset, text } of onboarding) {
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

      if (offset === 0) {
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
        post_at: Math.floor((Date.now() + offset * intervalMs) / 1_000),
      });
      if (scheduled.channel && scheduled.scheduled_message_id) {
        scheduledMessages.insert({
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
    const errors: unknown[] = [];
    for (const message of scheduledMessages.select(userId)) {
      try {
        await client.chat.deleteScheduledMessage({
          channel: message.channel,
          scheduled_message_id: message.scheduled_message_id,
        });
        scheduledMessages.delete(message.scheduled_message_id);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, "failed to delete scheduled onboarding messages");
    }
    await client.chat.postMessage({
      channel: userId,
      text: onboardingStopped,
    });
  });

  return app;
}
