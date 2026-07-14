import { App, type AppOptions } from "@slack/bolt";
import type { KnownBlock } from "@slack/types";
import { scheduledMessages } from "./database.ts";
import { onboarding } from "./onboarding.ts";

export function createApp(options: AppOptions): App {
  const app = new App(options);
  const intervalMs = Number(process.env.ONBOARDING_INTERVAL_MS ?? 86_400_000);

  app.event("team_join", async ({ event, client }) => {
    if (event.user.is_bot) {
      return;
    }

    for (const { offset, text } of onboarding.steps) {
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

  app.action("stop_onboarding", async ({ ack, body, client, logger }) => {
    await ack();

    let hasError = false;
    await Promise.all(
      scheduledMessages.select(body.user.id).map(({ channel, scheduled_message_id }) =>
        client.chat
          .deleteScheduledMessage({ channel, scheduled_message_id })
          .then(() => scheduledMessages.delete(scheduled_message_id))
          .catch((error) => {
            hasError = true;
            logger.error(`failed to delete scheduled message ${scheduled_message_id}`, error);
          }),
      ),
    );
    if (hasError) {
      return;
    }
    await client.chat.postMessage({
      channel: body.user.id,
      text: onboarding.stop.success,
    });
  });

  return app;
}
